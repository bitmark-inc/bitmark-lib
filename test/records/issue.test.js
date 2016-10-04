var chai = chai || require('chai');
var expect = chai.expect;
var lib = require('../../index.js');

var config = require(__baseBitmarkLibModulePath + 'lib/config.js');
var common = require(__baseBitmarkLibModulePath + 'lib/util/common.js');

var PrivateKey = require(__baseBitmarkLibModulePath + 'lib/private-key.js');
var Asset = require(__baseBitmarkLibModulePath + 'lib/records/asset.js');
var Issue = require(__baseBitmarkLibModulePath + 'lib/records/issue.js');

/**
 * ****  CREATING ISSUE
 * new Issue()
 *   .fromAsset(asset/idstring)
 *   .setNonce(nonce)
 *   .sign(key)
 *
 * **** Util
 * asset.getRPCMessage()
 * asset.toJSON()
 */

describe('Issue', function(){
  var assetPk, assetWithoutId, assetWithId;
  var issueNonce, issuePk, issueSignature;

  before(function(){
    assetPk = PrivateKey.fromKIF('ce5MNS5PwvZ1bo5cU9Fex7He2tMpFP2Q42ToKZTBEBdA5f4dXm');
    assetWithoutId = new Asset()
                .setName('Test Bitmark Lib')
                .setDescription('Asset description')
                .setFingerprint('Test Bitmark Lib 11')
                .sign(assetPk);

    assetWithId = new Asset()
                .setName('this is name')
                .setDescription('this is description')
                .setFingerprint('Test Bitmark Lib 11')
                .sign(assetPk);
    assetWithId._id = '3e6e66b398030966f087347d447ea0d35133099a247d0dd9bfec29ac2f853d20de6ac10a8e5348ab7bdf16f8633780365e7ea62a39b5ab8c490dedd8573b3dc1';

    issueNonce = 1475482198529;
    issuePk = PrivateKey.fromKIF('ce5MNS5PwvZ1bo5cU9Fex7He2tMpFP2Q42ToKZTBEBdA5f4dXm');
    issueSignature = 'ea32dbdd484159d5dffb37a7d62282e85f83e478594acbdbf2254a81c4efae9f9c869fee52c652d40700b57da09f5a677058a441937976cd0f65b2e32f61cb0a';
  });

  it('should throw error if it can not get the asset id', function(){
    expect(function(){
      return new Issue().fromAsset(assetWithoutId);
    }).to.throw(Error);
  });

  it('should be able to get the id from asset', function(){
    expect(function(){
      return new Issue().fromAsset(assetWithId);
    }).to.not.throw();
  });
  it('should be able to use a string as id', function(){
    expect(function(){
      return new Issue().fromAsset(assetWithId.getId());
    }).to.not.throw();
  });

  it('should check whether nonce is of uint64 type', function(){
    expect(function(){
      return new Issue().setNonce(new Buffer([1,2,3]));
    }).to.throw(Error);
    expect(function(){
      return new Issue().setNonce('1');
    }).to.throw(Error);
    expect(function(){
      return new Issue().setNonce(-1);
    }).to.throw(Error);
    expect(function(){
      return new Issue().setNonce(0);
    }).to.not.throw();
  });
  it('can not sign without asset and nonce', function(){
    expect(function(){
      return new Issue().setNonce(1).sign(issuePk);
    }).to.throw(Error);
    expect(function(){
      return new Issue().fromAsset(assetWithId).sign(issuePk);
    }).to.throw(Error);
    expect(function(){
      return new Issue().fromAsset(assetWithId).setNonce(1).sign(issuePk);
    }).to.not.throw();
  });
  it('produce the right signature', function(){
    var issue = new Issue().fromAsset(assetWithId).setNonce(issueNonce).sign(issuePk);
    expect(issue.getSignature().toString('hex')).to.equal(issueSignature);
  });
  it('getters should return right result', function(){
    var issue = new Issue().fromAsset(assetWithId).setNonce(issueNonce).sign(issuePk);
    expect(issue.isSigned()).to.equal(true);
    expect(issue.getOwner().toString()).to.equal(issuePk.getAddress().toString());
    expect(issue.getSignature().toString('hex')).to.equal(issueSignature);
    expect(issue.getAsset()).to.equal(assetWithId.getId());
  });
  it('should return Issue instance when initiating without `new` keyword', function(){
    var issue = Issue().fromAsset(assetWithId).setNonce(issueNonce).sign(issuePk);
    expect(issue).to.be.instanceof(Issue);
  });
});