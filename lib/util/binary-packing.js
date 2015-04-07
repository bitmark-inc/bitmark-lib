var varint = require('./varint.js');


var appendString = function(desBuffer, str, encoding) {
  encoding = encoding || 'utf8';

  var valueBuffer = new Buffer(str, encoding);
  var lengthBuffer = varint.encode(valueBuffer.length);
  var newBufferLength = desBuffer.length + lengthBuffer.length + valueBuffer.length;

  return Buffer.concat([desBuffer, lengthBuffer, valueBuffer], newBufferLength);
};

var appendBuffer = function(desBuffer, srcBuffer) {
  var lengthBuffer = varint.encode(srcBuffer.length);
  var newBufferLength = desBuffer.length + lengthBuffer.length + srcBuffer.length;

  return Buffer.concat([desBuffer, lengthBuffer, srcBuffer], newBufferLength);
};

var appendTimestamp = function(desBuffer, timestamp) {
  var seconds = Math.floor(timestamp / 1000);
  var secondsBuffer = varint.encode(seconds);
  var newBufferLength = desBuffer.length + secondsBuffer.length;
  return Buffer.concat([desBuffer, secondsBuffer], newBufferLength);
};

module.exports =  {
  appendString: appendString,
  appendBuffer: appendBuffer,
  appendTimestamp: appendTimestamp
};