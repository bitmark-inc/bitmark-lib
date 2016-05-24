// TODO: provide a way to parse the asset from buffer and json

var common = require('../util/common.js');
var assert = require('../util/assert.js');
var varint = require('../util/varint.js');
var binary = require('../util/binary-packing.js');
var _ = require('lodash');

var keyHandlers = require('../key-types/key-handlers.js');
var config = require('../config.js');

function Asset() {
  if (!(this instanceof Asset)) {
    return new Asset();
  }
  this._isSigned = false;
}

var _getMostReturnedResult = function(resultSet, key) {
  var results = {}, finalResult = null;
  resultSet.forEach(function(result){
    result = result[key];
    results[result] = (results[result] || 0) + 1;
    if (!finalResult || results[result] > results[finalResult]) {
      finalResult = result;
    }
  });
  return finalResult;
};

function _setString(val, length, name, asset) {
  assert(_.isString(val), new TypeError('Asset error: ' + name + ' must be a string'));
  val = common.normalizeStr(val);
  assert(val.length <= length, 'Asset error: ' + name + ' must be less than ' + length);
  if (asset['_' + name] !== val) {
    asset['_' + name] = val;
    asset._isSigned = false;
  }
  return asset;
}

function _packRecord(asset) {
  var txBuffer;
  txBuffer = varint.encode(config.record.asset.value);
  txBuffer = binary.appendString(txBuffer, asset._description || '');
  txBuffer = binary.appendString(txBuffer, asset._name);
  txBuffer = binary.appendString(txBuffer, asset._fingerprint);
  txBuffer = binary.appendBuffer(txBuffer, asset._registrant.pack());
  return txBuffer;
}

Asset.prototype.setName = function(name){
  _setString(name, config.record.asset.max_name, 'name', this);
  return this;
};

Asset.prototype.setDescription = function(description){
  _setString(description || '', config.record.asset.max_description, 'description', this);
  this._isSigned = false;
  return this;
};

Asset.prototype.setFingerprint = function(fingerprint){
  _setString(fingerprint, config.record.asset.max_fingerprint, 'fingerprint', this);
  this._isSigned = false;
  return this;
};

Asset.prototype.sign = function(priKey){
  assert(this._name, 'Asset error: missing name');
  assert(this._fingerprint, 'Asset error: missing fingerprint');
  this._registrant = priKey.getAddress();

  var keyHandler = keyHandlers.getHandler(priKey.getType());
  this._signature = keyHandler.sign(_packRecord(this), priKey.toBuffer());
  this._isSigned = true;
  return this;
};

/**
 * export to RPC message form, used for registering
 * @return {json} the message to send over RPC to bitmarkd
 */
Asset.prototype.getRPCMessage = function(){
  assert(this._isSigned, 'Asset error: need to sign the record before getting RPC message');
  return {
    description: this._description,
    name: this._name,
    fingerprint: this._fingerprint,
    registrant: this._registrant.toString(),
    signature: this._signature.toString('hex')
  };
};

Asset.prototype.isSigned = function() { return this._isSigned; };
Asset.prototype.getName = function() { return this._name; };
Asset.prototype.getDescription = function() { return this._description; };
Asset.prototype.getFingerprint = function() { return this._fingerprint; };
Asset.prototype.getSignature = function() { return this._signature; };
Asset.prototype.getRegistrant = function(){ return this._registrant; };
Asset.prototype.getId = function() { return this._id; };
Asset.prototype.getTxId = function() { return this._txId; };
Asset.prototype.updateInfoFromRPC = function(results){
    this._id = common.normalizeStr(_getMostReturnedResult(results, 'asset'));
    this._txId = common.normalizeStr(_getMostReturnedResult(results, 'txid'));
};

module.exports = Asset;