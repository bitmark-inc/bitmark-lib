// TODO: provide a way to parse the transfer from buffer and json

var common = require('../util/common.js');
var assert = require('../util/assert.js');
var varint = require('../util/varint.js');
var binary = require('../util/binary-packing.js');
var _ = require('lodash');

var keyHandlers = require('../key-types/key-handlers.js');
var config = require('../config.js');

var Issue = require('./issue.js');
var Address = require('../address.js');


function Transfer() {
  if (!(this instanceof Transfer)) {
    return new Transfer();
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

var _packRecord = function(transfer) {
  var txBuffer, linkBuffer;
  txBuffer = varint.encode(config.record.transfer.value);
  linkBuffer = new Buffer(transfer._preTx, 'hex');
  linkBuffer = linkBuffer.slice(4);
  txBuffer = binary.appendBuffer(txBuffer, linkBuffer);
  txBuffer = binary.appendBuffer(txBuffer, transfer._owner.pack());
  return txBuffer;
};

Transfer.prototype.from = function(preTx){
  assert(preTx, 'Transfer error: previous transaction is required');
  if (_.isString(preTx)) {
    this._preTx = preTx;
  } else if (preTx instanceof Issue || preTx instanceof Transfer) {
    this._preTx = preTx.getTxId();
    this._preOwner = preTx.getOwner();
    assert(this._preTx, 'Transfer error: can not get the id of the previous transaction');
  } else {
    throw new TypeError('Transfer error: can not recognize input type');
  }
  this._isSigned = false;
  return this;
};

Transfer.prototype.to = function(address) {
  if (_.isString(address)) {
    address = new Address(address);
  }
  assert(address instanceof Address, 'Transfer error: can not recognize input type');
  this._isSigned = false;
  if (this._preOwner) {
    assert(address.getNetwork() === this._preOwner.getNetwork(), 'Transfer error: trying to transfer bitmark to different network');
  }
  this._owner = address;
  return this;
};

Transfer.prototype.sign = function(priKey){
  var preOwner;

  assert(this._preTx, 'Transfer error: missing previous transaction');
  assert(this._owner, 'Transfer error: missing new owner');

  preOwner = priKey.getAddress()
  if (this._preOwner) {
    assert(preOwner.toString() === this._preOwner.toString(), 'Transfer error: wrong key');
  } else {
    this._preOwner = preOwner;
  }
  assert(this._owner.getNetwork() === this._preOwner.getNetwork(), 'Transfer error: trying to transfer bitmark to different network');

  var keyHandler = keyHandlers.getHandler(priKey.getType());
  this._signature = keyHandler.sign(_packRecord(this), priKey.toBuffer());
  this._isSigned = true;
  return this;
};

/**
 * export to RPC message form, used for registering
 * @return {json} the message to send over RPC to bitmarkd
 */
Transfer.prototype.getRPCMessage = function(){
  assert(this._isSigned, 'Transfer error: need to sign the record before getting RPC message');
  return {
    owner: this._owner.toString(),
    signature: this._signature.toString('hex'),
    link: this._preTx
  };
};

Transfer.prototype.isSigned = function() { return this._isSigned; };
Transfer.prototype.getPreTx = function() { return this._preTx; };
Transfer.prototype.getTxId = function() { return this._txId; };
Transfer.prototype.getSignature = function(){ return this._signature; };
Transfer.prototype.getOwner = function() { return this._owner; };
Transfer.prototype.getPaymentAddress = function() { return this._paymentAddress; };
Transfer.prototype.updateInfoFromRPC = function(results){
  var bitcoinAddresses = [];
  this._txId = common.normalizeStr(_getMostReturnedResult(results, 'txid'));
  // Collect bitcoin address to an array
  results.forEach(function(result){
    var payments =result.paymentAddress;
    for (var i = 0, length = payments.length; i < length; i++) {
      if (payments[i].currency.toLowerCase() === 'bitcoin') {
        bitcoinAddresses.push({paymentAddress: payments[i].address});
      }
    }
  });
  // get the most returned bitcoin address
  this._paymentAddress = common.normalizeStr(_getMostReturnedResult(bitcoinAddresses, 'paymentAddress'));
};

module.exports = Transfer;