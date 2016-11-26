var sha3_256 = require('js-sha3').sha3_256;
var sha3_512 = require('js-sha3').sha3_512;
var config = require('../config.js');
var nacl = require('tweetnacl-nodewrap');
var BigInteger = require('bn.js');
var _ = require('lodash');

// [SECTION] FOR WORKING WITH KEY ALGORITHM
// ----------------------------------------
var getKeyTypeByValue = function(value){
  var typeName, typeValue;

  if (!(value instanceof BigInteger)){
    value = new BigInteger(value);
  }
  for (typeName in config.key.type){
    typeValue = config.key.type[typeName].value;
    if (value.eq(new BigInteger(typeValue))){
      return config.key.type[typeName];
    }
  }
  return null;
};

// [SECTION] FOR WORKING WITH DIFFERENT DATA TYPE
// ----------------------------------------------------
// var bufferToUint8Array = function(buffer) {
//   var ab = new ArrayBuffer(buffer.length);
//   var view = new Uint8Array(ab);
//   for (var i = 0; i < buffer.length; ++i) {
//       view[i] = buffer[i];
//   }
//   return view;
// };

// var uint8ArrayToBuffer = function(uint8Array) {
//   return new Buffer(uint8Array);
// };

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


// [SECTION] FOR WORKING WITH CRYPTO FUNCTIONS
// -------------------------------------------

var getSHA3_256 = function(buffer) {
  var resultInArrayBuffer = sha3_256.buffer(buffer);
  var resultInBuffer = new Buffer(resultInArrayBuffer);
  return resultInBuffer;
};

var getSHA3_512 = function(buffer) {
  var resultInArrayBuffer = sha3_512.buffer(buffer);
  var resultInBuffer = new Buffer(resultInArrayBuffer);
  return resultInBuffer;
};

var increaseOne = function(baseLength, buffer) {
  var nonce = buffer.slice(baseLength);
  var value;
  for (var i = nonce.length; i--;) {
    value = nonce.readUInt8(i);
    if (value === 0xff) {
      nonce.writeUInt8(0x00, i, true);
    } else {
      nonce.writeUInt8(value+1, i, true);
      return buffer;
    }
  }
  // if not success to return in the loop, let's add one byte
  var base = buffer.slice(0, baseLength);
  return Buffer.concat([base, new Buffer([0x01]), nonce]);
};

var findNonce = function(base, difficulty) {
  var nonce = new BigInteger('8000000000000000', 16);
  var combine = Buffer.concat([base, nonce.toBuffer()]);
  var baseLength = base.length;

  var notFoundYet = true;
  var hash;
  var count = 0;

  while (notFoundYet) {
    combine = increaseOne(baseLength, combine);
    hash = getSHA3_256(combine);
    if (hash.compare(difficulty) === -1) {
      notFoundYet = false;
    }
    count++;
  }
  nonce = combine.slice(baseLength);
  return nonce;
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

var getMostAppearedValue = function(dataSet, key) {
  var valueCount = {}, finalValueString = null, resultValue = null;
  dataSet.forEach(function(item){
    var value = key ? item[key] : item;
    var valueString = JSON.stringify(value);
    valueCount[valueString] = (valueCount[valueString] || 0) + 1;
    if (!finalValueString || valueCount[valueString] > valueCount[finalValueString]) {
      finalValueString = valueString;
      resultValue = value;
    }
  });
  return resultValue;
};


module.exports = {
  getKeyTypeByValue: getKeyTypeByValue,
  // bufferToUint8Array: bufferToUint8Array,
  // uint8ArrayToBuffer: uint8ArrayToBuffer,
  generateRandomBytes: generateRandomBytes,
  bufferEqual: bufferEqual,
  normalizeStr: normalizeStr,
  addImmutableProperties: addImmutableProperties,
  sha3_256: getSHA3_256,
  sha3_512: getSHA3_512,
  findNonce: findNonce,
  getMostAppearedValue: getMostAppearedValue
};