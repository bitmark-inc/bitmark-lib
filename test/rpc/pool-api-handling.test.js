var chai = chai || require('chai');
var expect = chai.expect;
var lib = require('../../index.js');

var config = require(__baseBitmarkLibModulePath + 'lib/config.js');
var common = require(__baseBitmarkLibModulePath + 'lib/util/common.js');
var networks = require(__baseBitmarkLibModulePath + 'lib/networks.js');
var Pool = require(__baseBitmarkLibModulePath + 'lib/rpc/pool.js');
var Address = lib.Address;
var PrivateKey = lib.PrivateKey;
var Asset = lib.Asset;
var Issue = lib.Issue;
var Transfer = lib.Transfer;

var tls = require('tls');
var fs = require('fs');
var options = {
  key: fs.readFileSync('./test/rpc/private-key.pem'),
  cert: fs.readFileSync('./test/rpc/public-cert.pem')
};

var rpcDataToReturn = {
  createBitmarks: {
    "result": {
      "assets": [{
        "index":"3e6e66b398030966f087347d447ea0d35133099a247d0dd9bfec29ac2f853d20de6ac10a8e5348ab7bdf16f8633780365e7ea62a39b5ab8c490dedd8573b3dc1",
        "duplicate":false
      },{
        "index":"63c19ce1a7529b92ef8ade13f8dccd9c45283a6bd44310bd06205a420649a98bb0e9a32d7eaeafe2b7a6fa127af1303f861c457e72a117c43e815fb51fbb171a",
        "duplicate":false
      }],
      "issues": [{
        "txId":"933890e98221e04eee661b3d889fcc5c1ec512ee636d8991f030351f76af456e"
      },{
        "txId":"5a1b5c5061e8b703cbd9e35bb8fbcd5ca1a06763cea0c61e810bed5c4e81f221"
      }],
      "payId":"4cd4930055d25b51cc2971ce2c9a0121df57031a59d1d502dba247e026a79c8704d590dd324e56857f75de00bb0d7837",
      "payNonce":"01ce0a31d8c5c74d",
      "difficulty":"00000086bca1af286bcb9d6deab9cb860c2d3c5a060bde79dbbdd0ebf215d05d"
    },
    "error": null
  },
  proofBitmark: {
    "result": {
      "status": "Accepted"
    },
    "error": null
  },
  transferBitmark: {
    "result":{
      "txId":"8f9639f2d82233c5f0d198ea9c718b0f1792ae62739ed15e4eff8519dc819440",
      "payId":"f493e77e8a050f863bc272b6973888fe5069ea13a168560e5096425ec7562c8a90fe207c2717c7e099f2a108b4db391a",
      "payments":[{
        "currency":"BTC",
        "address":"mr8DEygRvQwKfP4sVZuHVozqvzW89e193j",
        "amount":"5000"
      }]},
    "error":null
  },
  payForBitmark: {
    "method":"Bitmarks.Pay",
    "params":[{
      "payId":"f493e77e8a050f863bc272b6973888fe5069ea13a168560e5096425ec7562c8a90fe207c2717c7e099f2a108b4db391a",
      "receipt":"bfb329b78ed4066cbdfa6db64bed3441ee7ceeb3c589f1771cd746fe5b167223"
    }]
  }
};

var createAPIHandlingTestServer = function(port){
  var mergeResult = '';
  var server = tls.createServer(options, function(stream){
    stream.on('data', function(data){
      var method, tmp;
      data = data.toString();
      if (data === 'end'){ // To test ended signal
        stream.end();
        return;
      }

      data = JSON.parse(data);
      method = data.method;
      if (method === 'Node.List') {
        tmp = {id: data.id, ok: true, result: {nodes: []}};
        stream.write(JSON.stringify(tmp) + String.fromCharCode(10));
        return;
      }

      // if (method === 'Assets.Register') {
      //   tmp = rpcDataToReturn.registerAssets;
      //   tmp.id = data.id;
      //   stream.write(JSON.stringify(tmp) + String.fromCharCode(10));
      //   return;
      // }

      // if (method === 'Bitmarks.Issue') {
      //   tmp = rpcDataToReturn.issueBitmarks;
      //   tmp.id = data.id;
      //   stream.write(JSON.stringify(tmp) + String.fromCharCode(10));
      //   return;
      // }

      if (method === 'Bitmarks.Create') {
        tmp = rpcDataToReturn.createBitmarks;
        tmp.id = data.id;
        stream.write(JSON.stringify(tmp) + String.fromCharCode(10));
        return;
      }

      if (method === 'Bitmarks.Proof') {
        tmp = rpcDataToReturn.proofBitmark;
        tmp.id = data.id;
        stream.write(JSON.stringify(tmp) + String.fromCharCode(10));
        return;
      }

      if (method === 'Bitmark.Transfer') {
        tmp = rpcDataToReturn.transferBitmark;
        tmp.id = data.id;
        stream.write(JSON.stringify(tmp) + String.fromCharCode(10));
        return;
      }

      if (method === 'Bitmarks.Pay') {
        tmp = rpcDataToReturn.payForBitmark;
        tmp.id = data.id;
        stream.write(JSON.stringify(tmp) + String.fromCharCode(10));
        return;
      }
    });
  });
  server.listen(port || 5000);
};

var changeConfig = function(enoughAliveNode, enoughNodeRecord) {
  config.rpc.discover.enoughAliveNode = enoughAliveNode;
  config.rpc.discover.enoughNodeRecord = enoughNodeRecord;
};

var createLibTestNetwork = function() {
  networks.api_handling_testnet = {
    name: 'api_handling_testnet',
    address_value: networks.testnet.address_value,
    kif_value: networks.testnet.kif_value,
    static_hostnames: [],
    static_nodes: ['127.0.0.1:5000', '127.0.0.1:5001']
  };
};

createAPIHandlingTestServer(5000);
createAPIHandlingTestServer(5001);
createLibTestNetwork();
changeConfig(1, 1);

var pk1 = PrivateKey.fromKIF('ce5MNS5PwvZ1bo5cU9Fex7He2tMpFP2Q42ToKZTBEBdA5f4dXm');
var pk2 = PrivateKey.fromKIF('ddZdMwNbSoAKV72w5EHAfhJMShN9JphvSgpdAhWu7JYmEAeiQm');
var asset1 = new Asset()
      .setName('Test Bitmark Lib')
      .addMetadata('description', 'this is description')
      .setFingerprint('Test Bitmark Lib 11')
      .sign(pk1);
var asset2 = new Asset()
      .setName('Test Bitmark Lib')
      .addMetadata('description', 'this is description')
      .setFingerprint('Test Bitmark Lib 12')
      .sign(pk2);
var issue1 = new Issue()
          .fromAsset(asset1)
          .setNonce(1475482198529)
          .sign(pk1);
var issue2 = new Issue()
          .fromAsset(asset2)
          .setNonce(1475482198537)
          .sign(pk2);
var transfer1 = new Transfer();
var issuePayId, issuePayNonce, issueDifficulty;
var transferPayId, transferPayments;


describe('Supporting API', function() {
  this.timeout(15000);
  var pool = new Pool([], 'api_handling_testnet');
  it('should support create bitmarks', function(done) {
    pool.createBitmarks([asset1, asset2], [issue1, issue2], function(error, data, paymentInfo) {
      issuePayId = paymentInfo.payId;
      issuePayNonce = paymentInfo.payNonce;
      issueDifficulty = paymentInfo.difficulty;
      expect(issuePayId).to.equal(rpcDataToReturn.createBitmarks.result.payId);
      expect(issuePayNonce).to.equal(rpcDataToReturn.createBitmarks.result.payNonce);
      expect(issueDifficulty).to.equal(rpcDataToReturn.createBitmarks.result.difficulty);
      expect(error).to.equal.null;
      done();
    });
  });
  it('should support payment by hascash', function(done) {
    issuePayId = new Buffer(issuePayId, 'hex');
    issuePayNonce = new Buffer(issuePayNonce, 'hex');
    issueDifficulty = new Buffer(issueDifficulty, 'hex');
    var nonce = '80000000027a75c1';
    pool.payByHashCash({payId: issuePayId.toString('hex'), nonce: nonce.toString('hex')}, function(error, data) {
      expect(error).to.equal.null;
      done();
    });
  });
  it('should support transfer bitmark', function(done) {
    transfer1.from(issue1).to(pk2.getAddress().toString()).sign(pk1);
    pool.transferBitmark(transfer1, function(error, data, paymentInfo) {
      transferPayId = paymentInfo.payId;
      transferPayments = paymentInfo.payments;
      expect(transferPayId).to.equal(rpcDataToReturn.transferBitmark.result.payId);
      expect(transferPayments).to.deep.equal(rpcDataToReturn.transferBitmark.result.payments);
      expect(error).to.equal.null;
      done();
    });
  });
  it('should support paying for bitmark', function(done) {
    pool.payBitmark({payId: transferPayId, receipt: 'bfb329b78ed4066cbdfa6db64bed3441ee7ceeb3c589f1771cd746fe5b167223'}, function(error, data) {
      expect(error).to.equal.null;
      done();
    });
  });
});