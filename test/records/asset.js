var chai = chai || require('chai');
var expect = chai.expect;
var libDir = '../../lib/';
var config = require(libDir + 'config.js');
var common = require(libDir + 'util/common.js');

var PrivateKey = require(libDir + 'private-key.js');
var Asset = require(libDir + 'records/asset.js');

/**
 * ****  CREATING ASSET
 * new Asset()
 *   .setName(name)
 *   .setDescription(description)
 *   .setFingerprint(fingerprint)
 *   .sign(privateKey);
 *
 * **** Util
 * asset.getRPCMessage()
 * asset.toJSON()
 */

function makeRandomString(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < length; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

var maxName = config.record.asset.max_name;
var maxDescription = config.record.asset.max_description;
var maxFingerprint = config.record.asset.max_fingerprint;
var pk = new PrivateKey('testnet');

describe('Asset', function(){
  it('should throw error on too long name', function(){
    expect(function(){
      return new Asset().setName(makeRandomString(maxName+1));
    }).to.throw(Error);
  });
  it('should throw error on too long description', function(){
    expect(function(){
      return new Asset().setDescription(makeRandomString(maxDescription+1));
    }).to.throw(Error);
  });
  it('should throw error on too long fingerprint', function(){
    expect(function(){
      return new Asset().setDescription(makeRandomString(maxFingerprint+1));
    }).to.throw(Error);
  });
  it('should not sign when name is missing', function(){
    expect(function(){
      return new Asset()
              .setDescription(makeRandomString(maxDescription))
              .setFingerprint(makeRandomString(maxFingerprint))
              .sign(pk);
    }).to.throw(Error);
  });
  it('should not sign when fingerprint is missing', function(){
    expect(function(){
      return new Asset()
              .setName(makeRandomString(maxName))
              .setDescription(makeRandomString(maxDescription))
              .sign(pk);
    }).to.throw(Error);
  });
  it('should still sign when description is missing', function(){
    expect(function(){
      return new Asset()
              .setName(makeRandomString(maxName))
              .setFingerprint(makeRandomString(maxFingerprint))
              .sign(pk);
    }).to.not.throw(Error);
  });
  var data = {
    pk: PrivateKey.fromKIF('dDRKt8J6MfA4em7zwy2wxmogf3FhSRGmescE6fELzxh48JJrwR'),
    name: 'this is name',
    description: 'this is description',
    fingerprint: '5b071fe12fd7e624cac31b3d774715c11a422a3ceb160b4f1806057a3413a13c',
    signature: 'e2ed1d6747cb6447477fa917135df50212f28743e1039e05ff03107f5608b5785a22e7a05c5f5b92b72748bbfe40ab282cb782638d18bc237e90570390dd0b04'
  };
  it('should be able to generate the right signature for the record', function(){
    var asset = new Asset()
                  .setName(data.name)
                  .setDescription(data.description)
                  .setFingerprint(data.fingerprint)
                  .sign(data.pk);
    expect(asset.getSignature().toString('hex')).to.equal(data.signature);
  });
  it('getters should return correct result', function(){
    var asset = new Asset();
    expect(asset.isSigned()).to.not.be.ok;
    asset.setName(data.name)
      .setDescription(data.description)
      .setFingerprint(data.fingerprint)
      .sign(data.pk);
    expect(asset.isSigned()).to.be.ok;
    expect(asset.getName()).to.equal(data.name);
    expect(asset.getDescription()).to.equal(data.description);
    expect(asset.getFingerprint()).to.equal(data.fingerprint);
    expect(asset.getRegistrant().toString()).to.equal(data.pk.getAddress().toString());
    expect(asset.getSignature().toString('hex')).to.equal(data.signature);
  });
  it('should return Asset instance when initiating without `new` keyword', function(){
    var asset = Asset();
    expect(asset).to.be.instanceof(Asset);
  });

});