var chai = chai || require('chai');
var expect = chai.expect;
var lib = require('../../index.js');
var AuthKey = lib.AuthKey;
var Asset = lib.Asset;
var Issue = lib.Issue;
var Transfer = lib.Transfer;

var config = require(global.__baseBitmarkLibModulePath + 'lib/config.js');
var common = require(global.__baseBitmarkLibModulePath + 'lib/util/common.js');

/**
 * ****  CREATING TRANSFER
 * new Transfer()
 *   .from(issue/transfer/txidstring)
 *   .to(accountNumberString)
 *   .sign(key)
 *
 * **** Util
 * asset.getRPCMessage()
 * asset.toJSON()
 */

describe('Transfer', function(){
  var assetPk, asset;
  var issuePk, issueWithId, issueWithoutId;
  var transferPk, wrongTransferPk;

  before(function(){
    assetPk = AuthKey.fromKIF('ce5MNS5PwvZ1bo5cU9Fex7He2tMpFP2Q42ToKZTBEBdA5f4dXm');
    asset = new Asset()
                .setName('Test Bitmark Lib')
                .addMetadata('description', 'this is description')
                .setFingerprint('Test Bitmark Lib 11')
                .sign(assetPk);

    issuePk = AuthKey.fromKIF('ce5MNS5PwvZ1bo5cU9Fex7He2tMpFP2Q42ToKZTBEBdA5f4dXm');
    issueWithoutId = new Issue().fromAsset(asset).setNonce(1475482198529);
    issueWithId = new Issue().fromAsset(asset).setNonce(1475482198529).sign(issuePk);

    transferPk = AuthKey.fromKIF('ce5MNS5PwvZ1bo5cU9Fex7He2tMpFP2Q42ToKZTBEBdA5f4dXm');
    wrongTransferPk = AuthKey.fromKIF('ddZdMwNbSoAKV72w5EHAfhJMShN9JphvSgpdAhWu7JYmEAeiQm');
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
      return new Transfer().from(issueWithId).to(new AuthKey('livenet').getAccountNumber());
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
      return new Transfer().from(issueWithId).to(transferPk.getAccountNumber()).sign(issuePk);
    }).to.not.throw();
  });
  it('should verify the previous owner and signing key if possible', function(){
    expect(function(){
      return new Transfer().from(issueWithId).to(transferPk.getAccountNumber()).sign(wrongTransferPk);
    }).to.throw(Error);
    expect(function(){
      return new Transfer().from(issueWithId).to(transferPk.getAccountNumber()).sign(issuePk);
    }).to.not.throw();
  });

  it('getters should return right results', function(){
    var transfer = new Transfer().from(issueWithId).to(transferPk.getAccountNumber()).sign(issuePk);
    expect(transfer.isSigned()).to.equal(true);
    expect(transfer.getOwner().toString()).to.equal(transferPk.getAccountNumber().toString());
    expect(transfer.getPreTx()).to.equal(issueWithId.getTxId());
  });

  it('should return Transfer instance when initiating without `new` keyword', function(){
    var transfer = Transfer().from(issueWithId).to(transferPk.getAccountNumber()).sign(issuePk);
    expect(transfer).to.be.instanceof(Transfer);
  });
});
