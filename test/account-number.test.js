var chai = chai || require('chai');
var expect = chai.expect;
var lib = require('../index.js');
var AccountNumber = lib.AccountNumber;

var config = require(global.__baseBitmarkLibModulePath + 'lib/config.js');
var common = require(global.__baseBitmarkLibModulePath + 'lib/util/common.js');

/**
 * ****  CREATING ADDRESS
 * new AccountNumber(accountNumberString / pubkey, network)
 * AccountNumber.fromString(accountNumberString)
 * AccountNumber.fromPublicKey(publicKeyHex/Buffer, network)
 *
 * **** VALIDATE ADDRESS
 * AccountNumber.isValid(accountNumberString, network)
 * AccountNumber.getValidationError(accountNumberString, network) // Unimplemented
 *
 * **** GET INFO
 * AccountNumber.toString(network)
 * AccountNumber.getNetwork()
 * AccountNumber.getPublicKey()
 * AccountNumber.getKeyType()
 */

describe('AccountNumber', function(){
  describe('Constructor', function(){
    it('can\'t build without data', function(){
      expect(function(){
        return new AccountNumber();
      }).to.throw(Error);
    });
    it('should throw error on bad network param', function(){
      expect(function(){
        return new AccountNumber(common.generateRandomBytes(32), 'main_net');
      }).to.throw(Error);
    });
    it('should throw an error on bad type param', function() {
      expect(function() {
        return new AccountNumber(common.generateRandomBytes(32), 'livenet', 'badtype');
      }).to.throw(Error);
    });
  });

  var validData = [{
    // kif: Zjbm1pyA1zjpy5RTeHtBqSAr2NvErTxsovkbWs1duVy8yYG9Xr
    account_number: 'a5fyw6MQT6C6fpCBeSVdCfT3WS8WTTM24meT3nVuHyxJF7yKes',
    pubkey: '04946802fadd6d7723985ee012f2b02846fc9e5f6d8084f3c3af5407911a9b4a',
    network: 'livenet',
    type: 'ed25519'
  },{
    // kif: dd67Uj2rsMC6cEqGoXt6UdigFcMYG9iT64y5pEodDWk8HKUXeM
    account_number: 'dyALPzR7JSeNJybzogVXqrzsjfZos96bLurwMAHtbzjHSzk4yh',
    pubkey: '04946802fadd6d7723985ee012f2b02846fc9e5f6d8084f3c3af5407911a9b4a',
    network: 'testnet',
    type: 'ed25519'
  }];

  var invalidAccountNumber = [
    'a5fyw6MQT6C6fpCBeSVdCfT3WS8WTTM24meT3nVuHyxJF7yKe;', // bad base58 string
    'c2RAAYPFsmREVPu6E4VaXGDxd3rAAJDohqkhCUPtwzLnnj2fsT', // wrong key part bit
    '2B55A7Avk7GGXSGtW5cUnyTPXZX4D8d7Ba3aqkAdo66wBSkQ9ry', // unrecognize key type
  ];

  describe('Create AccountNumber from public key', function(){
    it('should throw error on bad key length', function(){
      expect(function(){
        return new AccountNumber(common.generateRandomBytes(31));
      }).to.throw(Error);
    });
    it('should be able to create account number for live net', function(){
      expect(function(){
        return new AccountNumber(new Buffer(validData[0].pubkey, 'hex'));
      }).to.not.throw();

      var accountNumber = new AccountNumber(new Buffer(validData[0].pubkey, 'hex'));
      expect(accountNumber.toString() === validData[0].account_number);
    });
    it('should be able to create account number for test net', function(){
      expect(function(){
        return new AccountNumber(new Buffer(validData[1].pubkey, 'hex'), validData[1].network);
      }).to.not.throw();

      var accountNumber = new AccountNumber(new Buffer(validData[1].pubkey, 'hex'), validData[1].network);
      expect(accountNumber.toString()).to.equal(validData[1].account_number);
    });
    it('should be able to receive the hex string as pubkey', function(){
      var accountNumber = AccountNumber.fromPublicKey(validData[1].pubkey, validData[1].network);
      expect(accountNumber.toString()).to.equal(validData[1].account_number);
    });
    it('should return AccountNumber instance when initiating without `new` keyword', function(){
      var accountNumber = AccountNumber(new Buffer(validData[1].pubkey, 'hex'));
      expect(accountNumber).to.be.instanceof(AccountNumber);
    });
  });

  describe('Parse account number from base58 string', function(){
    it('should throw error on bad base58 string', function(){
      expect(function(){
        return new AccountNumber(invalidAccountNumber[0]);
      }).to.throw(Error);
    });
    it('should throw error on wrong public key bit', function(){
      expect(function(){
        return new AccountNumber(invalidAccountNumber[1]);
      }).to.throw(Error);
    });
    it('should throw error on unknow keytype', function(){
      expect(function(){
        return new AccountNumber(invalidAccountNumber[2]);
      }).to.throw(Error);
    });
    it('should be able to parse the live net account number correctly', function(){
      expect(function(){
        return new AccountNumber(validData[0].account_number);
      }).to.not.throw();
      var accountNumber = new AccountNumber(validData[0].account_number);
      expect(accountNumber.toString() == validData[0].account_number);
      expect(accountNumber.getNetwork() == validData[0].network);
      expect(accountNumber.getPublicKey() == validData[0].pubkey);
      expect(accountNumber.getKeyType() == validData[0].type);
    });
    it('should be able to parse the test net account number correctly', function(){
      expect(function(){
        return new AccountNumber(validData[1].account_number);
      }).to.not.throw();
      var accountNumber = new AccountNumber(validData[1].account_number);
      expect(accountNumber.toString() == validData[1].account_number);
      expect(accountNumber.getNetwork() == validData[1].network);
      expect(accountNumber.getPublicKey() == validData[1].pubkey);
      expect(accountNumber.getKeyType() == validData[1].type);
    });
  });

  describe('Validate account number string', function(){
    it('should return false on various invalid account numbers', function(){
      expect(AccountNumber.isValid(invalidAccountNumber[0])).to.equal(false);
      expect(AccountNumber.isValid(invalidAccountNumber[1])).to.equal(false);
      expect(AccountNumber.isValid(invalidAccountNumber[2])).to.equal(false);
    });
    it('should return false on wrong network type', function(){
      expect(AccountNumber.isValid(validData[0].account_number, 'testnet')).to.equal(false);
      expect(AccountNumber.isValid(validData[1].account_number, 'livenet')).to.equal(false);
    });
    it('should return true on right info', function(){
      expect(AccountNumber.isValid(validData[0].account_number)).to.equal(true);
      expect(AccountNumber.isValid(validData[0].account_number, 'livenet')).to.equal(true);
      expect(AccountNumber.isValid(validData[1].account_number)).to.equal(true);
      expect(AccountNumber.isValid(validData[1].account_number, 'testnet')).to.equal(true);
    });
  });
});
