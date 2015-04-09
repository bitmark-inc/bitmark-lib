var chai = chai || require('chai');
var expect = chai.expect;
var config = require('../lib/config.js');
var common = require('../lib/util/common.js');

var PrivateKey = require('../lib/private-key.js');

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
  });
  var validData = {
    livenet: {
      kif: 'ZfaawUwgdW4oxP4zH79Dp65a8SowgDwDU4S7rq6iGusWZZ1Jmn',
      network: 'livenet',
      type: 'ed25519',
      address: 'bZrKcCGTNjXJSuTEaHroU1BrCDc7F2oc1aiCfrEDejnHPBJtA9',
      priKey: 'cddf9e89e5c59232c59cbb40d01082dca5f48c9b213b29418a61bc82d4376f59c8420c382e2be938ec9af32ef2ab370b9787b7e7ccea7f64357006253f07f7f6'
    },
    testnet: {
      kif: 'c7EALHA9eVEfFQy9DcW61uRvPAjESakGqpb2vDeoKvRLsugZzC',
      network: 'testnet',
      type: 'ed25519',
      address: 'fqZJeprCzUrTjVntT3r8JX6tSEmxtN1y4wivu1o8Qkn7icvoEU',
      priKey: '0f8096d9ea3390494af382bf42991927baca9e88ac5ad9f4b44f3483895aaba4fab4c74aaed5cb9efb35714efb0ff576ae97cac1d5727ce14a73c574b496ac29'
    }
  };
  var invalidKIF = {
    wrongKeyIndicator: 'eJT6wuVa6S28o7HwZHyU5KF2phBJwA2sQm3ay29qGX6grPTJWD',
    unknowKeyType: '5fqsbGCS8d1oztEsbkDxt5sEHn5oaJ7EgtRwy744BQb8LwSUT3',
    wrongChecksum: 'cnuhWA1XJXgTYuH8udThP81RdgvUJ7tECow6Z3K8Kss8Tj7BWQ',
    wrongKeyLength: '3j8Cyvox4R7HKtCS8KfWFtsLWS4zz2rdmEvLv3dApcgNCnAo3XXz'
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