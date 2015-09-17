var cryptoJsCore = require('crypto-js');
var sha256 = require('crypto-js/sha256');
var config = require('../config.js');
var nacl = require('tweetnacl-nodewrap');
var BigInt = require('bigi');
var _ = require('lodash');

// [SECTION] FOR WORKING WITH KEY ALGORITHM
// ---------------------------------

var getKeyTypeByValue = function(value){
  var typeName, typeValue;

  if (!(value instanceof BigInt)){
    if (!_.isString(value)){
      value = value.toString();
    }
    value = new BigInt(value);
  }
  for (typeName in config.key.type){
    typeValue = config.key.type[typeName].value.toString();
    if (value.equals(new BigInt(typeValue))){
      return config.key.type[typeName];
    }
  }
  return null;
};

// [SECTION] FOR WORKING WITH DIFFERENT DATA TYPE
// ----------------------------------------------------

var bufferToWord = function(buff) {
  return cryptoJsCore.enc.Hex.parse(buff.toString('hex'));
};

var wordToBuffer = function(word) {
  return new Buffer(cryptoJsCore.enc.Hex.stringify(word), 'hex');
};

var bufferToUint8Array = function(buffer) {
  var ab = new ArrayBuffer(buffer.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
      view[i] = buffer[i];
  }
  return view;
};

var uint8ArrayToBuffer = function(uint8Array) {
  return new Buffer(uint8Array);
};

var bufferEqual = function(bufferA, bufferB){
  if (bufferA.length !== bufferB.length){
    return false;
  }

  var length = bufferA.length;
  for (var i = 0; i <length; i++){
    if (bufferA[i] !== bufferB[i]){
      return false;
    }
  }
  return true;
};

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
// var shuffleArray = function(o){ //v1.0
//     for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
//     return o;
// };

var normalizeStr = function(str) {
  return _.isString(str) && str.normalize ? str.normalize() : str;
};

var bufferToWord = function(buff) {
  return cryptoJsCore.enc.Hex.parse(buff.toString('hex'));
};

var wordToBuffer = function(word) {
  return new Buffer(cryptoJsCore.enc.Hex.stringify(word), 'hex');
};

// [SECTION] FOR WORKING WITH CRYPTO FUNCTIONS
// -------------------------------------------

var doubleSHA256 = function(buffer){
  var words = bufferToWord(buffer);
  var firstRound = sha256(words);
  var secondRound = sha256(firstRound);
  var bufferResult = wordToBuffer(secondRound);
  return bufferResult;
};

// [SECTION] OTHER
// ---------------
var generateRandomBytes = function(length) {
  return nacl.randomBytes(length);
};

var addImmutableProperties = function(target, properties){
  Object.keys(properties).forEach(function(key){
    Object.defineProperty(target, key, {
      configurable: false,
      enumerable: true,
      value: properties[key]
    });
  });
  return target;
};

module.exports = {
  getKeyTypeByValue: getKeyTypeByValue,
  doubleSHA256: doubleSHA256,
  bufferToUint8Array: bufferToUint8Array,
  uint8ArrayToBuffer: uint8ArrayToBuffer,
  generateRandomBytes: generateRandomBytes,
  bufferEqual: bufferEqual,
  normalizeStr: normalizeStr,
  addImmutableProperties: addImmutableProperties
};