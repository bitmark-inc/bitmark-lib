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

var computeFingerprintFromStream = function(stream, callback) {
  var hasher = common.createSHA3_512Stream();
  stream.on('data', function(data) {
    hasher.update(data);
  });
  stream.on('end', function() {
    callback(null, '01' + hasher.hex());
  });
  stream.on('error', function(error) {
    callback(error);
  });
}

module.exports = {
  fromBuffer: computeFingerprintFromBuffer,
  fromString: computeFingerprintFromString,
  fromStream: computeFingerprintFromStream
}

