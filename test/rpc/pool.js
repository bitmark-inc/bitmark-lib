var chai = chai || require('chai');
var expect = chai.expect;

var libDir = '../../lib/';
var Pool = require(libDir + 'rpc/pool.js');
var PrivateKey = require(libDir + 'private-key.js');
var Asset = require(libDir + 'records/asset.js');
var Issue = require(libDir + 'records/issue.js');
var Transfer = require(libDir + 'records/transfer.js');
var config = require(libDir + 'config.js');
var common = require(libDir + 'util/common.js');
var networks = require(libDir + 'networks.js');


var tls = require('tls');
var fs = require('fs');
var options = {
  key: fs.readFileSync('./test/rpc/private-key.pem'),
  cert: fs.readFileSync('./test/rpc/public-cert.pem')
};

// make it get more nodes faster
config.rpc.renewal_few = 2000;

function createRPCFailServer(port) {
  var server = tls.createServer(options, function(stream){
    stream.on('data', function(data){
      data = data.toString();
      data = JSON.parse(data);
      var method = data.method;
      var result = null;
      if (method === 'Node.List') {
        result = {id: data.id, ok: true, result: {addresses: ['127.0.0.1:8002', '127.0.0.1:8003']}};
        stream.write(JSON.stringify(result) + String.fromCharCode(10));
      } else {
        result = {id: data.id, ok: false, error: 'some errors'};
        stream.write(JSON.stringify(result) + String.fromCharCode(10));
      }
    });
  });
  server.listen(port);
}

function createRPCServer(port) {
  var server = tls.createServer(options, function(stream){
    stream.on('data', function(data){
      data = data.toString();
      data = JSON.parse(data);
      var method = data.method;
      var result = null;

      if (method === 'Node.List') {
        result = {id: data.id, ok: true, result: {addresses: ['127.0.0.1:8004']}};
        stream.write(JSON.stringify(result) + String.fromCharCode(10));
      } else if (method === 'Asset.Register') {
        result = {id: data.id, ok: true, result: {
          txid: 'Qk1LMOCj4idjqLu4rrKpf0p/33itNG1Np7dHx4+yDKNz1mxA',
          asset: 'Qk1BMDvM9A1um1lsiknf3kPUWPu4TdfD/+TBNhpLx22f8+RKEBG7gztnGVKQEyF3B1cCOkcK/H8wm+JyrriA6ZPkGDg=',
          paymentAddress: null,
          duplicate: false
        }};
        stream.write(JSON.stringify(result) + String.fromCharCode(10));
      } else if (method === 'Bitmark.Issue') {
        result = {id: data.id, ok: true, result: {
          txid: 'Qk1LMOSme750DT7KBKWXF0d8iTdlBhA8f97K1ANc5mjTPE9R',
          paymentAddress: [{"currency":"bitcoin","address":"mrLShymH2jnQ3kPCxDRz3iqvASA6FEoiJ8"}],
          duplicate: false
        }};
        stream.write(JSON.stringify(result) + String.fromCharCode(10));
      } else if (method === 'Bitmarks.Issue') {
        result = {id: data.id, ok: true, result: [
          {
            "txid":"Qk1LMG2BbDORR/3qaBMEOaWn4PF0WzsCRCVadynBEc8zM5aV",
            "paymentAddress":[{"currency":"bitcoin", "address":"mrLShymH2jnQ3kPCxDRz3iqvASA6FEoiJ8"}],
            "duplicate":false
          },
          {
            "txid":"Qk1LMBI5ozZ/ziv3IXWzf4EyLWhk62pQFgyL+fxqmrpmQJXw",
            "paymentAddress":[{"currency":"bitcoin", "address":"mghzcd8mVYnYQ4A4BQqjL8NoSq7pmkYjZK"}],
            "duplicate":false
          }
        ]};
        stream.write(JSON.stringify(result) + String.fromCharCode(10));
      } else if (method === 'Transaction.Pay') {
        result = {id: data.id, ok: true, result: {}};
        stream.write(JSON.stringify(result) + String.fromCharCode(10));
      } else if (method === 'Assets.Get') {
        result = {"assets":[{"txid":"Qk1LMOCj4idjqLu4rrKpf0p/33itNG1Np7dHx4+yDKNz1mxA","asset":"Qk1BMDvM9A1um1lsiknf3kPUWPu4TdfD/+TBNhpLx22f8+RKEBG7gztnGVKQEyF3B1cCOkcK/H8wm+JyrriA6ZPkGDg=","exists":true,"state":"Mined","type":"AssetData","transaction":{"description":"this is test-01","name":"test-01","fingerprint":"Fingerprint for test-01","registrant":"e8d6dguCHxWRqUkn9E6iRRRKUDtyoVqyXLuFmgXKFgYfN7yu71","signature":"8OhJ7hwYYBOyccpg97HTohgArOTDWb0CUf20kEz4DuM5mkqhFnKYDvANjtDMyxW6lujA/6y/1W7lcN7GetEfAw=="}}]};
        result = {id: data.id, ok: true, result: result};
        stream.write(JSON.stringify(result) + String.fromCharCode(10));
      } else if (method === 'Transaction.Get') {
        result = {"transactions":[{"txid":"Qk1LMG2BbDORR/3qaBMEOaWn4PF0WzsCRCVadynBEc8zM5aV","asset":null,"exists":true,"state":"Mined","type":"BitmarkIssue","transaction":{"asset":"Qk1BMDvM9A1um1lsiknf3kPUWPu4TdfD/+TBNhpLx22f8+RKEBG7gztnGVKQEyF3B1cCOkcK/H8wm+JyrriA6ZPkGDg=","owner":"e8d6dguCHxWRqUkn9E6iRRRKUDtyoVqyXLuFmgXKFgYfN7yu71","nonce":2,"signature":"MBKZdADSeV8lA0XhtC9ykITxlRw4xO0ywcxhV11XCiC8UjD3R4PBOx1fD0bLvX3J6Jdbt4OgdxVxjfjRHvUEBA=="}}]};
        result = {id: data.id, ok: true, result: result};
        stream.write(JSON.stringify(result) + String.fromCharCode(10));
      } else if (method === 'Bitmark.Transfer') {
        result = {"txid":"Qk1LMK60+Vt2NVK/gub49hZJvP96ctzRQFajg5rVhcaCgC7c","paymentAddress":[{"currency":"bitcoin","address":"mrLShymH2jnQ3kPCxDRz3iqvASA6FEoiJ8"}],"duplicate":true},{"txid":"Qk1LMK60+Vt2NVK/gub49hZJvP96ctzRQFajg5rVhcaCgC7c","paymentAddress":[{"currency":"bitcoin","address":"mrLShymH2jnQ3kPCxDRz3iqvASA6FEoiJ8"}],"duplicate":true};
        result = {id: data.id, ok: true, result: result};
        stream.write(JSON.stringify(result) + String.fromCharCode(10));
      }
    });
  });
  server.listen(port);
}

var emptyNetwork = {
  name: 'fakenet',
  address_value: 0x01,
  kif_value: 0x01,
  static_hostnames: [],
  static_nodes: [],
};

var fullNetwork = {
  name: 'fakenet',
  address_value: 0x01,
  kif_value: 0x01,
  static_hostnames: [],
  static_nodes: ['127.0.0.1:8001', '127.0.0.1:8002', '127.0.0.1:8003'],
};


describe('RPC Pool', function(){
  this.timeout(15000);
  // Initialize some server
  // Note: 8001 is dead node
  createRPCServer(8002);
  createRPCFailServer(8003);
  createRPCServer(8004);

  it('should return Pool instance when initiating without `new` keyword', function() {
    var pool = Pool([], emptyNetwork).start();
    expect(pool).to.be.instanceof(Pool);
    pool.stop();
  });

  it('should accept network name as a string', function() {
    var pool = Pool([], 'testnet');
    expect(pool._network).to.equal(networks.testnet);
  });

  it('should be able to connect to nodes provided', function(done){
    var nodes = [{id: '127.0.0.1:8002', ip: '127.0.0.1', port: '8002'}];
    var pool = new Pool(nodes, emptyNetwork).start();
    expect(pool.status).to.equal('unavailable');
    pool.on('available', function(status){
      expect(pool._connections['127.0.0.1:8002']).to.be.ok;
      pool.stop();
      done();
    });
  });

  it('should be unavailable at the begining', function(){
    var pool = new Pool(null, fullNetwork).start();
    expect(pool.status).to.equal('unavailable');
  });

  it('should not add dead node to the list of connections', function(done){
    var pool = new Pool(null, fullNetwork).start();
    pool.on('available', function(status){
      expect(pool._connections[fullNetwork.static_nodes[0]]).to.not.be.ok;
      pool.stop();
      done();
    });
  });

  it('should be able to connect to the static nodes provided by the network parameter', function(done){
    var pool = new Pool(null, fullNetwork).start();
    pool.on('available', function(status){
      expect(pool._connections[fullNetwork.static_nodes[1]]).to.be.ok;
      expect(pool._connections[fullNetwork.static_nodes[2]]).to.be.ok;
      pool.stop();
      done();
    });
  });

  it('should be able to add the nodes provided by Node.List method to the database', function(done){
    var pool = new Pool(null, fullNetwork).start();
    pool.on('database-changed', function(){
      var found = false;
      pool._database.forEach(function(node){
        if (node.id == '127.0.0.1:8003') found = true;
      });
      expect(found).to.be.ok;
      pool.stop();
      done();
    });
  });

  it('should allow to end the pool', function(done){
    var pool = new Pool(null, fullNetwork).start();
    var connections = [];
    pool.on('available', function(){
      for (var id in pool._connections) {
        connections.push(pool._connections[id]);
      }
      pool.on('stopped', function(status){
        setTimeout(function(){
          connections.forEach(function(conn){
            expect(conn.status).to.equal('ended');
          });
          expect(pool._poolTimer).to.not.be.ok;
          done();
        }, 1000);
      });
      pool.stop();
    });
  });

  var bitmarkKey = PrivateKey.fromKIF('cgHxd1aunHw6juxQhgYmTM75RRjPt1jX79mLb62fKvV2mmZVaW');
  var asset = new Asset()
  .setName('test-01')
  .setDescription('this is test-01')
  .setFingerprint('Fingerprint for test-01')
  .sign(bitmarkKey);

  it('should support asset registering', function(done){
    var pool = new Pool(null, fullNetwork).start();
    pool.on('database-changed', function(){
      pool.registerAsset(asset, function(error, result){
        expect(asset.getId()).to.equal('Qk1BMDvM9A1um1lsiknf3kPUWPu4TdfD/+TBNhpLx22f8+RKEBG7gztnGVKQEyF3B1cCOkcK/H8wm+JyrriA6ZPkGDg=');
        expect(asset.getTxId()).to.equal('Qk1LMOCj4idjqLu4rrKpf0p/33itNG1Np7dHx4+yDKNz1mxA');
        done();
      });
    });
  });

  it('should support issuing one bitmark', function(done) {
    var pool = new Pool(null, fullNetwork).start();
    var issue01 = new Issue().fromAsset(asset).setNonce(1).sign(bitmarkKey);
    pool.on('database-changed', function(){
      pool.issueBitmark(issue01, function(error, result){
        expect(issue01.getTxId()).to.equal('Qk1LMOSme750DT7KBKWXF0d8iTdlBhA8f97K1ANc5mjTPE9R');
        expect(issue01.getPaymentAddress()).to.equal('mrLShymH2jnQ3kPCxDRz3iqvASA6FEoiJ8');
        done();
      });
    });
  });

  it('should support issuing multiple bitmarks', function(done) {
    var pool = new Pool(null, fullNetwork).start();
    var issue02 = new Issue().fromAsset(asset).setNonce(2).sign(bitmarkKey);
    var issue03 = new Issue().fromAsset(asset).setNonce(3).sign(bitmarkKey);
    pool.on('database-changed', function(){
      pool.issueBitmarks([issue02, issue03], function(error, result){
        expect(issue02.getTxId()).to.equal('Qk1LMG2BbDORR/3qaBMEOaWn4PF0WzsCRCVadynBEc8zM5aV');
        expect(issue02.getPaymentAddress()).to.equal('mrLShymH2jnQ3kPCxDRz3iqvASA6FEoiJ8');
        expect(issue03.getTxId()).to.equal('Qk1LMBI5ozZ/ziv3IXWzf4EyLWhk62pQFgyL+fxqmrpmQJXw');
        expect(issue03.getPaymentAddress()).to.equal('mghzcd8mVYnYQ4A4BQqjL8NoSq7pmkYjZK');
        done();
      });
    });
  });

  it('should support making payment for transactions', function(done) {
    var pool = new Pool(null, fullNetwork).start();
    var payment = '01000000018cf831a8779dde93faf05445c531168dc72474a5f1954022b347764b9c9e5552000000006a473044022052e3ae19b6aa1d005652452928f68ff3b45aeb51c3b6e05c3e1f6e0c2596878d02204bf2bc2a9c2e5e8bfa2c64d7564d0cbcd2f5afe8e3ef946df808b8b2f0490679012102e3da414388b64d2ac7ecf2437b0568688b847d5f781ba82e77a08f4ad0c055dfffffffff03204e0000000000001976a91476ac868e54b05e0bb93d2b48c7f23dce4867f2cb88ac0000000000000000266a24424d4b30e4a67bbe740d3eca04a59717477c89376506103c7fdecad4035ce668d33c4f5110cd0e00000000001976a91456c189d1642217c3964399a6e744e3ca02051de088ac00000000';
    pool.on('database-changed', function(){
      pool.broadcastPayment('bitcoin', payment, function(error, result) {
        expect(result).to.be.ok;
        done();
      });
    });
  });

  it('should support transfering bitmarks', function(done) {
    var pool = new Pool(null, fullNetwork).start();
    var issue = new Issue().fromAsset(asset).setNonce(2).sign(bitmarkKey);
    issue._txId = 'Qk1LMG2BbDORR/3qaBMEOaWn4PF0WzsCRCVadynBEc8zM5aV';
    var bitmark = new Transfer().from(issue).to('f8hydzQaEuEuKgANWvzzRAvkPCGyVD2784LPL2SLu9YjohjvhC').sign(bitmarkKey);
    pool.on('database-changed', function(){
      pool.transferBitmark(bitmark, function(error, result) {
        expect(bitmark.getTxId()).to.equal('Qk1LMK60+Vt2NVK/gub49hZJvP96ctzRQFajg5rVhcaCgC7c');
        expect(bitmark.getPaymentAddress()).to.equal('mrLShymH2jnQ3kPCxDRz3iqvASA6FEoiJ8');
        done();
      });
    });
  });

  it('should support getting asset by fingerprint', function(done) {
    var pool = new Pool(null, fullNetwork).start();
    pool.on('database-changed', function(){
      pool.readAsset(['Fingerprint for test-01'], function(error, data) {
        expect(error).to.not.be.ok;
        done();
      });
    });
  });

  it('should support getting asset by fingerprint', function(done) {
    var pool = new Pool(null, fullNetwork).start();
    pool.on('database-changed', function(){
      pool.readTransaction(['Qk1LMG2BbDORR/3qaBMEOaWn4PF0WzsCRCVadynBEc8zM5aV'], function(error, data) {
        expect(error).to.not.be.ok;
        done();
      });
    });
  });

});
