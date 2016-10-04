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
    assetPk = PrivateKey.fromKIF('ce5MNS5PwvZ1bo5cU9Fex7He2tMpFP2Q42ToKZTBEBdA5f4dXm');
    asset = new Asset()
                .setName('Test Bitmark Lib')
                .setDescription('Asset description')
                .setFingerprint('Test Bitmark Lib 11')
                .sign(assetPk);
    asset._id = '3e6e66b398030966f087347d447ea0d35133099a247d0dd9bfec29ac2f853d20de6ac10a8e5348ab7bdf16f8633780365e7ea62a39b5ab8c490dedd8573b3dc1';

    issuePk = PrivateKey.fromKIF('ce5MNS5PwvZ1bo5cU9Fex7He2tMpFP2Q42ToKZTBEBdA5f4dXm');
    issueWithoutId = new Issue().fromAsset(asset).setNonce(1475482198529).sign(issuePk);
    issueWithId = new Issue().fromAsset(asset).setNonce(1475482198529).sign(issuePk);
    issueWithId._txId = '933890e98221e04eee661b3d889fcc5c1ec512ee636d8991f030351f76af456e';

    transferPk = PrivateKey.fromKIF('ce5MNS5PwvZ1bo5cU9Fex7He2tMpFP2Q42ToKZTBEBdA5f4dXm');
    wrongTransferPk = PrivateKey.fromKIF('ddZdMwNbSoAKV72w5EHAfhJMShN9JphvSgpdAhWu7JYmEAeiQm');
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
      return new Transfer().from(issueWithId).to(transferPk.getAddress()).sign(wrongTransferPk);
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