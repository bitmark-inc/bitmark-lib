var chai = chai || require('chai');
var expect = chai.expect;
var libDir = '../../lib/';
var config = require(libDir + 'config.js');
var common = require(libDir + 'util/common.js');

var PrivateKey = require(libDir + 'private-key.js');
var Asset = require(libDir + 'records/asset.js');
var Issue = require(libDir + 'records/issue.js');
var Transfer = require(libDir + 'records/transfer.js');

/**
 * ****  CREATING TRANSFER
 * new Transfer()
 *   .from(issue/transfer/txidstring)
 *   .to(addressString)
 *   .sign(key)
 *
 * **** Util
 * asset.getRPCMessage()
 * asset.toJSON()
 */

describe('Transfer', function(){
  var assetPk, asset;
  var issuePk, issueWithId, issueWithoutId;
  var transferPk, transfer;

  before(function(){
    assetPk = PrivateKey.fromKIF('dDRKt8J6MfA4em7zwy2wxmogf3FhSRGmescE6fELzxh48JJrwR');
    asset = new Asset()
                .setName('this is name')
                .setDescription('this is description')
                .setFingerprint('5b071fe12fd7e624cac31b3d774715c11a422a3ceb160b4f1806057a3413a13c')
                .sign(assetPk);
    asset._id = 'Qk1BMA6j4S+GR/wiSYZaNiNoP5nzDPOVUp9xh7hqPJIgAhG5JHCurWesGW3zsZOY1CRBoNowiD+HOmFEapUk5TcTQc4=';
    asset._txid = 'Qk1LMIidXQTVkrhVdJW6XDS7pS51QCt/i5kaktJVFRakAfLw';

    issuePk = PrivateKey.fromKIF('c7SBAFCPSdwwAmQ11XFYe33thejPbKFMMTv5zaTREt8oPNNVMu');
    issueWithoutId = new Issue().fromAsset(asset).setNonce(0).sign(issuePk);
    issueWithId = new Issue().fromAsset(asset).setNonce(0).sign(issuePk);
    issueWithId._txId = 'Qk1LMDU0wALSnnZAqDonqDxigp61e/f/3pwW4celYkqIXlGo';

    transferPk = PrivateKey.fromKIF('dknrVT2Ybrf4AJBpVzBxQuXQ5LG1maQEskkhmmSVCwiQeRGewM');
  });

  it('should throw error if it can not get the previous txid', function(){
    expect(function(){
      return new Transfer().from(issueWithoutId);
    }).to.throw(Error);
  });

  it('should be able to get the id from previous tx', function(){
    expect(function(){
      return new Transfer().from(issueWithId);
    }).to.not.throw();
  });
  it('should be able to use a string as previous txid', function(){
    expect(function(){
      return new Transfer().from(issueWithId.getTxId());
    }).to.not.throw();
  });

  it('should throw error if new owner is on different network', function(){
    expect(function(){
      return new Transfer().from(issueWithId).to(new PrivateKey('livenet').getAddress());
    }).to.throw(Error);
  });
  it('should require previous txid and new owner to sign', function(){
    expect(function(){
      return new Transfer().from(issueWithId).sign(issuePk);
    }).to.throw(Error);
    expect(function(){
      return new Transfer().to().sign(issuePk);
    }).to.throw(Error);
    expect(function(){
      return new Transfer().from(issueWithId).to(transferPk.getAddress()).sign(issuePk);
    }).to.not.throw();
  });
  it('should verify the previous owner and signing key if possible', function(){
    expect(function(){
      return new Transfer().from(issueWithId).to(transferPk.getAddress()).sign(assetPk);
    }).to.throw(Error);
    expect(function(){
      return new Transfer().from(issueWithId).to(transferPk.getAddress()).sign(issuePk);
    }).to.not.throw();
  });

  it('getters should return right results', function(){
    var transfer = new Transfer().from(issueWithId).to(transferPk.getAddress()).sign(issuePk);
    expect(transfer.isSigned()).to.equal(true);
    expect(transfer.getOwner().toString()).to.equal(transferPk.getAddress().toString());
    expect(transfer.getPreTx()).to.equal(issueWithId.getTxId());
  });
});