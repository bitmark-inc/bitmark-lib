var chai = chai || require('chai');
var expect = chai.expect;
var lib = require('../../index.js');

var config = require(__baseBitmarkLibModulePath + 'lib/config.js');
var common = require(__baseBitmarkLibModulePath + 'lib/util/common.js');

var PrivateKey = require(__baseBitmarkLibModulePath + 'lib/private-key.js');
var Asset = require(__baseBitmarkLibModulePath + 'lib/records/asset.js');
var Issue = require(__baseBitmarkLibModulePath + 'lib/records/issue.js');
var Transfer = require(__baseBitmarkLibModulePath + 'lib/records/transfer.js');

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
    asset._id = '424d41300ea3e12f8647fc2249865a3623683f99f30cf395529f7187b86a3c92200211b92470aead67ac196df3b19398d42441a0da30883f873a61446a9524e5371341ce';
    asset._txid = '424d4b30889d5d04d592b8557495ba5c34bba52e75402b7f8b991a92d2551516a401f2f0';

    issuePk = PrivateKey.fromKIF('c7SBAFCPSdwwAmQ11XFYe33thejPbKFMMTv5zaTREt8oPNNVMu');
    issueWithoutId = new Issue().fromAsset(asset).setNonce(0).sign(issuePk);
    issueWithId = new Issue().fromAsset(asset).setNonce(0).sign(issuePk);
    issueWithId._txId = '424d4b303534c002d29e7640a83a27a83c62829eb57bf7ffde9c16e1c7a5624a885e51a8';

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

  it('should return Transfer instance when initiating without `new` keyword', function(){
    var transfer = Transfer().from(issueWithId).to(transferPk.getAddress()).sign(issuePk);
    expect(transfer).to.be.instanceof(Transfer);
  });
});