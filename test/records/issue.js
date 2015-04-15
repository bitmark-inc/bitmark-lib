var chai = chai || require('chai');
var expect = chai.expect;
var libDir = '../../lib/';
var config = require(libDir + 'config.js');
var common = require(libDir + 'util/common.js');

var PrivateKey = require(libDir + 'private-key.js');
var Asset = require(libDir + 'records/asset.js');
var Issue = require(libDir + 'records/issue.js');

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
  var issuePk, issueSignature;

  before(function(){
    assetPk = PrivateKey.fromKIF('dDRKt8J6MfA4em7zwy2wxmogf3FhSRGmescE6fELzxh48JJrwR');
    assetWithoutId = new Asset()
                .setName('this is name')
                .setDescription('this is description')
                .setFingerprint('5b071fe12fd7e624cac31b3d774715c11a422a3ceb160b4f1806057a3413a13c')
                .sign(assetPk);

    assetWithId = new Asset()
                .setName('this is name')
                .setDescription('this is description')
                .setFingerprint('5b071fe12fd7e624cac31b3d774715c11a422a3ceb160b4f1806057a3413a13c')
                .sign(assetPk);
    assetWithId._id = 'Qk1BMA6j4S+GR/wiSYZaNiNoP5nzDPOVUp9xh7hqPJIgAhG5JHCurWesGW3zsZOY1CRBoNowiD+HOmFEapUk5TcTQc4=';
    assetWithId._txid = 'Qk1LMIidXQTVkrhVdJW6XDS7pS51QCt/i5kaktJVFRakAfLw';

    issuePk = PrivateKey.fromKIF('c7SBAFCPSdwwAmQ11XFYe33thejPbKFMMTv5zaTREt8oPNNVMu');
    issueSignature = '92d67d53389d37d014e9eebbbdd9c15a295acd1009a7823183dd420142f837bab0be29dd49a3c63fee053c5bb5fba5b68fc75604a39ec3653f96859b6710e001';
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
    var issue = new Issue().fromAsset(assetWithId).setNonce(1).sign(issuePk);
    expect(issue.getSignature().toString('hex')).to.equal(issueSignature);
  });
  it('getters should return right result', function(){
    var issue = new Issue().fromAsset(assetWithId).setNonce(1).sign(issuePk);
    expect(issue.isSigned()).to.equal(true);
    expect(issue.getOwner().toString()).to.equal(issuePk.getAddress().toString());
    expect(issue.getSignature().toString('hex')).to.equal(issueSignature);
    expect(issue.getAsset()).to.equal(assetWithId.getId());
  });
});