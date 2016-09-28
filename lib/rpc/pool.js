/**
 * START
 *  We should get more nodes until
 *  +   more connection than rpc.enoughActivePeer are opens
 *  +   more db records than rpc.enoughPeerRecord
 * BROADCAST DATA
 *  1. Clean all ended connections
 *  2. Push all records in db to the queue to connect with the priority of
 *     + Has connection cache => highest priority
 *     + Priority down by last alive point
 *  3. Connect to each node in Queue to broadcast data until enough
 *     + Do we consider getting more nodes while broadcasting data?
 */
var MAX_PARALLEL_REQUESTS = 5;
var GET_MORE_NODES_FROM_HOSTNAME_INTERVAL = 60*60*1000; // one hour

var dns = require('dns');
var config = require(global.__baseBitmarkLibModulePath + 'lib/config.js');
var rpcConfig = config.rpc;
var networks = require(global.__baseBitmarkLibModulePath + 'lib/networks.js');
var commonUtil = require(global.__baseBitmarkLibModulePath + 'lib/util/common.js');
var _ = require('lodash');
var assert = require('assert');
var async = require('async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var RPCNode = require(global.__baseBitmarkLibModulePath + 'lib/rpc/rpc-node.js');
var errorList = require(global.__baseBitmarkLibModulePath + 'lib/error');

var poolHelper = {};

// =============================
// === TO WORK WITH HOSTNAME ===
// =============================
poolHelper.hostname = {};
poolHelper.hostname.getIPFromHostname = function(hostname, callback) {
  // we can use a more complex version, but let's keep it simple for now
  // TODO: add IP v6
  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
    global.setImmediate(callback, null, hostname);
  } else {
    dns.lookup(hostname, function(error, ip){
      callback(error, ip);
    });
  }
};

var breakDownTxtRecord = function(record) {
  var items = record.split(' ');
  var values = {};
  items.forEach(function(item) {
    var keyVal = item.split('=');
    if (keyVal[0] && keyVal[1]) {
      values[keyVal[0]] = keyVal[1];
    }
  });
  return values;
};

var getIpAndPortFromTxtRecord = function(record) {
  var values = breakDownTxtRecord(record);
  var ip, port;
  switch (values.bitmark) {
    case 'v1':
      ip = values.ip4 || values.ip6;
      port = values.rpc;
      break;
    case 'v2':
      ip = values.a;
      port = values.r;
      break;
  }
  return {ip: ip, port: port};
};

poolHelper.hostname.getNodeInfosFromHostname = function(hostname, callback){
  dns.resolveTxt(hostname, function(error, rows) {
    if (error) {
      callback(error);
    } else {
      var records = [];
      if (!_.isArray(rows)|| !rows.length) {
        setImmediate(done);
        return;
      }

      async.eachLimit(rows, MAX_PARALLEL_REQUESTS, function(row, done) {
        if (row && row[0]) {
          var nodeInfo = getIpAndPortFromTxtRecord(row[0]);
          if (nodeInfo.ip && nodeInfo.port) {
            poolHelper.hostname.getIPFromHostname(nodeInfo.ip, function(error, ip){
              if (!error) {
                records.push({id: ip + ':' + nodeInfo.port, ip: ip, port: nodeInfo.port});
              }
              setImmediate(done);
            });
            return;
          }
        }
        setImmediate(done);
      }, function() {
        callback(null, records);
      });
    }
  });
};


// =========================
// == POOl CLASS ===========
// =========================

/**
 * Node structure:
 * {
 *   id: <ip> + ':' <port>, // required
 *   ip: <ip>, //required
 *   port: <port>, //required
 *   alive: bool, // true = alive, false = dead, others = has not tried
 *   lastSeen: timestamp // the last time this node is down
 * }
 */

/**
 * Pool constructor
 * @param {array} records
 * @param {string/network object} network
 */
var Pool = function(records, network){

  if (!(this instanceof Pool)) {
    return new Pool(records, network);
  }

  var self = this;
  this.network = network || networks.livenet;
  // each record contains the info about a node
  this.database = records || [];
  // store the alive connection reference (for caching)
  this.nodes = {};
  // store the work the pool has to resolve by calling its nodes
  this.work = {
    // the last time a work is done, we can use this to decide whether we should get more nodes if there is no work for long
    lastWorkAt: null,
    // the queue of works
    queue: []
  };
  this.lastQueryFromHostname = null;

  if (_.isString(network)) {
    this.network = networks[network];
    assert(this.network, new Error('unknown network'));
  }

  this.network.static_nodes.forEach(function(address) {
    self.addNodeRecords({
      id: address,
      ip: address.split(':')[0],
      port: address.split(':')[1]
    });
  });

  var status = '';
  this.setStatus = function(newStatus, params) {
    if (status !== newStatus) {
      status = newStatus;
      this.emit(status, params);
    }
  };
  this.getStatus = function() {
    return status; 
  };
};
util.inherits(Pool, EventEmitter);

Pool.prototype.start = function(callback) {
  this.setStatus('unavailable');
  poolHelper.discover.discover(this, function(error, nodes) {
    if (error) {
      console.log(error);
    }
    callback();
  });
  return this;
};

Pool.prototype.stop = function(){
  this.setStatus('stopped');
  for (var id in this.nodes) {
    this.nodes[id].end();
  }
  this.nodes = {};
};

// ============================
// ==== SUPPORT FUNCTIONS =====
// ============================
Pool.prototype.addNodeRecords = function(newRecords) {
  // Make sure newRecords is an array
  if (!_.isArray(newRecords)) { newRecords = [newRecords]; }

  // Add each nodeInfo to the database if not existing
  var addedRecords = [];
  var self = this;
  newRecords.forEach(function(newRecord) {
    var filterResults = self.database.filter(function(record) {
      return newRecord.id === record.id;
    });
    if (!filterResults.length) {
      self.database.push(newRecord);
      addedRecords.push(newRecord);
    }
  });

  return addedRecords;
};

Pool.prototype.getNodeRecord = function(id) {
  var record, i, length;
  for (i = 0, length = this.database.length; i < length; i++) {
    record = this.database[i];
    if (record.id === id) {
      return record;
    }
  }
};

Pool.prototype.removeEndedConnections = function() {
  var now = new Date().getTime();
  for (var id in this.nodes) {
    if (this.nodes[id].getStatus() !== 'connected') {
      getNodeRecord(id).lastSeen = now;
      delete this.nodes[id];
    }
  }
};

Pool.prototype.cleanDatabase = function() {
  var now = new Date().getTime();
  var replace = [];
  this.database.forEach(function(record) {
    if (!record.lastSeen || // have not tried connecting to it yet
        record.alive || // maybe still alive
        (!record.alive && record. now - record.lastSeen < rpcConfig.dead_node_keeping)) { // not alive but not old enough to remove
      replace.push(record);
    }
  });
  this.database = replace;
};

Pool.prototype.countConnections = function() {
  var id, total = 0;
  for (id in this.nodes) total++;
  return total;
};

Pool.prototype.connectToNode = function(record, callback) {
  var self = this;
  var nodeId = record.id;
  var node = this.nodes[nodeId];
  var fromCache = !!node;

  if (!node) {
    node = new RPCNode(record);

    var onFailed = function(error) {
      record.alive = false;
      if (!self.nodes[nodeId]) { // in connecting process
        record.lastSeen = record.lastSeen || new Date().getTime();
        callback(error);
      } else { // fail after connected
        delete self.nodes[nodeId];
        record.lastSeen = new Date().getTime();
      }
    };

    var onEnded = function() {
      record.alive = true;
      record.lastSeen = new Date().getTime();
      delete self.nodes[nodeId];
    };

    var onConnected = function() {
      record.alive = true;
      record.lastSeen = new Date().getTime();

      self.nodes[nodeId] = node;
      node.addListener('ended', onEnded);
      callback(null, node, fromCache);
    };

    node.addListener('connected', onConnected);
    node.addListener('failed', onFailed);
  } else {
    global.setImmediate(callback, null, node, fromCache);
  }
};

// ============================
// === NODE DISCOVERY =========
// ============================
poolHelper.discover = {};

poolHelper.discover.isReady = function(pool) {
  var enoughAliveNode = pool.countConnections() >= rpcConfig.discover.enoughAliveNode;
  var enoughNodeRecord =  pool.database.length >= rpcConfig.discover.enoughNodeRecord;
  return enoughAliveNode && enoughNodeRecord;
};

poolHelper.discover.discoverMoreNodesViaNodesUntilEnough = function(pool, callback) {
  var queue = async.queue(function(record, done) {
    if (poolHelper.discover.isReady(pool)) {
      global.setImmediate(done);
    } else {
      pool.connectToNode(record, function(error, node) {
        if (error) {
          done();
        } else {
          node.getMoreNodes(function(error, records) {
            if (!error) {
              var addedRecords = pool.addNodeRecords(records);
              addedRecords.forEach(function(record) {
                queue.push(record);
              });
            }
            done();
          });
        }
      });
    }
  }, MAX_PARALLEL_REQUESTS);
  queue.drain = function() {
    callback(poolHelper.discover.isReady(pool));
  };
  queue.push(pool.database);
};

poolHelper.discover.discover = function(pool, callback) {
  pool.removeEndedConnections();
  if (poolHelper.discover.isReady(pool)) {
    global.setImmediate(callback, null, pool.nodes);
    return;
  }

  var discoverNodes = function() {
    poolHelper.discover.discoverMoreNodesViaNodesUntilEnough(pool, function(isSuccessful) {
      callback(isSuccessful ? null : new Error('can not open enough rpc connections'), pool.nodes);
    });
  };
  // Trying to get more nodes from hostname
  if (pool.lastQueryFromHostname < new Date().getTime() - GET_MORE_NODES_FROM_HOSTNAME_INTERVAL) {
    async.eachLimit(pool.network.static_hostnames, MAX_PARALLEL_REQUESTS, function(hostname, done) {
      poolHelper.hostname.getNodeInfosFromHostname(hostname, function(error, addresses) {
        if (!error) {
          pool.lastQueryFromHostname = new Date().getTime();
          pool.addNodeRecords(addresses);
        }
        done();
      });
    }, discoverNodes);
  } else {
    discoverNodes();
  }
};

// ================================
// === METHOD CALLS MANANGEMENT ===
// ================================
/**
 * Work structure
 * {
 *   data {
 *     method: 'Bitmarks.Issues',
 *     params: [Object]
 *   },
 *   // store results from nodes - if the number of results is more than rpcConfig.broadcast.minimum, the work is considered done
 *   // however, we always try to do the work rpcConfig.enough times or until we can not connect to any other nodes
 *   results: [],
 *   callback: function(error, results){}
 * }
 */
Pool.prototype.pushWork = function(work) {
  this.work.queue.push(work);
  if (this.work.queue.length === 1) {
    this.dequeue();
  }
};

Pool.prototype.dequeue = function() {
  var self = this;
  var work = this.work.queue[0];
  var success = 0;

  if (!work) { return; }

  var queue = async.priorityQueue(function(record, done) {
    if (success > rpcConfig.broadcast.enough) {
      global.setImmediate(done);
      return;
    }
    self.connectToNode(record, function(error, node, fromCache) {
      if (error) {
        // TODO: report error to remove connection
        global.setImmediate(done);
      } else {
        node[work.data.method](work.data.params, function(error, data) {
          if (error) {
            if (fromCache && error.message === errorList.rpc.TIMEOUT) { // if the connection is timeout, maybe the connection is broken but we can still connect again
              queue.push(record);
            }
          } else {
            success++;
            work.results.push(data);
          }
          done();
        });
      }
    });
  });

  queue.drain = function() {
    self.work.queue.shift();
    self.dequeue();
    if (success >= rpcConfig.broadcast.minimum) {
      work.callback(null, work.results);
    } else {
      work.callback(new Error('not enough nodes accepting/receiving the transaction'));
    }
  };

  this.database.forEach(function(record) {
    queue.push(record, self.nodes[record.id] ? 2 : 1);
  });
};

var createWork = function(method, params, callback) {
  return {
    data: {
      method: method,
      params: params
    },
    results: [],
    callback: callback
  };
};

// ==========================================
// === METHOD SUGARS ========================
// ==========================================
var collectResultForAnItemFromRPCResponse = function(responseArrays, key, at) {
  var results = [];
  responseArrays.forEach(function(responseArray) {
    var response = key ? responseArray[key][at] : responseArray[at];
    results.push(response);
  });
  return results;
};

var Asset = require(global.__baseBitmarkLibModulePath + 'lib/records/asset');
var Issue = require(global.__baseBitmarkLibModulePath + 'lib/records/issue');
var Transfer = require(global.__baseBitmarkLibModulePath + 'lib/records/transfer');

var broadcastItems = function(pool, workMethod, items, callback) {
  var params = [];
  items.forEach(function(item) {
    params.push(item.getRPCParam());
  });
  pool.pushWork(createWork(workMethod, params, callback));
};

var updateAssets = function(assets, rpcResults) {
  assets.forEach(function(asset, index) {
    var resultsForItem = collectResultForAnItemFromRPCResponse(rpcResults, 'assets', index);
    asset.updateInfoFromRPCResponse(resultsForItem);
  });
};

Pool.prototype.registerAssets = function(assets, callback){
  broadcastItems(this, 'registerAssets', assets, function(error, results) {
    if (!error) {
      updateAssets(assets, results);
    }
    callback(error, results);
  });
};

var updateIssues = function(issues, rpcResults) {
  issues.forEach(function(issue, index) {
    var resultsForItem = collectResultForAnItemFromRPCResponse(rpcResults, 'issues', index);
    issue.updateInfoFromRPCResponse(resultsForItem);
  });
};

Pool.prototype.issueBitmarks = function(issues, callback){
  broadcastItems(this, 'issueBitmarks', issues, function(error, results) {
    var payId, payNonce, difficulty;
    if (error) {
      callback(error);
    } else {
      updateIssues(issues, results);
      callback(null, results, {
        payId: commonUtil.getMostAppearedValue(results, 'payId'),
        payNonce: commonUtil.getMostAppearedValue(results, 'payNonce'),
        difficulty: commonUtil.getMostAppearedValue(results, 'difficulty')
      });
    }
  });
};

var updateTransfers = function(issues, rpcResults) {};
Pool.prototype.transferBitmark = function(bitmark, callback){
  this.pushWork(createWork('transferBitmark', bitmark.getRPCParam(), function(error, results) {
    if (error) {
      callback(error);
    } else {
      callback(null, results, {
        payId: commonUtil.getMostAppearedValue(results, 'payId'),
        payments: commonUtil.getMostAppearedValue(results, 'payments')
      });
    }
  }));
};

Pool.prototype.payByHashCash = function(params, callback) {
  this.pushWork(createWork('payByHashCash', params, callback));
};

Pool.prototype.payBitmark = function(params, callback) {
  this.pushWork(createWork('payBitmark', params, callback));
};

module.exports = exports = Pool;