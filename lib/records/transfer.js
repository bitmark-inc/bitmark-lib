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
  var txBuffer;
  txBuffer = varint.encode(config.record.transfer.value);
  txBuffer = binary.appendBuffer(txBuffer, new Buffer(transfer._preTx, 'hex'));
  if (transfer._payment) {
    txBuffer = Buffer.concat([txBuffer, new Buffer([0x01])]);
    txBuffer = Buffer.concat([txBuffer, varint.encode(config.currency[transfer._payment.currency])]);
    txBuffer = binary.appendString(txBuffer, transfer._payment.address);
    txBuffer = Buffer.concat([txBuffer, varint.encode(config.currency[transfer._payment.amount])]);
  } else {
    txBuffer = Buffer.concat([txBuffer, new Buffer([0x00])]);
  }
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
  if (this._preOwner) {
    assert(address.getNetwork() === this._preOwner.getNetwork(), 'Transfer error: trying to transfer bitmark to different network');
  }
  this._owner = address;
  this._isSigned = false;
  return this;
};

Transfer.prototype.requirePayment = function(options) {
  assert(options, 'Transfer error: payment info is required');
  assert(options.address, 'Transfer error: payment address is required');
  assert(options.currency && config.currency[options.currency], 'Transfer error: a valid currency for payment is required');
  assert(options.amount, 'Transfer error: payment amount is required');
  this._payment = {
    address: options.address,
    currency: options.currency,
    amount: options.amount
  };
  this._isSigned = false;
  return this;
};

Transfer.prototype.sign = function(priKey){
  var preOwner;

  assert(this._preTx, 'Transfer error: missing previous transaction');
  assert(this._owner, 'Transfer error: missing new owner');

  preOwner = priKey.getAddress();
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
 * export to RPC param form, used for registering
 * @return {json} the param to send over RPC to bitmarkd
 */
Transfer.prototype.getRPCParam = function(){
  assert(this._isSigned, 'Transfer error: need to sign the record before getting RPC param');
  var result = {
    owner: this._owner.toString(),
    signature: this._signature.toString('hex'),
    link: this._preTx
  };
  if (this._payment) {
    result.payment = this._payment;
  }
  return result;
};

Transfer.prototype.isSigned = function() { return this._isSigned; };
Transfer.prototype.getPreTx = function() { return this._preTx; };
Transfer.prototype.getTxId = function() { return this._txId; };
Transfer.prototype.getSignature = function(){ return this._signature; };
Transfer.prototype.getOwner = function() { return this._owner; };
Transfer.prototype.getPaymentAddress = function() { return this._paymentAddress; };
Transfer.prototype.updateInfoFromRPCResponse = function(results){
  this._txId = common.normalizeStr(_getMostReturnedResult(results, 'txId'));
};

module.exports = Transfer;