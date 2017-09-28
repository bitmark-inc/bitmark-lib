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
 *   .fromTx(issue/transfer/txidstring)
 *   .toAccountNumber(accountNumberString)
 *   .sign(key)
 *
 * **** Util
 * asset.toJSON()
 */

describe('Transfer', function(){
  var assetPk, asset;
  var issuePk, issueWithId, issueWithoutId;
  var transferPk, wrongTransferPk;
  var signature;

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
    signature = 'e9264a1bfd6ac467890504d39d567c8b738be3a4eed8f826d3226c0abcd6f14de13318e3b28c39331147bbe07f79a27cc349df1c3350d47e35ff27774cae0f04';
  });

  it('should throw error if it can not get the previous txid', function(){
    expect(function(){
      return new Transfer().fromTx(issueWithoutId);
    }).to.throw(Error);
  });

  it('should be able to get the id from previous tx', function(){
    expect(function(){
      return new Transfer().fromTx(issueWithId);
    }).to.not.throw();
  });
  it('should be able to use a string as previous txid', function(){
    expect(function(){
      return new Transfer().fromTx(issueWithId.getId());
    }).to.not.throw();
  });

  it('should throw error if new owner is on different network', function(){
    expect(function(){
      return new Transfer().fromTx(issueWithId).toAccountNumber(new AuthKey('livenet').getAccountNumber());
    }).to.throw(Error);
  });
  it('should require previous txid and new owner to sign', function(){
    expect(function(){
      return new Transfer().fromTx(issueWithId).sign(issuePk);
    }).to.throw(Error);
    expect(function(){
      return new Transfer().toAccountNumber().sign(issuePk);
    }).to.throw(Error);
    expect(function(){
      return new Transfer().fromTx(issueWithId).toAccountNumber(transferPk.getAccountNumber()).sign(issuePk);
    }).to.not.throw();
  });
  it('should verify the previous owner and signing key if possible', function(){
    expect(function(){
      return new Transfer().fromTx(issueWithId).toAccountNumber(transferPk.getAccountNumber()).sign(wrongTransferPk);
    }).to.throw(Error);
    expect(function(){
      return new Transfer().fromTx(issueWithId).toAccountNumber(transferPk.getAccountNumber()).sign(issuePk);
    }).to.not.throw();
  });

  it('getters should return right results', function(){
    var transfer = new Transfer().fromTx(issueWithId).toAccountNumber(transferPk.getAccountNumber()).sign(issuePk);
    expect(transfer.isSigned()).to.equal(true);
    expect(transfer.getOwner().toString()).to.equal(transferPk.getAccountNumber().toString());
    expect(transfer.getPreTxId()).to.equal(issueWithId.getId());
    expect(transfer.getSignature().toString('hex')).to.equal(signature);
    expect(transfer.toJSON()).to.deep.equal({
      link: issueWithId.getId(),
      owner: transferPk.getAccountNumber().toString(),
      signature: signature
    });
  });

  it('should return Transfer instance when initiating without `new` keyword', function(){
    var transfer = Transfer().fromTx(issueWithId).toAccountNumber(transferPk.getAccountNumber()).sign(issuePk);
    expect(transfer).to.be.instanceof(Transfer);
  });
});
