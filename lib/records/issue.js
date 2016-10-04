// TODO: provide a way to parse the issue from buffer and json

var common = require('../util/common.js');
var assert = require('../util/assert.js');
var varint = require('../util/varint.js');
var binary = require('../util/binary-packing.js');
var _ = require('lodash');

var keyHandlers = require('../key-types/key-handlers.js');
var config = require('../config.js');

var Asset = require('./asset.js');

function Issue() {
  if (!(this instanceof Issue)) {
    return new Issue();
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

var _packRecord = function(issue) {
  var txBuffer;
  txBuffer = varint.encode(config.record.issue.value);
  txBuffer = binary.appendBuffer(txBuffer, new Buffer(issue._asset, 'hex'));
  txBuffer = binary.appendBuffer(txBuffer, issue._owner.pack());
  txBuffer = Buffer.concat([txBuffer, varint.encode(issue._nonce)]);
  return txBuffer;
};

Issue.prototype.fromAsset = function(asset){
  assert(asset, 'Issue error: asset is required');
  if (_.isString(asset)) {
    this._asset = asset;
  } else if (asset instanceof Asset) {
    this._asset = asset.getId();
    assert(this._asset, 'Issue error: can not get asset id');
  } else {
    throw new TypeError('Issue error: can not recognize input type');
  }
  this._isSigned = false;
  return this;
};

Issue.prototype.setNonce = function(nonce){
  assert(_.isFinite(nonce) && nonce >= 0, 'Issue error: nonce must be uint64');
  this._nonce = nonce;
  this._isSigned = false;
  return this;
};

Issue.prototype.sign = function(priKey){
  assert(this._asset, 'Issue error: missing asset');
  assert(this._nonce !== undefined, 'Issue error: missing nonce');
  this._owner = priKey.getAddress();

  var keyHandler = keyHandlers.getHandler(priKey.getType());
  this._signature = keyHandler.sign(_packRecord(this), priKey.toBuffer());
  this._isSigned = true;
  return this;
};

/**
 * export to RPC param form, used for registering
 * @return {json} the param to send over RPC to bitmarkd
 */
Issue.prototype.getRPCParam = function(){
  assert(this._isSigned, 'Issue error: need to sign the record before getting RPC param');
  return {
    owner: this._owner.toString(),
    signature: this._signature.toString('hex'),
    asset: this._asset,
    nonce: this._nonce
  };
};

Issue.prototype.isSigned = function() { return this._isSigned; };
Issue.prototype.getTxId = function() { return this._txId; };
Issue.prototype.getOwner = function(){ return this._owner; };
Issue.prototype.getSignature = function(){ return this._signature; };
Issue.prototype.getPaymentAddress = function() { return this._paymentAddress; };
Issue.prototype.getAsset = function(){ return this._asset; };
Issue.prototype.updateInfoFromRPCResponse = function(results){
  this._txId = common.normalizeStr(_getMostReturnedResult(results, 'txId'));
};

module.exports = Issue;