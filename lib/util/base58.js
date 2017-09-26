var bs58 = require('bs58');

module.exports = {
  encode: bs58.encode,
  decode: function(str) {
    return new Buffer(bs58.decode(str));
  }
};
