var chai = chai || require('chai');
var expect = chai.expect;
var lib = require('../../index.js');

var config = require(__baseBitmarkLibModulePath + 'lib/config.js');
var common = require(__baseBitmarkLibModulePath + 'lib/util/common.js');
var networks = require(__baseBitmarkLibModulePath + 'lib/networks.js');
var Pool = require(__baseBitmarkLibModulePath + 'lib/rpc/pool.js');

var tls = require('tls');
var fs = require('fs');
var options = {
  key: fs.readFileSync('./test/rpc/private-key.pem'),
  cert: fs.readFileSync('./test/rpc/public-cert.pem')
};

var createTestServer = function(port){
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
    });
  });
  server.listen(port || 7000);
};

var changeConfig = function(enoughAliveNode, enoughNodeRecord) {
  config.rpc.discover.enoughAliveNode = enoughAliveNode;
  config.rpc.discover.enoughNodeRecord = enoughNodeRecord;
};

var createLibTestNetwork = function() {
  networks.libtestnet = {
    name: 'libtestnet',
    address_value: networks.testnet.address_value,
    kif_value: networks.testnet.kif_value,
    static_hostnames: [],
    static_nodes: ['127.0.0.1:7000']
  };
};

createTestServer(7000);
createLibTestNetwork();
changeConfig(1, 1);

describe('Pool Node Keeping', function() {
  this.timeout(15000);
  it('Should remove the connection cache and set the right status for the record if the connection failed', function(done) {
    var pool = new Pool([], 'libtestnet');
    pool.start(function() {
      var node = pool.nodes[networks.libtestnet.static_nodes];
      var record = pool.database[0];
      expect(node).to.be.ok;
      node.stream.write('end');
      setTimeout(function() {
        expect(pool.nodes[networks.libtestnet.static_nodes]).to.be.not.ok;
        expect(record.alive).to.be.false;
        expect(record.lastSeen).to.be.ok;
        done();
      }, 200);
    });
  });
  it('Should remove the connection cache and set the right status for the record if the connection ended', function(done) {
    var pool = new Pool([], 'libtestnet');
    pool.start(function() {
      var node = pool.nodes[networks.libtestnet.static_nodes];
      var record = pool.database[0];
      expect(node).to.be.ok;
      node.end();
      setTimeout(function() {
        expect(pool.nodes[networks.libtestnet.static_nodes]).to.be.not.ok;
        expect(record.alive).to.be.true;
        expect(record.lastSeen).to.be.ok;
        done();
      }, 200);
    });
  });
});