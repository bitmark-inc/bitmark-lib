var BigInt = require('bigi');
var _ = require('lodash');

var varintEncode = function(value){
  // Correct the value data type to BigInt
  if (!(value instanceof BigInt)){
    if (!_.isString(value)){
      value = value.toString();
    }
    value = new BigInt(value);
  }

  // Check valid value
  if (value.toBuffer().length > 8){
    throw new Error('can not varint encode: number is too long');
  }
  if (value.signum() < 0){
    throw new Error('can not varint encode: number must be positive');
  }

  var result = new Buffer(9);
  var offsetCount = 0;
  var valueBuffer;
  var valueCompared = new BigInt('128');

  while (value.compareTo(valueCompared) >= 0){
    valueBuffer = value.toBuffer();
    result.writeUInt8(valueBuffer.readUInt8(valueBuffer.length-1) | 0x80, offsetCount);
    value = value.shiftRight(7);
    offsetCount++;
  }

  if (offsetCount === 9) {
    if (value.byteValue()){
      result.writeUInt8(result.readUInt8(8) | 0x80, 8);
      offsetCount = 8;
    }
  } else {
    result.writeUInt8(value.byteValue(), offsetCount);
  }
  return result.slice(0, offsetCount+1);
};

var varintDecode = function(encodedBuffer){
  // Correct the input to Buffer
  if (!Buffer.isBuffer(encodedBuffer)){
    encodedBuffer = new Buffer(encodedBuffer);
  }

  var currentByte = 0x80;
  var result = new BigInt('0');
  var maxLength = encodedBuffer.length > 9 ? 9 : encodedBuffer.length;
  var i, currentValue;

  for (i = 0; i < maxLength && (currentByte & 0x80) === 0x80; i++){
    currentByte = currentValue = encodedBuffer.readUInt8(i);
    if (i < 8) {
      currentValue = currentValue & 0x7f;
    }
    currentValue = new BigInt(currentValue.toString());
    result = result.add(currentValue.shiftLeft(i*7));
  }

  return result;
};

module.exports = {
  encode: varintEncode,
  decode: varintDecode
};