var tls = require('tls');
var uuid = require('node-uuid');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var errorList = require(global.__baseBitmarkLibModulePath + 'lib/error');

var KEEP_LIVING_TIMEOUT = 0; // keep the connection forever
var HANDSAKE_TIMEOUT = 2000; // 2 seconds
var DEFAULT_REQUEST_TIMEOUT = 10000; // 10 seconds


var onConnectionEnded = function(conn){
  conn.status = 'ended';
  conn.emit('ended');
  conn.stream.end();
  conn.stream.destroy();
};

var onConnectionFailed = function(conn, error) {
  conn.status = 'failed';
  conn.emit('failed', error);
  conn.stream.end();
  conn.stream.destroy();
};

var RPCConnection = function(options) {

  if (!(this instanceof RPCConnection)) {
    return new RPCConnection(options);
  }

  if (!options) { throw new Error('missing information, please pass in `options` parameter with ip and port'); }

  var self = this;
  var handshakeTimeout = options.handshakeTimeout || HANDSAKE_TIMEOUT;
  var keepLivingTimeout = options.keepLivingTimeout || KEEP_LIVING_TIMEOUT;

  this.port = options.port;
  this.ip = options.ip;

  if (!this.port) { throw new Error('missing port'); }
  if (!this.ip) { throw new Error('missing ip'); }

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
          callback(jsonData.error);
        } else {
          callback(null, jsonData.result);
        }
      }
    }
    self.chunk += data[data.length - 1];
  };

  // connect to the server
  this.status = 'connecting';
  this.stream = tls.connect(this.port, this.ip, {rejectUnauthorized: false, allowHalfOpen: false});
  this.stream.setEncoding('utf8');

  this.stream.setTimeout(handshakeTimeout, function(){
    if (self.status == 'connecting') { // still in handshake state
      onConnectionFailed(self, new Error(errorList.rpc.TIMEOUT));
    }
  });

  this.stream.on('error', function(err){
    console.log('Error happens', err);
    onConnectionFailed(self, err);
  });

  this.stream.once('secureConnect', function(){
    self.status = 'connected';
    self.stream.on('data', onDataReceived);
    self.stream.on('end', function() {
      onConnectionFailed(self);
    });
    // self.stream.on('disconnect', onStreamEnd);
    // self.stream.on('close', onStreamEnd);
    self.stream.setTimeout(keepLivingTimeout, function() {
      onConnectionEnded(self);
    });
    self.emit('connected', self);
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
    params: params ? [params] : []
  };

  data = JSON.stringify(data);
  this.callbackTable[id] = callback;
  setTimeout(function(){
    var callback = self.callbackTable[id]; // if it's still existing, it means the callback hasn't been called yet
    if (callback) {
      delete(self.callbackTable[id]);
      var error = new Error(errorList.rpc.TIMEOUT);
      onConnectionFailed(self, error);
      callback(error);
    }
  }, responseTimeout || DEFAULT_REQUEST_TIMEOUT);
  this.stream.write(data);
};

RPCConnection.prototype.end = function() {
  onConnectionEnded(this);
};


module.exports = RPCConnection;