var chai = chai || require('chai');
var expect = chai.expect;
var lib = require('../index.js');
var Seed = lib.Seed;

var config = require(global.__baseBitmarkLibModulePath + 'lib/config.js');

var validData = [{
  core: '215ee785527df33665bd3a51df18cccf92d4e24628ca0619a26fd082fb0a29be',
  seed: '5XEECsKPsXJEZRQJfeRU75tEk72WMs87jW1x9MhT6jF3UxMVaAZ7TSi',
  network: 'testnet',
  version: 1
}, {
  core: '651bf8bc9f8e8fce9d18ac62fb93a483a06d1b43fdf28d1afa5578bc7518a6ac',
  seed: '5XEECqtUz83pdgg2L11UrMBb34za1rhi12GNFmRRrd8Qudi1nkJbNxk',
  network: 'livenet',
  version: 1
}];

describe('Seed', function() {
  describe('Constructor', function() {
    it('should build with livenet as default', function() {
      expect(function(){
        return new Seed();
      }).to.not.throw();
  
      var seed = new Seed();
      expect(seed.toString()).to.be.ok;
      expect(seed.getNetwork()).to.equal('livenet');
      expect(Buffer.isBuffer(seed.getCore())).to.be.true;
      expect(seed.getVersion()).to.equal(config.seed.version);
    });
  
    it('should build for testnet if specified', function() {
      var seed = new Seed('testnet');
      expect(seed.toString()).to.be.ok;
      expect(seed.getNetwork()).to.equal('testnet');
      expect(Buffer.isBuffer(seed.getCore())).to.be.true;
      expect(seed.getVersion()).to.equal(config.seed.version);
    });
  
    it('should throw errors on wrong network or version', function() {
      expect(function() {
        return new Seed('fakenet');
      }).to.throw(Error);
      expect(function() {
        return new Seed('livenet', 2);
      }).to.throw(Error);
    });
  });

  describe('From existing data', function() {
    it('should reproduce right data from string', function() {
      validData.forEach(function(data) {
        var seed = Seed.fromString(data.seed);
        expect(seed.toString()).to.equal(data.seed);
        expect(seed.getCore().toString('hex')).to.equal(data.core);
        expect(seed.getNetwork()).to.equal(data.network);
        expect(seed.getVersion()).to.equal(data.version);
      });
    });
  });
});
