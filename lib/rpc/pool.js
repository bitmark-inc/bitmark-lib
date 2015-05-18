var dns = require('dns');
var config = require('../config.js');
var networks = require('../networks.js');
var common = require('../util/common.js');
var async = require('async');
var _ = require('lodash');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var environment = 'nodejs';
var RPCConnection; // if the environment is not nodejs, we might use different interface
switch (environment) {
  case 'nodejs':
    RPCConnection = require('./connection.js');
    break;
}

function jsonToArray(json) {
  var result = [];
  for (var key in json) result.push(json[key]);
  return result;
}

function getRPCNodesFromHostname(hostname, callback){
  dns.resolveTxt(hostname, function (error, records) {
    var addresses = [];
    if (error) {
      callback(error);
    } else {
      records.forEach(function(record) {
        var ip = /ip4=([^\s]+)/.exec(record)[1];
        var port = /rpc=([^\s]+)/.exec(record);
        if (port) {
          addresses.push({id: ip + ':' + port[1], ip: ip, port: port[1]});
        }
      });
      callback(null, addresses);
    }
  });
}

/**
 * Pool constructor
 * @param {array} nodes
 * @param {string/network object} network
 */
var Pool = function(nodes, network){

  if (!(this instanceof Pool)) {
    return new Pool(nodes, network);
  }

  var self = this;
  this._database = nodes || [];
  this._network = network || networks.livenet;
  this._connections = {};
  this.status = 'unavailable';

  if (_.isString(network)) {
    this._network = networks[network];
  }
  this._network.static_nodes.forEach(function(address) {
    self._addNodesIfNotExists({
      id: address,
      ip: address.split(':')[0],
      port: address.split(':')[1]
    });
  });
};

util.inherits(Pool, EventEmitter);

Pool.prototype.start = function() {
  this._changeStatus('unavailable');
  this._openEnoughConnections();
  return this;
};

Pool.prototype.stop = function(){
  this._changeStatus('stopped');
  this._poolTimer = clearTimeout(this._poolTimer);
  for (var id in this._connections) {
    this._connections[id].end();
  }
  this._connections = {};
};

Pool.prototype._changeStatus = function(status, params) {
  if (this.status !== status) {
    this.status = status;
    this.emit(status, params);
  }
};

Pool.prototype._removeEndedConnections = function() {
  var id, conn;
  for (id in this._connections) {
    if (this._connections[id].status !== 'connected') delete this._connections[id];
  }
};

Pool.prototype._countConnections = function() {
  var id, total = 0;
  for (id in this._connections) total++;
  return total;
};

Pool.prototype._openEnoughConnections = function() {
  var self = this;
  var missingCount = 0;
  this._removeEndedConnections();
  if (this._countConnections() >= config.rpc.enough) { // enough connection
    this._changeStatus('available');
  } else {
    // we try to open connections to more nodes
    missingCount = config.rpc.enough - this._countConnections();
    async.eachLimit(this._database, missingCount, function(node, done){
      // if we still lack of nodes and we haven't opened the connection to this node yet
      if (missingCount > 0 && !self._connections[node.id]) {
        self._addConnectionToPool(node, function(error){
          if (!error) missingCount--;
          done();
        });
      } else {
        done();
      }
    }, function(){
      if (self._countConnections() >= config.rpc.minimum) self._changeStatus('available');
      self._planGettingMoreNodes();
    });
  }
};

Pool.prototype._planGettingMoreNodes = function() {
  var self = this;
  var total = this._countConnections();
  if (total >= config.rpc.enough) {
    return;
  } else {
    this._getMoreNodes(function(){
      if (self.status !== 'stopped') {
        self.emit('database-changed');
        self._poolTimer = setTimeout(function(){
          self._openEnoughConnections();
        }, total >= config.rpc.minimum ? config.rpc.renewal_few : config.rpc.renewal_too_few);
      }
    });
  }
};

Pool.prototype._getMoreNodes = function(callback) {
  var self = this;
  var tasks = [];
  if (!this._gotNodesFromHostnames) {
    tasks.push(function(done){
      self._getMoreNodesFromStaticHostname(done);
    });
    this._gotNodesFromHostnames = true;
  }
  tasks.push(function(done){
    self._getMoreNodesFromConnections(done);
  });
  async.parallel(tasks, callback);
};

Pool.prototype._addNodesIfNotExists = function(nodes) {
  var self = this;
  if (!_.isArray(nodes)) nodes = [nodes];
  nodes.forEach(function(node) {
    var found = false;
    for (var i = 0, length = self._database.length; i < length; i++) {
      if (self._database[i].id === node.id) {
        found = true;
        break;
      }
    }
    if (!found) self._database.push(node);
  });
};

Pool.prototype._getMoreNodesFromStaticHostname = function(callback) {
  var self = this;
  async.each(this._network.static_hostnames, function(hostname, done){
    getRPCNodesFromHostname(hostname, function(error, addresses) {
      if (!error) {
        self._addNodesIfNotExists(addresses);
      }
      done();
    });
  }, callback);
};

Pool.prototype._getMoreNodesFromConnections = function(callback) {
  var self = this;
  var tasks = [];
  async.each(jsonToArray(this._connections), function(conn, done){
    conn.callMethod('Node.List', {"Start":null,"Count":10}, function(error, data) {
      if (!error) {
        var now = new Date().getTime();
        var nodes = [];
        data.addresses.forEach(function(address) {
          var parts = address.split(':');
          nodes.push({id: address, ip: parts[0], port: parts[1]});
        });
        self._addNodesIfNotExists(nodes);
      }
      done();
    });
  }, callback);
};

Pool.prototype._addConnectionToPool = function(node, callback) {
  var conn = new RPCConnection(node);
  var self = this;
  var success = function(){
    self._connections[node.id] = conn;
    callback(null, node);
    conn.removeListener('fail', fail);
    conn.once('ended', ended);
  };
  var fail = function(error){
    callback(error);
  };
  var ended = function(){
    if (self.status !== 'stopped') self._openEnoughConnections();
  };
  conn.on('success', success);
  conn.on('fail', fail);
};




Pool.prototype._broadcastTransaction = function(method, txObject, callback) {
  var params = txObject.getRPCMessage();
  var results = [];
  var errors = [];
  callback = callback || function(){};
  if (this.status != 'available') {
    process.nextTick(function(){
      callback(new Error('the pool is unavailable right now'));
    });
  }
  async.each(jsonToArray(this._connections), function(conn, done){
    conn.callMethod(method, params, function(error, result) {
      if (error) {
        errors.push(error);
      } else {
        results.push(result);
      }
      done();
    }, config.rpc.request_timeout);
  }, function(){
    if (results.length < config.rpc.minimum) {
      callback(new Error('not enough nodes accepting/receiving the transaction'), errors);
    } else {
      txObject.updateInfoFromRPC(results);
      callback(null, {errors: errors, results: results});
    }
  });
};

Pool.prototype._broadcastTransactions = function(method, txObjects, callback) {
  var params = [];
  var resultSets = [];
  var errors = [];

  if (this.status != 'available') {
    process.nextTick(function(){
      callback(new Error('the pool is unavailable right now'));
    });
  }

  txObjects.forEach(function(txObject){
    params.push(txObject.getRPCMessage());
  });
  callback = callback || function(){};

  async.each(jsonToArray(this._connections), function(conn, done) {
    conn.callMethod(method, params, function(error, resultSet) {
      if (error) {
        errors.push(error);
      } else {
        resultSets.push(resultSet); // a set can be undefined, do not care
      }
      done();
    }, config.rpc.request_timeout);
  }, function(error) {
    if (resultSets.length < config.rpc.minimum) {
      callback(new Error('not enough nodes accepting/receiving the transaction'));
    } else {
      var i = 0, totalObjects = txObjects.length;
      var j, totalSets = resultSets.length;
      var txResults, txObject;
      for (; i < totalObjects; i++) {
        txResults = [];
        txObject = txObjects[i];
        for (j = 0; j < totalSets; j++) {
          txResults.push(resultSets[j][i]);
        }
        txObject.updateInfoFromRPC(txResults);
      }
      callback(null, {errors: errors, resultSets: resultSets});
    }
  });
};

// temporary function to broadcast the payment
Pool.prototype.broadcastPayment = function(currency, payment, callback, count) {
  if (this.status != 'available') {
    process.nextTick(function(){
      callback(new Error('the pool is unavailable right now'));
    });
  }

  var errors = null, results = [];
  var data = {
    currency: currency,
    payment: payment
  };
  if (count) {
    data.count = count;
  }

  async.each(jsonToArray(this._connections), function(conn, done) {
    conn.callMethod('Transaction.Pay', data, function(error, data){
      if (error) {
        errors = errors || [];
        errors.push(error);
      } else {
        results.push(data);
      }
      done();
    });
  }, function(){
    if (callback) {
      if (results.length) {
        callback(null, results);
      } else {
        callback(errors);
      }
    }
  });
};


// Transaction reading supporting functions
// ----------------------------------------
Pool.prototype._readDataFromNode = function(method, params, callback) {
  var dataRead = null;
  var errors = [];
  if (this.status != 'available') {
    process.nextTick(function(){
      callback(new Error('the pool is unavailable right now'));
    });
  }

  async.eachLimit(jsonToArray(this._connections), 1, function(conn, callback) {
    conn.callMethod(method, params, function(error, result) {
      if (error) {
        errors.push(error);
        callback(); // call done to allow async to fallback to next node
      } else {
        dataRead = result;
        callback(dataRead); // callback with error to prevent fallback
      }
    }, config.rpc.request_timeout);
  }, function() {
    if (dataRead) {
      callback(null, dataRead);
    } else {
      callback(errors);
    }
  });
};



Pool.prototype.registerAsset = function(object, callback){
  return this._broadcastTransaction('Asset.Register', object, callback);
};

Pool.prototype.issueBitmark = function(object, callback){
  return this._broadcastTransaction('Bitmark.Issue', object, callback);
};

Pool.prototype.transferBitmark = function(object, callback){
  return this._broadcastTransaction('Bitmark.Transfer', object, callback);
};

Pool.prototype.issueBitmarks = function(objects, callback){
  return this._broadcastTransactions('Bitmarks.Issue', objects, callback);
};

Pool.prototype.readTransaction = function(txids, callback){
  return this._readDataFromNode('Transaction.Get', {txids: txids}, callback);
};

Pool.prototype.readAsset = function(fingerprints, callback){
  return this._readDataFromNode('Assets.Get', {fingerprints: fingerprints}, callback);
};

module.exports = Pool;