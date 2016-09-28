var config = require('../config.js');
var rpcConfig = config.rpc;
var RPCConnection = require('./connection.js');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var RPCNode = RPCConnection;

RPCNode.prototype.getMoreNodes = function(callback) {
  if (this.status === 'connected') {
    this.callMethod('Node.List', {Start:null, Count:100}, function(error, data) {
      var nodes = [];
      if (!error) {
        data.nodes.forEach(function(item) {
          if (item.connections && item.connections.length) {
            var conn = item.connections[0];
            var parts = conn.split(':');
            if (parts[0] && parts[1]) {
              var port = parts.pop();
              var ip = parts.join(':');
              nodes.push({id: conn, ip: ip, port: port});
            }
          }
        });
        callback(null, nodes);
      } else {
        callback(error);
      }
    });
  } else {
    callback(new Error('connection is ended'));
  }
};


RPCNode.prototype.registerAssets = function(params, callback){
  return this.callMethod('Assets.Register', params, callback);
};

RPCNode.prototype.issueBitmarks = function(params, callback){
  return this.callMethod('Bitmarks.Issue', params, callback);
};

RPCNode.prototype.transferBitmark = function(params, callback){
  return this.callMethod('Bitmark.Transfer', params, callback);
};

RPCNode.prototype.payByHashCash = function(params, callback){
  return this.callMethod('Bitmarks.Proof', params, callback);
};

RPCNode.prototype.payBitmark = function(params, callback){
  return this.callMethod('Bitmarks.Pay', params, callback);
};


module.exports = exports = RPCNode;