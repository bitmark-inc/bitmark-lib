var chai = chai || require('chai');
var expect = chai.expect;
var lib = require('../index.js');

var config = require(__baseBitmarkLibModulePath + 'lib/config.js');
var common = require(__baseBitmarkLibModulePath + 'lib/util/common.js');

var PrivateKey = require(__baseBitmarkLibModulePath + 'lib/private-key.js');

/**
 * ****  CREATING PRIVATE KEY
 * new PrivateKey(network, keyType);
 * new PrivateKey(kifString);
 * PrivateKey.fromBuffer(buffer, network, key type)
 * PrivateKey.fromKIF(kifString);
 *
 * **** VALIDATE KIF
 * PrivateKey.isValid(KIFString, network)
 *
 * **** GET INFO
 * PrivateKey.toString() - return raw hex
 * PrivateKey.toKIF(network)
 * PrivateKey.getNetwork()
 * PrivateKey.getType()
 * PrivateKey.getAddress()
 */

describe('Private Key', function(){
  describe('Constructor', function(){
    it('can be genreated without data', function(){
      expect(function(){
        return new PrivateKey();
      }).to.not.throw(Error);
    });
    it('use livenet for default network, ed25519 for default key type', function(){
      var privateKey = new PrivateKey();
      expect(privateKey.getNetwork()).to.equal('livenet');
      expect(privateKey.getType()).to.equal('ed25519');
    });
    it('can be generated for testnet', function(){
      var privateKey = new PrivateKey('testnet');
      expect(privateKey.getNetwork()).to.equal('testnet');
      expect(privateKey.getType()).to.equal('ed25519');
    });
    it('throw error on bad network param', function(){
      expect(function(){
        return new PrivateKey('realnet');
      }).to.throw(Error);
    });
    it('throw error on bad type param', function(){
      expect(function(){
        return new PrivateKey('testnet', 'myalgorithm');
      }).to.throw(Error);
    });
    it('still return instance of PrivateKey when initiating without `new` keyword', function(){
      var privateKey = PrivateKey();
      expect(privateKey).to.be.instanceof(PrivateKey);
    });
  });
  var validData = {
    livenet: {
      kif: 'Zjbm1pyA1zjpy5RTeHtBqSAr2NvErTxsovkbWs1duVy8yYG9Xr',
      network: 'livenet',
      type: 'ed25519',
      address: 'a5fyw6MQT6C6fpCBeSVdCfT3WS8WTTM24meT3nVuHyxJF7yKes',
      priKey: 'd7007fdf823a8d2d769f5778e6fb2d2c0cca9a104a7d2a7171d0a2eea1f55b7304946802fadd6d7723985ee012f2b02846fc9e5f6d8084f3c3af5407911a9b4a'
    },
    testnet: {
      kif: 'dd67Uj2rsMC6cEqGoXt6UdigFcMYG9iT64y5pEodDWk8HKUXeM',
      network: 'testnet',
      type: 'ed25519',
      address: 'dyALPzR7JSeNJybzogVXqrzsjfZos96bLurwMAHtbzjHSzk4yh',
      priKey: 'd7007fdf823a8d2d769f5778e6fb2d2c0cca9a104a7d2a7171d0a2eea1f55b7304946802fadd6d7723985ee012f2b02846fc9e5f6d8084f3c3af5407911a9b4a'
    }
  };
  var invalidKIF = {
    wrongKeyIndicator: 'bgLwFH11Sfxxnf8NDut9A2wm8zdtZJqfSzrqfYudZWMddYghqX',
    unknowKeyType: '26qWaj1UnppMz6NhxvDsSy2ZVrEQe7wyU34UVusMYPcB2wzhvMt',
    wrongChecksum: 'Zjbm1pyA1zjpy5RTeHtBqSAr2NvErTxsovkbWs1duVy8yYG9Xs',
    wrongKeyLength: '83kQWEJPfyxC7UayrKtFq2fnaUaYuwmzmRUm4FQCqk52DiBab'
  };
  describe('Parse from KIF string', function(){
    it('should be able to parse the livenet KIF correctly', function(){
      var liveNetKey = validData.livenet;
      expect(function(){
        return PrivateKey.fromKIF(liveNetKey.kif);
      }).to.not.throw();
      var privateKey = PrivateKey.fromKIF(liveNetKey.kif);
      expect(privateKey.toKIF()).to.equal(liveNetKey.kif);
      expect(privateKey.getNetwork()).to.equal(liveNetKey.network);
      expect(privateKey.getType()).to.equal(liveNetKey.type);
      expect(privateKey.getAddress().toString()).to.equal(liveNetKey.address);
      expect(privateKey.getAddress().getNetwork()).to.equal(liveNetKey.network);
      expect(privateKey.toString()).to.equal(liveNetKey.priKey);
    });
    it('should be able to parse the testnet KIF correctly', function(){
      var testnetKey = validData.testnet;
      expect(function(){
        return PrivateKey.fromKIF(testnetKey.kif);
      }).to.not.throw();
      var privateKey = PrivateKey.fromKIF(testnetKey.kif);
      expect(privateKey.toKIF()).to.equal(testnetKey.kif);
      expect(privateKey.getNetwork()).to.equal(testnetKey.network);
      expect(privateKey.getType()).to.equal(testnetKey.type);
      expect(privateKey.getAddress().toString()).to.equal(testnetKey.address);
      expect(privateKey.getAddress().getNetwork()).to.equal(testnetKey.network);
      expect(privateKey.toString()).to.equal(testnetKey.priKey);
    });
    it('should throw error on invalid key indicator', function(){
      expect(function(){
        return PrivateKey.fromKIF(invalidKIF.wrongKeyIndicator);
      }).to.throw(Error);
    });
    it('should throw error on unknow key type', function(){
      expect(function(){
        return PrivateKey.fromKIF(invalidKIF.unknowKeyType);
      }).to.throw(Error);
    });
    it('should throw error on wrong checksum', function(){
      expect(function(){
        return PrivateKey.fromKIF(invalidKIF.unknowKeyType);
      }).to.throw(Error);
    });
    it('show throw error on wrong key length', function(){
      expect(function(){
        return PrivateKey.fromKIF(invalidKIF.wrongKeyLength);
      }).to.throw(Error);
    });
  });
  describe('Build from buffer', function(){
    it('should throw error if no buffer is inputed', function(){
      expect(function(){
        return PrivateKey.fromBuffer('testnet');
      }).to.throw(Error);
    });
    it('should be able to create Private Key from buffer only', function(){
      expect(function(){
        return PrivateKey.fromBuffer('cbfa5516b0375ebf5a6c9401fa3933e7a95545193d11acdf161c439b480577b7');
      }).to.not.throw();
    });
    it('use livenet for default network, ed25519 for default type', function(){
      var privateKey = PrivateKey.fromBuffer('cbfa5516b0375ebf5a6c9401fa3933e7a95545193d11acdf161c439b480577b7');
      expect(privateKey.getNetwork()).to.equal('livenet');
      expect(privateKey.getType()).to.equal('ed25519');
    });
    it('shoule be able to create Private Key for livenet', function(){
      var liveNetKey = validData.livenet;
      var privateKey = PrivateKey.fromBuffer(liveNetKey.priKey, liveNetKey.network, liveNetKey.type);
      expect(privateKey.toKIF()).to.equal(liveNetKey.kif);
      expect(privateKey.getAddress().toString()).to.equal(liveNetKey.address);
    });
    it('shoule be able to create Private Key for testnet', function(){
      var testNetKey = validData.testnet;
      var privateKey = PrivateKey.fromBuffer(testNetKey.priKey, testNetKey.network, testNetKey.type);
      expect(privateKey.toKIF()).to.equal(testNetKey.kif);
      expect(privateKey.getAddress().toString()).to.equal(testNetKey.address);
    });
  });
});