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

var breakString = function(string, count) {
  var result = [];
  while (string) {
    result.push(string.substr(0, count));
    string = string.substr(count);
  }
  return result;
};

var createServer = function(port, getPeerResult){
  var server = tls.createServer(options, function(stream){
    stream.on('data', function(data){
      var method, tmp;

      data = data.toString();
      if (data === 'ended'){ // To test ended signal
        stream.end();
        return;
      }

      data = JSON.parse(data);
      method = data.method;
      if (method === 'Node.List') {
        tmp = {id: data.id, ok: true, result: getPeerResult};
        stream.write(JSON.stringify(tmp) + String.fromCharCode(10));
        return;
      }
      if (method === 'responseTimeout') { // to test the timeout for a method call
        return;
      }
    });
  });
  server.listen(port || 8000);
};

var createTestServers = function() {
  var results = [];
  // Server node graph
  results[0] = {addresses: [2, 3]};
  results[1] = {addresses: [3, 4, 5]};
  results[2] = {addresses: [0, 6]};
  results[3] = {addresses: [0, 1, 7]};
  results[4] = {addresses: [1, 7]};
  results[5] = null;
  results[6] = {addresses: [2]};
  results[7] = {addresses: [3, 4, 5, 8]};
  results[8] = {addresses: []};

  // standardize the results for Node.List and create the server
  results.forEach(function(result, index) {
    if (result) {
      result.addresses.forEach(function(item, index) {
        result.addresses[index] = '127.0.0.1:700' + item;
      });
      createServer(7000 + index, result);
    }
  });
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

var changeConfig = function(enoughAliveNode, enoughNodeRecord) {
  config.rpc.discover.enoughAliveNode = enoughAliveNode;
  config.rpc.discover.enoughNodeRecord = enoughNodeRecord;
};

createTestServers();
createLibTestNetwork();

describe('Pool Expanding', function(){
  this.timeout(15000);
  it('should be able to reach more than 1 levels to get more nodes', function(done) {
    var pool = new Pool([{id: '127.0.0.1:7001', ip: '127.0.0.1', port: '7001'}], 'libtestnet');
    changeConfig(8, 9);
    pool.start(function() {
      expect(pool.nodes).to.have.all.keys(
        '127.0.0.1:7000',
        '127.0.0.1:7001',
        '127.0.0.1:7002',
        '127.0.0.1:7003',
        '127.0.0.1:7004',
        '127.0.0.1:7006',
        '127.0.0.1:7007',
        '127.0.0.1:7008'
      );

      var dbIds = {};
      pool.database.forEach(function(record) {
        dbIds[record.id] = true;
      });
      expect(dbIds).to.have.all.keys(
        '127.0.0.1:7000',
        '127.0.0.1:7001',
        '127.0.0.1:7002',
        '127.0.0.1:7003',
        '127.0.0.1:7004',
        '127.0.0.1:7005',
        '127.0.0.1:7006',
        '127.0.0.1:7007',
        '127.0.0.1:7008'
      );
      done();
    });
  });

  it('should reach only several levels until enough', function(done) {
    var pool = new Pool([{id: '127.0.0.1:7001', ip: '127.0.0.1', port: '7001'}], 'libtestnet');
    changeConfig(1, 2);
    pool.start(function() {
      var dbIds = {};
      pool.database.forEach(function(record) {
        dbIds[record.id] = true;
      });
      expect(dbIds).to.not.include.keys('127.0.0.1:7008');
      done();
    });
  });
});