var chai = chai || require('chai');
var expect = chai.expect;
var lib = require('../index.js');

var Address = require(__baseBitmarkLibModulePath + 'lib/address.js');
var config = require(__baseBitmarkLibModulePath + 'lib/config.js');
var common = require(__baseBitmarkLibModulePath + 'lib/util/common.js');

/**
 * ****  CREATING ADDRESS
 * new Address(addressString / pubkey, network)
 * Address.fromString(addressString)
 * Address.fromPublicKey(publicKeyHex/Buffer, network)
 *
 * **** VALIDATE ADDRESS
 * Address.isValid(addressString, network)
 * Address.getValidationError(addressString, network) // Unimplemented
 *
 * **** GET INFO
 * Address.toString(network)
 * Address.getNetwork()
 * Address.getPublicKey()
 * Address.getKeyType()
 */

describe('Address', function(){
  describe('Constructor', function(){
    it('can\'t build without data', function(){
      expect(function(){
        return new Address();
      }).to.throw(Error);
    });
    it('should throw error on bad network param', function(){
      expect(function(){
        return new Address(common.generateRandomBytes(32), 'main_net');
      }).to.throw(Error);
    });
    it('should throw an error on bad type param', function() {
      expect(function() {
        return new Address(common.generateRandomBytes(32), 'livenet', 'badtype');
      }).to.throw(Error);
    });
  });

  var validData = [{
    // kif: Zjbm1pyA1zjpy5RTeHtBqSAr2NvErTxsovkbWs1duVy8yYG9Xr
    address: 'a5fyw6MQT6C6fpCBeSVdCfT3WS8WTTM24meT3nVuHyxJF7yKes',
    pubkey: '04946802fadd6d7723985ee012f2b02846fc9e5f6d8084f3c3af5407911a9b4a',
    network: 'livenet',
    type: 'ed25519'
  },{
    // kif: dd67Uj2rsMC6cEqGoXt6UdigFcMYG9iT64y5pEodDWk8HKUXeM
    address: 'dyALPzR7JSeNJybzogVXqrzsjfZos96bLurwMAHtbzjHSzk4yh',
    pubkey: '04946802fadd6d7723985ee012f2b02846fc9e5f6d8084f3c3af5407911a9b4a',
    network: 'testnet',
    type: 'ed25519'
  }];

  var invalidAddress = [
    'a5fyw6MQT6C6fpCBeSVdCfT3WS8WTTM24meT3nVuHyxJF7yKe;', // bad base58 string
    'c2RAAYPFsmREVPu6E4VaXGDxd3rAAJDohqkhCUPtwzLnnj2fsT', // wrong key part bit
    '2B55A7Avk7GGXSGtW5cUnyTPXZX4D8d7Ba3aqkAdo66wBSkQ9ry', // unrecognize key type
  ];

  describe('Create Address from public key', function(){
    it('should throw error on bad key length', function(){
      expect(function(){
        return new Address(common.generateRandomBytes(31));
      }).to.throw(Error);
    });
    it('should be able to create address for live net', function(){
      expect(function(){
        return new Address(new Buffer(validData[0].pubkey, 'hex'));
      }).to.not.throw();

      var address = new Address(new Buffer(validData[0].pubkey, 'hex'));
      expect(address.toString() === validData[0].address);
    });
    it('should be able to create address for test net', function(){
      expect(function(){
        return new Address(new Buffer(validData[1].pubkey, 'hex'), validData[1].network);
      }).to.not.throw();

      var address = new Address(new Buffer(validData[1].pubkey, 'hex'), validData[1].network);
      expect(address.toString()).to.equal(validData[1].address);
    });
    it('should be able to receive the hex string as pubkey', function(){
      var address = Address.fromPublicKey(validData[1].pubkey, validData[1].network);
      expect(address.toString()).to.equal(validData[1].address);
    });
    it('should return Address instance when initiating without `new` keyword', function(){
      var address = Address(new Buffer(validData[1].pubkey, 'hex'));
      expect(address).to.be.instanceof(Address);
    });
  });

  describe('Parse address from base58 string', function(){
    it('should throw error on bad base58 string', function(){
      expect(function(){
        return new Address(invalidAddress[0]);
      }).to.throw(Error);
    });
    it('should throw error on wrong public key bit', function(){
      expect(function(){
        return new Address(invalidAddress[1]);
      }).to.throw(Error);
    });
    it('should throw error on unknow keytype', function(){
      expect(function(){
        return new Address(invalidAddress[2]);
      }).to.throw(Error);
    });
    it('should be able to parse the live net address correctly', function(){
      expect(function(){
        return new Address(validData[0].address);
      }).to.not.throw();
      var address = new Address(validData[0].address);
      expect(address.toString() == validData[0].address);
      expect(address.getNetwork() == validData[0].network);
      expect(address.getPublicKey() == validData[0].pubkey);
      expect(address.getKeyType() == validData[0].type);
    });
    it('should be able to parse the test net address correctly', function(){
      expect(function(){
        return new Address(validData[1].address);
      }).to.not.throw();
      var address = new Address(validData[1].address);
      expect(address.toString() == validData[1].address);
      expect(address.getNetwork() == validData[1].network);
      expect(address.getPublicKey() == validData[1].pubkey);
      expect(address.getKeyType() == validData[1].type);
    });
  });

  describe('Validate address string', function(){
    it('should return false on various invalid addresses', function(){
      expect(Address.isValid(invalidAddress[0])).to.equal(false);
      expect(Address.isValid(invalidAddress[1])).to.equal(false);
      expect(Address.isValid(invalidAddress[2])).to.equal(false);
    });
    it('should return false on wrong network type', function(){
      expect(Address.isValid(validData[0].address, 'testnet')).to.equal(false);
      expect(Address.isValid(validData[1].address, 'livenet')).to.equal(false);
    });
    it('should return true on right info', function(){
      expect(Address.isValid(validData[0].address)).to.equal(true);
      expect(Address.isValid(validData[0].address, 'livenet')).to.equal(true);
      expect(Address.isValid(validData[1].address)).to.equal(true);
      expect(Address.isValid(validData[1].address, 'testnet')).to.equal(true);
    });
  });
});