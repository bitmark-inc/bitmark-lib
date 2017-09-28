var assert = require('./assert');
var common = require('./common');
var _ = require('lodash');

var computeFingerprintFromBuffer = function(data) {
  assert(Buffer.isBuffer(data), new TypeError('Fingerprint error: buffer is required'));
  return '01' + common.sha3_512(data).toString('hex');
}

var computeFingerprintFromString = function(data) {
  assert(_.isString(data), new TypeError('Fingerprint error: utf8 string is required'));
  return '01' + common.sha3_512(data).toString('hex');
}

module.exports = {
  fromBuffer: computeFingerprintFromBuffer,
  fromString: computeFingerprintFromString
}

