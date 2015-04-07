var tls = require('tls');
var uuid = require('node-uuid');
var dns = require('dns');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var defaultTimeout = 10 * 60000; // 10 minutes
var defaultHandsakeTimeout = 2000; // 2 seconds


var RPCConnection = function(options) {
  options = options || {};

  var self = this;
  var handshakeTimeout = options.handshakeTimeout || defaultHandsakeTimeout;
  var keepLivingTimeout = options.keepLivingTimeout || defaultTimeout;

  this.port = options.port;
  this.host = options.ip;

  if (!this.port) {
    process.nextTick(function(){ this.emit('fail', new Error('missing port')); });
    return;
  }
  if (!this.host) {
    process.nextTick(function(){ this.emit('fail', new Error('missing ip')); });
    return;
  }

  this.callbackTable = {};
  this.chunk = '';
  // on data event
  var onDataReceived = function(data){
    var jsonData, id, callback;
    var i, length, part;
    data = data.split(String.fromCharCode(10));
    for (i = 0, length = data.length; i < length - 1; i++) {
      part = data[i];
      self.chunk += part;
      jsonData = JSON.parse(self.chunk);
      self.chunk = '';
      id = jsonData.id;
      callback = self.callbackTable[id];
      // call the right callback based on ID
      if (callback) {
        delete self.callbackTable[id];
        if (jsonData.error) {
          console.log(jsonData.error);
          callback(jsonData.error);
        } else {
          callback(null, jsonData.result);
        }
      }
    }
    self.chunk += data[data.length - 1];
  };

  // on end event
  var onStreamEnd = function(){
    self.status = 'ended';
    self.emit('ended');
    self.stream.destroy();
  };

  // connect to the server
  this.status = 'connecting';
  this.stream = tls.connect(this.port, this.host, {rejectUnauthorized: false});
  this.stream.setEncoding('utf8');
  this.stream.setTimeout(handshakeTimeout, function(){
    self.status = 'fail';
    self.emit('fail', new Error('handshake timeout'));
    self.stream.destroy();
  });
  this.stream.on('error', function(err){
    self.status = 'fail';
    console.log('Connection to node ' + self.host + ':' + self.port + ' error:', err);
    self.emit('fail', err);
    self.emit('ended');
    self.stream.destroy();
  });
  this.stream.once('secureConnect', function(){
    self.status = 'connected';
    self.stream.on('data', onDataReceived);
    self.stream.on('end', onStreamEnd);
    self.stream.setTimeout(keepLivingTimeout, function(){
      self.stream.destroy();
    });
    self.emit('success', self);
  });
};

util.inherits(RPCConnection, EventEmitter);

// call the method on RPC server, store the id and callback for later process
RPCConnection.prototype.callMethod = function(methodName, params, callback, responseTimeout) {
  var self = this;
  var id = uuid.v4();
  var data = {
    id: id,
    method: methodName,
    params: [params]
  };

  data = JSON.stringify(data);
  this.callbackTable[id] = callback;
  if (responseTimeout) {
    setTimeout(function(){
      var callback = self.callbackTable[id]; // if it's still existing, it means the callback hasn't been called yet
      if (callback) {
        delete(self.callbackTable[id]);
        callback(new Error('timeout'));
      }
    }, responseTimeout);
  }
  this.stream.write(data);
};

var getRPCAddressesFromHostname = function(hostname, callback){
  dns.resolveTxt(hostname, function (error, records) {
    var addresses = [];
    if (error) {
      callback(error);
    } else {
      records.forEach(function(record) {
        var ip = /ip4=([^\s]+)/.exec(record)[1];
        var port = /rpc=([^\s]+)/.exec(record);
        if (port) {
          addresses.push({ip: ip, port: port[1]});
        }
      });
      callback(null, addresses);
    }
  });
};

module.exports = {
  Connection: RPCConnection,
  getRPCAddressesFromHostname: getRPCAddressesFromHostname
};