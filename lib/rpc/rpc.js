'user strict'

var config = require('../config.js');
var networks = require('../networks.js');
var common = require('../util/common.js');
var async = require('async');
var environment = 'nodejs';
var _ = require('lodash');

var moduleData = {};
moduleData.isInitialized = false; // to determine whether the module is initiallized
moduleData.discoveryLoopTimer = false; // for node renewal loop
moduleData.network = null;
moduleData.nodeDB = null;
moduleData.connectionCache = {};
moduleData.tempStorage = {};

var RPCClient; // if the environment is not nodejs, we might use different interface
switch (environment) {
  case 'nodejs':
    RPCClient = require('./rpc-client.js');
    break;
}

/**
 * Initialize the module
 * @param  {array}   nodes    node database
 * @param  {json/string}   network  either livenet/testnet
 * @param  {Function} callback callback funtion
 */
var init = function(nodes, network, callback) {
  moduleData.isInitialized = true;
  moduleData.nodeDB = nodes || [];
  network = network || networks.livenet;
  if (_.isString(network)) {
    network = networks[network];
  }
  network.static_nodes.forEach(function(address) {
    addNodeIfNotExists({
      id: address,
      ip: address.split(':')[0],
      port: address.split(':')[1]
    });
  });
  moduleData.network = network;
  renewNodeDB(callback);
};

/**
 * Schedule the next node discovery process based on the number of alive nodes in the database
 */
var scheduleNextNodeDiscoveryProcess = function() {
  var nextLoopIn = config.rpc.renewal_too_few;
  var aliveNodes = getAliveNodes();

  moduleData.tempStorage.needMoreNodes = true;
  if (aliveNodes.length >= config.rpc.enough) {
    moduleData.tempStorage.needMoreNodes = false;
    nextLoopIn = config.rpc.renewal_enough;
  } else if (aliveNodes.length >= config.rpc.minimum) {
    nextLoopIn = config.rpc.renewal_few;
  } else {
    nextLoopIn = config.rpc.renewal_too_few;
    getNodesFromStaticHostnames();
  }
  moduleData.discoveryLoopTimer = setTimeout(renewNodeDB, nextLoopIn);
};

/**
 * Return a list of alive nodes in nodes database
 * @param  {Function} callback function(nodes)
 * @return {array}            a list of nodes
 */
var getAliveNodes = function(callback) {
  var expiryTime = new Date().getTime() - config.rpc.period_node_expiry;
  return moduleData.nodeDB.filter(function(record) {
    return record.alive && (record.last_success > expiryTime);
  });
};

var addNodeIfNotExists = function(node) {
  var found = false;
  var i, length;
  for (i = 0, length = moduleData.nodeDB.length; i < length; i++) {
    if (moduleData.nodeDB[i].id == node.id) {
      found = true;
      break;
    }
  }
  if (!found) {
    moduleData.nodeDB.push(node);
  }
};

/**
 * Try to connect to death nodes to see if they can be connected
 * @param  {Function} callback callback function
 */
var renewNodeDB = function(callback) {
  var expiryTime = new Date().getTime() - config.rpc.period_node_expiry;
  var nodes = moduleData.nodeDB.filter(function(node) { // filter nodes to renew
    return (moduleData.tempStorage.needMoreNodes || // add to get more nodes later
      !node.last_success || // has not ever connected to
      node.last_success < expiryTime); // expired node
  });
  async.each(nodes, function(node, done) {
    renewNode(node, function(){ done(); });
  }, function(){
    if (callback) {
      callback();
    }
    scheduleNextNodeDiscoveryProcess();
  });
};

/**
 * Try to open a connection to the node, to see if it's connectable
 * @param  {json}   node node to connect to
 * @param  {Function} done called when done
 */
var renewNode = function(node, done) {
  connectToNode(node, function(error, connection) {
    var now = new Date().getTime();
    if (error) { // update alive status and remove node if it is dead for an amount of time
      node.alive = false;
      // if it's dead for an amount of time, we remove it
      if (now - node.last_success > config.rpc.MAX_PERIOD_NODE_KEEPING) {
        moduleData.nodeDB.splice(moduleData.nodeDB.indexOf(node), 1);
        node();
      }
    } else {
      node.last_success = now;
      node.alive = true;
      if (moduleData.tempStorage.needMoreNodes) {
        getNodesFromANode(connection, function(){ done(); });
      } else {
        done();
      }
    }
  });
};


/**
 * get new nodes by RPC Node.List and add to database, after all are done, call calback function
 * @param  {RPC.Connection}   connection the connection the the node
 * @param  {Function} callback   callback function after database is updated with new nodes
 */
var getNodesFromANode = function(connection, callback){
  callback = callback || function(){};
  connection.callMethod('Node.List', {"Start":null,"Count":10}, function(error, data){
    if (error) {
      callback(error);
    } else {
      var now = (new Date()).getTime();
      data.addresses.forEach(function(address) {
        var parts = address.split(':');
        var node = {id: address, ip: parts[0], port: parts[1], last_success: now, alive: true};
        addNodeIfNotExists(node);
      });
    }
  }, config.rpc.REQUEST_TIMEOUT);
};

/**
 * get nodes from statis hostname, then call renewNodes to check for whether they are alive
 * @param  {boolean} needMoreNodes determine whether to get more nodes from those new nodes provided
 */
var getNodesFromStaticHostnames = function() {
  network.static_hostnames.forEach(function(hostname) {
    RPCClient.getRPCAddressesFromHostname(hostname, function(error, addresses){
      if (!error) {
        addresses.forEach(function(address) {
          address.id = address.ip + ':' + address.port;
          addNodeIfNotExists(address);
        });
      } else {
        console.log('Error when getting node addresses from static hostname: ', error);
      }
    });
  });
};

/**
 * get from cache or create new connection to a node
 * @param  {node}   node     node description
 * @param  {Function} callback (error, connection)
 */
var connectToNode = function(node, callback) {
  var cache = moduleData.connectionCache[node.id];
  var errorCallback = function(error){ callback(error); };
  var successCallback = function(){
    cache.removeListener('fail', errorCallback);
    callback(null, cache);
  };
  if (cache) { // Either connected or connecting
    if (cache.status == 'connected') {
      process.nextTick(function(){ callback(null, cache); });
    } else {
      cache
        .once('fail', errorCallback)
        .once('success', successCallback);
    }
  } else { // No connection yet
    moduleData.connectionCache[node.id] = cache = new RPCClient.Connection(node);
    cache
      .once('fail', function(){ delete moduleData.connectionCache[node.id]; })
      .once('ended', function(){ delete moduleData.connectionCache[node.id]; })
      .once('fail', errorCallback)
      .once('success', successCallback);
  }
};

// Transaction broadcasting supporting functions
// ---------------------------------------------

var getConnectionsForBroadcasting = function(callback) {
  var aliveNodes = getAliveNodes();
  var conns = [];
  aliveNodes = common.shuffleArray(aliveNodes);

  async.eachLimit(aliveNodes, config.rpc.enough, function(node, callback) {
    if (conns.length < config.rpc.enough) {
      connectToNode(node, function(error, connection){
        if (!error) {
          conns.push(connection);
        }
        callback();
      });
    } else {
      callback('enough connection');
    }
  }, function() {
    if (conns.length < config.rpc.minimum) {
      callback(new Error('not enough nodes'));
    } else {
      callback(null, conns);
    }
  });
};

// TODO: process the case of error like "link to unconfirmed transaction or so"
var broadcastTransaction = function(method, txObject, callback) {
  var params = txObject.getRPCMessage();
  callback = callback || function(){};

  getConnectionsForBroadcasting(function(error, connections) {
    var results = [];
    if (error) {
      callback(error);
    } else {
      async.each(connections, function(conn, callback) {
        conn.callMethod(method, params, function(error, result) {
          results.push(result); // result can be undefined, do not care
          callback();
        }, config.rpc.REQUEST_TIMEOUT);
      }, function(error) {
        // Remove all undefined result caused by error when calling the remote procedure
        results = results.filter(function(result) {
          return result;
        });
        if (results.length < config.rpc.minimum) {
          callback(new Error('not enough nodes accepting/receiving the transaction'));
        } else {
          txObject.updateInfoFromRPC(results);
          callback(null, results);
        }
      });
    }
  });
};

var broadcastTransactions = function(method, txObjects, callback) {
  var params = [];
  txObjects.forEach(function(txObject){
    params.push(txObject.getRPCMessage());
  });
  callback = callback || function(){};

  getConnectionsForBroadcasting(function(error, connections) {
    var resultSets = [];
    if (error) {
      callback(error);
    } else {
      async.each(connections, function(conn, callback) {
        conn.callMethod(method, params, function(error, resultSet) {
          resultSets.push(resultSet); // a set can be undefined, do not care
          callback();
        }, config.rpc.REQUEST_TIMEOUT);
      }, function(error) {
        // Remove all undefined set caused by error when calling the remote procedure
        resultSets = resultSets.filter(function(resultSet) { return resultSet; });
        if (resultSets.length < config.rpc.minimum) {
          callback(new Error('not enough nodes accepting/receiving the transaction'));
        } else {
          for (var i = 0, length = txObjects.length; i < length; i++) {
            var txResults = [], txObject = txObjects[i];
            for (var j = 0, totalSet = resultSets.length; j < totalSet; j++) {
              txResults.push(resultSets[j][i]);
            }
            txObject.updateInfoFromRPC(txResults);
          }
          callback(null, resultSets);
        }
      });
    }
  });
};

// temporary function to broadcast the payment
var broadcastPayment = function(currency, payment, callback, count) {
  var data = {
    currency: currency,
    payment: payment
  };
  if (count) {
    data.count = count;
  }

  getConnectionsForBroadcasting(function(error, connections) {
    async.each(connections, function(conn, callback) {
      conn.callMethod('Transaction.Pay', data, function(error, data){
        callback(undefined, error || data);
      });
    }, function(){
      if (callback) {
        callback();
      }
    });
  });
};

// Transaction reading supporting functions
// ----------------------------------------
var readDataFromNode = function(method, params, callback) {
  var dataRead = null;
  var err = new Error('Cannot connect to any nodes');
  var nodes = getAliveNodes();

  if (nodes.length === 0) {
    callback('Can not get any nodes to read');
  }
  nodes = common.shuffleArray(nodes);
  async.eachLimit(nodes, 1, function(node, callback) {
    connectToNode(node, function(error, connection) {
      if (error) {
        callback(); // call done to allow async to fallback to next node
      } else {
        connection.callMethod(method, params, function(error, result) {
          if (error) {
            err = error;
            callback(); // call done to allow async to fallback to next node
          } else {
            dataRead = result;
            callback('Got result'); // callback with error to prevent fallback
          }
        }, config.rpc.REQUEST_TIMEOUT);
      }
    });
  }, function() {
    if (dataRead) {
      callback(null, dataRead);
    } else {
      callback(err);
    }
  });

};




/**
 * Helper to export functions, which will check for whether this module is initialized first
 * @param  {Function} func function exported
 * @return {function}      function wrapped
 */
var exportFunction = function(func){
  return function() {
    if (!moduleData.isInitialized) {
      throw new Error('Module has not been initialized yet');
    } else {
      func.apply(undefined, arguments);
    }
  };
};

/**
 * For singular API
 * @param  {string} method method name
 * @return {Function}
 */
var broadcastTransactionFunc = function(method) {
  return function(object, callback) {
    broadcastTransaction(method, object, callback);
  };
};

/**
 * For plural API
 * @param  {string} method method name
 * @return {Function}
 */
var broadcastTransactionsFunc = function(method) {
  return function(object, callback) {
    broadcastTransactions(method, object, callback);
  };
};

var readDataFunc = function(method) {
  return function(params, callback) {
    readDataFromNode(method, params, callback);
  };
};

module.exports = {
  init: init,
  registerAsset: exportFunction(broadcastTransactionFunc('Asset.Register')),
  issueBitmark: exportFunction(broadcastTransactionFunc('Bitmark.Issue')),
  issueBitmarks: exportFunction(broadcastTransactionsFunc('Bitmarks.Issue')),
  transferBitmark: exportFunction(broadcastTransactionFunc('Bitmark.Transfer')),
  readTransaction: exportFunction(readDataFunc('Transaction.Get')),
  readAsset: exportFunction(readDataFunc('Assets.Get')),
  broadcastPayment: broadcastPayment,
  getNodes: function(){ return moduleData.nodeDB; }
};