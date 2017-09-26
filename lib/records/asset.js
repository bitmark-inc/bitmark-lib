// TODO: provide a way to parse the asset from buffer and json

var common = require('../util/common.js');
var assert = require('../util/assert.js');
var varint = require('../util/varint.js');
var binary = require('../util/binary-packing.js');
var _ = require('lodash');

var keyHandlers = require('../key-types/key-handlers.js');
var config = require('../config.js');

function resetSignState(asset) {
  asset._id = null;
  asset._isSigned = false;
}

function Asset() {
  if (!(this instanceof Asset)) {
    return new Asset();
  }
  this._metadata = {};
  resetSignState(this);
}

// function _getMostReturnedResult(resultSet, key) {
//   var results = {}, finalResult = null;
//   resultSet.forEach(function(result){
//     result = result[key];
//     results[result] = (results[result] || 0) + 1;
//     if (!finalResult || results[result] > results[finalResult]) {
//       finalResult = result;
//     }
//   });
//   return finalResult;
// }

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
  txBuffer = binary.appendString(txBuffer, asset._name);
  txBuffer = binary.appendString(txBuffer, asset._fingerprint);
  txBuffer = binary.appendString(txBuffer, mapToMetadataString(asset._metadata));
  txBuffer = binary.appendBuffer(txBuffer, asset._registrant.pack());
  return txBuffer;
}

Asset.prototype.setName = function(name){
  _setString(name, config.record.asset.max_name, 'name', this);
  resetSignState(this);
  return this;
};


var metadataSeparator = String.fromCharCode(parseInt('\u0000',16));

function mapToMetadataString(map) {
  var tmp = [];
  for (var key in map) {
    tmp.push(key, map[key]);
  }
  return tmp.join(metadataSeparator);
}

function stringToMetadataMap(str) {
  var tmp = str.split(metadataSeparator);
  if (tmp.length % 2) {
    throw new Error('Asset error: can not parse string to metadata');
  }

  var map = {};
  for (var i = 0, length = tmp.length; i < length; i += 2) {
    map[tmp[i]] = tmp[i+1];
  }
  return map;
}

function isValidMetadataLength(metadata) {
  var metadataString = mapToMetadataString(metadata);
  return metadataString.length <= config.record.asset.max_metadata;
}

function assertMetadataLength(metadata) {
  var valid = _.isString(metadata) ? metadata.length <= config.record.asset.max_metadata :  isValidMetadataLength(metadata);
  assert(valid, new Error('Asset error: metadata is too long'));
}

Asset.isValidMetadata = function(metadataMap) {
  return isValidMetadataLength(metadataMap);
};

Asset.prototype.setMetadata = function(metadata) {
  metadata = metadata || {};
  metadata = JSON.parse(JSON.stringify(metadata));

  assertMetadataLength(metadata);
  this._metadata = metadata;
  resetSignState(this);
  return this;
};

Asset.prototype.importMetadata = function(metadataString) {
  assertMetadataLength(metadataString);
  var metadata = stringToMetadataMap(metadataString);
  this._metadata = metadata;
  resetSignState(this);
  return this;
};

Asset.prototype.addMetadata = function(key, value) {
  var tmp = JSON.parse(JSON.stringify(this._metadata));
  tmp[key] = value;

  assertMetadataLength(tmp);
  this._metadata = tmp;
  resetSignState(this);
  return this;
};

Asset.prototype.removeMetadata = function(key) {
  delete this._metadata[key];
  resetSignState(this);
  return this;
};

Asset.prototype.getMetadata = function() {
  return this._metadata;
};

Asset.prototype.setFingerprint = function(fingerprint) {
  _setString(fingerprint, config.record.asset.max_fingerprint, 'fingerprint', this);
  resetSignState(this);
  return this;
};

var computeAssetId = function(fingerprint) {
  return common.sha3_512(new Buffer(fingerprint, 'utf8')).toString('hex');
};

Asset.prototype.sign = function(priKey) {
  assert(this._name, 'Asset error: missing name');
  assert(this._fingerprint, 'Asset error: missing fingerprint');
  this._registrant = priKey.getAccountNumber();

  var keyHandler = keyHandlers.getHandler(priKey.getType());
  this._signature = keyHandler.sign(_packRecord(this), priKey.toBuffer());
  this._id = computeAssetId(this._fingerprint);
  this._isSigned = true;
  return this;
};

/**
 * export to RPC message form, used for registering
 * @return {json} the message to send over RPC to bitmarkd
 */
// Asset.prototype.getRPCParam = function() {
//   assert(this._isSigned, 'Asset error: need to sign the record before getting RPC message');
//   return {
//     metadata: mapToMetadataString(this._metadata),
//     name: this._name,
//     fingerprint: this._fingerprint,
//     registrant: this._registrant.toString(),
//     signature: this._signature.toString('hex')
//   };
// };

Asset.prototype.isSigned = function() { return this._isSigned; };
Asset.prototype.getName = function() { return this._name; };
Asset.prototype.getMetadata = function() { return this._metadata; };
Asset.prototype.getFingerprint = function() { return this._fingerprint; };
Asset.prototype.getSignature = function() { return this._signature; };
Asset.prototype.getRegistrant = function() { return this._registrant; };
Asset.prototype.getId = function() { return this._id; };
// Asset.prototype.updateInfoFromRPCResponse = function(results){
//   this._id = common.normalizeStr(_getMostReturnedResult(results, 'index'));
// };

module.exports = Asset;