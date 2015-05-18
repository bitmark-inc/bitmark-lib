var assert = require('../util/assert.js');
var common = require('../util/common.js');

var ed25519Info = require('../config.js').key.type.ed25519;
var nacl = require('tweetnacl');

var _checkPriKeyLength = function(priKey) {
  assert(priKey.length === ed25519Info.prikey_length, ed25519Info.name + ' private key must be ' + ed25519Info.prikey_length + ' bytes');
};

// var _checkPubKeyLength = function(pubKey) {
//   assert(pubKey.length === ed25519Info.PUBKEYLENGTH, ed25519Info.name + ' public key must be ' + ed25519Info.PUBKEYLENGTH + ' bytes');
// };

var _checkSeedLength = function(seed) {
 assert(seed.length === ed25519Info.seed_length, ed25519Info.name + ' seed must be ' + ed25519Info.seed_length + ' bytes');
};

var generateKeyPair = function() {
  var keyPair = nacl.sign.keyPair();
  return {
    pubKey: common.uint8ArrayToBuffer(keyPair.publicKey),
    priKey: common.uint8ArrayToBuffer(keyPair.secretKey)
  };
};

var generateKeyPairFromSeed = function(seed) {
  _checkSeedLength(seed);
  seed = common.bufferToUint8Array(seed);
  var keyPair = nacl.sign.keyPair.fromSeed(seed);
  return {
    pubKey: common.uint8ArrayToBuffer(keyPair.publicKey),
    priKey: common.uint8ArrayToBuffer(keyPair.secretKey)
  };
};

var getSeedFromPriKey = function(priKey) {
  _checkPriKeyLength(priKey);
  return priKey.slice(0, ed25519Info.seed_length);
};

var generateKeyPairFromPriKey = function(priKey) {
  _checkPriKeyLength(priKey);
  var priKeyUint8Array = common.bufferToUint8Array(priKey);
  var keyPair = nacl.sign.keyPair.fromSecretKey(priKeyUint8Array);
  return {
    pubKey: common.uint8ArrayToBuffer(keyPair.publicKey),
    priKey: priKey
  };
};

var getSignature = function(message, priKey) {
  _checkPriKeyLength(priKey);
  var priKeyUint8Array = common.bufferToUint8Array(priKey);
  var messageUint8Array = common.bufferToUint8Array(message);
  var signature = nacl.sign.detached(messageUint8Array, priKeyUint8Array);
  return common.uint8ArrayToBuffer(signature);
};

// var verifySignature = function(message, signature, pubKey) {
//   _checkPubKeyLength(pubKey);
//   var messageUint8Array = common.bufferToUint8Array(message);
//   var signatureUint8Array = common.bufferToUint8Array(signature);
//   var pubKeyUint8Array = common.bufferToUint8Array(pubKey);
//   return nacl.sign.detached.verify(messageUint8Array, signatureUint8Array, pubKeyUint8Array);
// };

module.exports = {
  generateKeyPair: generateKeyPair,
  generateKeyPairFromPriKey: generateKeyPairFromPriKey,
  generateKeyPairFromSeed: generateKeyPairFromSeed,
  getSeedFromPriKey: getSeedFromPriKey,
  sign: getSignature,
  // verify: verifySignature
};