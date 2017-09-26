var chai = chai || require('chai');
var expect = chai.expect;
var lib = require('../index.js');
var AuthKey = lib.AuthKey;
var Seed = lib.Seed;
var config = require(global.__baseBitmarkLibModulePath + 'lib/config.js');

// var config = require(global.__baseBitmarkLibModulePath + 'lib/config.js');
// var common = require(global.__baseBitmarkLibModulePath + 'lib/util/common.js');

/**
 * ****  CREATING PRIVATE KEY
 * new AuthKey(network, keyType);
 * new AuthKey(kifString);
 * AuthKey.fromBuffer(buffer, network, key type)
 * AuthKey.fromKIF(kifString);
 *
 * **** VALIDATE KIF
 * AuthKey.isValid(KIFString, network)
 *
 * **** GET INFO
 * AuthKey.toString() - return raw hex
 * AuthKey.toKIF(network)
 * AuthKey.getNetwork()
 * AuthKey.getType()
 * AuthKey.getAccountNumber()
 */

describe('Auth Key', function(){
  describe('Constructor', function(){
    it('can be genreated without data', function(){
      expect(function(){
        return new AuthKey();
      }).to.not.throw(Error);
    });
    it('use livenet for default network, ed25519 for default key type', function(){
      var authKey = new AuthKey();
      expect(authKey.getNetwork()).to.equal('livenet');
      expect(authKey.getType()).to.equal('ed25519');
    });
    it('can be generated for testnet', function(){
      var authKey = new AuthKey('testnet');
      expect(authKey.getNetwork()).to.equal('testnet');
      expect(authKey.getType()).to.equal('ed25519');
    });
    it('throw error on bad network param', function(){
      expect(function(){
        return new AuthKey('realnet');
      }).to.throw(Error);
    });
    it('throw error on bad type param', function(){
      expect(function(){
        return new AuthKey('testnet', 'myalgorithm');
      }).to.throw(Error);
    });
    it('still return instance of AuthKey when initiating without `new` keyword', function(){
      var authKey = AuthKey();
      expect(authKey).to.be.instanceof(AuthKey);
    });
  });
  var validData = {
    livenet: {
      kif: 'Zjbm1pyA1zjpy5RTeHtBqSAr2NvErTxsovkbWs1duVy8yYG9Xr',
      network: 'livenet',
      type: 'ed25519',
      account_number: 'a5fyw6MQT6C6fpCBeSVdCfT3WS8WTTM24meT3nVuHyxJF7yKes',
      priKey: 'd7007fdf823a8d2d769f5778e6fb2d2c0cca9a104a7d2a7171d0a2eea1f55b7304946802fadd6d7723985ee012f2b02846fc9e5f6d8084f3c3af5407911a9b4a'
    },
    testnet: {
      kif: 'dd67Uj2rsMC6cEqGoXt6UdigFcMYG9iT64y5pEodDWk8HKUXeM',
      network: 'testnet',
      type: 'ed25519',
      account_number: 'dyALPzR7JSeNJybzogVXqrzsjfZos96bLurwMAHtbzjHSzk4yh',
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
        return AuthKey.fromKIF(liveNetKey.kif);
      }).to.not.throw();
      var authKey = AuthKey.fromKIF(liveNetKey.kif);
      expect(authKey.toKIF()).to.equal(liveNetKey.kif);
      expect(authKey.getNetwork()).to.equal(liveNetKey.network);
      expect(authKey.getType()).to.equal(liveNetKey.type);
      expect(authKey.getAccountNumber().toString()).to.equal(liveNetKey.account_number);
      expect(authKey.getAccountNumber().getNetwork()).to.equal(liveNetKey.network);
      expect(authKey.toString()).to.equal(liveNetKey.priKey);
    });
    it('should be able to parse the testnet KIF correctly', function(){
      var testnetKey = validData.testnet;
      expect(function(){
        return AuthKey.fromKIF(testnetKey.kif);
      }).to.not.throw();
      var authKey = AuthKey.fromKIF(testnetKey.kif);
      expect(authKey.toKIF()).to.equal(testnetKey.kif);
      expect(authKey.getNetwork()).to.equal(testnetKey.network);
      expect(authKey.getType()).to.equal(testnetKey.type);
      expect(authKey.getAccountNumber().toString()).to.equal(testnetKey.account_number);
      expect(authKey.getAccountNumber().getNetwork()).to.equal(testnetKey.network);
      expect(authKey.toString()).to.equal(testnetKey.priKey);
    });
    it('should throw error on invalid key indicator', function(){
      expect(function(){
        return AuthKey.fromKIF(invalidKIF.wrongKeyIndicator);
      }).to.throw(Error);
    });
    it('should throw error on unknow key type', function(){
      expect(function(){
        return AuthKey.fromKIF(invalidKIF.unknowKeyType);
      }).to.throw(Error);
    });
    it('should throw error on wrong checksum', function(){
      expect(function(){
        return AuthKey.fromKIF(invalidKIF.unknowKeyType);
      }).to.throw(Error);
    });
    it('show throw error on wrong key length', function(){
      expect(function(){
        return AuthKey.fromKIF(invalidKIF.wrongKeyLength);
      }).to.throw(Error);
    });
  });
  describe('Build from buffer', function(){
    it('should throw error if no buffer is inputed', function(){
      expect(function(){
        return AuthKey.fromBuffer('testnet');
      }).to.throw(Error);
    });
    it('should be able to create Auth Key from buffer only', function(){
      expect(function(){
        return AuthKey.fromBuffer('cbfa5516b0375ebf5a6c9401fa3933e7a95545193d11acdf161c439b480577b7');
      }).to.not.throw();
    });
    it('use livenet for default network, ed25519 for default type', function(){
      var authKey = AuthKey.fromBuffer('cbfa5516b0375ebf5a6c9401fa3933e7a95545193d11acdf161c439b480577b7');
      expect(authKey.getNetwork()).to.equal('livenet');
      expect(authKey.getType()).to.equal('ed25519');
    });
    it('shoule be able to create Auth Key for livenet', function(){
      var liveNetKey = validData.livenet;
      var authKey = AuthKey.fromBuffer(liveNetKey.priKey, liveNetKey.network, liveNetKey.type);
      expect(authKey.toKIF()).to.equal(liveNetKey.kif);
      expect(authKey.getAccountNumber().toString()).to.equal(liveNetKey.account_number);
    });
    it('shoule be able to create Auth Key for testnet', function(){
      var testNetKey = validData.testnet;
      var authKey = AuthKey.fromBuffer(testNetKey.priKey, testNetKey.network, testNetKey.type);
      expect(authKey.toKIF()).to.equal(testNetKey.kif);
      expect(authKey.getAccountNumber().toString()).to.equal(testNetKey.account_number);
    });
  });

  describe('Build from seed', function() {
    var validData = [{
      core: '651bf8bc9f8e8fce9d18ac62fb93a483a06d1b43fdf28d1afa5578bc7518a6ac',
      seed: '5XEECqtUz83pdgg2L11UrMBb34za1rhi12GNFmRRrd8Qudi1nkJbNxk',
      key: 'c8a4b1a1d1c657985a8ade24453acd779222a517c1a7190a70942c85831593ed',
      account_number: 'bsDeangMAbczSxz2qXJE3Gvf8zKuZdMUSx6fB7mqGGwVn5pxj4'
    }];
    validData.forEach((item) => {
      var seed = Seed.fromString(item.seed);
      var authKey = AuthKey.fromSeed(seed);
      expect(seed.generateKey(config.key.auth_key_index).toString('hex')).to.equal(item.key);
      expect(authKey.getAccountNumber().toString()).to.equal(item.account_number);
    });
  });
});
