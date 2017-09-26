'use strict';

var keyAlgs = {
  ed25519: require('./ed25519.js')
};

module.exports = {
  getHandler: function(keyAlgName){
    return keyAlgs[keyAlgName];
  }
};
