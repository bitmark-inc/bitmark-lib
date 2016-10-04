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

var createNodeExpandingTestServer = function(port, getPeerResult){
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
  server.listen(port);
};

var createNodeExpandingTestServers = function() {
  var results = [];
  // Server node graph
  results[0] = {nodes: [2, 3]};
  results[1] = {nodes: [3, 4, 5]};
  results[2] = {nodes: [0, 6]};
  results[3] = {nodes: [0, 1, 7]};
  results[4] = {nodes: [1, 7]};
  results[5] = null;
  results[6] = {nodes: [2]};
  results[7] = {nodes: [3, 4, 5, 8]};
  results[8] = {nodes: []};

  // standardize the results for Node.List and create the server
  results.forEach(function(result, index) {
    if (result) {
      result.nodes.forEach(function(item, index) {
        result.nodes[index] = {connections: ['127.0.0.1:400' + item]};
      });
      createNodeExpandingTestServer(4000 + index, result);
    }
  });
};

var createLibTestNetwork = function() {
  networks.node_expanding_testnet = {
    name: 'node_expanding_testnet',
    address_value: networks.testnet.address_value,
    kif_value: networks.testnet.kif_value,
    static_hostnames: [],
    static_nodes: ['127.0.0.1:4000']
  };
};

var changeConfig = function(enoughAliveNode, enoughNodeRecord) {
  config.rpc.discover.enoughAliveNode = enoughAliveNode;
  config.rpc.discover.enoughNodeRecord = enoughNodeRecord;
};

createNodeExpandingTestServers();
createLibTestNetwork();

describe('Pool Expanding', function(){
  this.timeout(15000);
  it('should be able to reach more than 1 levels to get more nodes', function(done) {
    var pool = new Pool([{id: '127.0.0.1:4001', ip: '127.0.0.1', port: '4001'}], 'node_expanding_testnet');
    changeConfig(8, 9);
    pool.start(function() {
      expect(pool.nodes).to.have.all.keys(
        '127.0.0.1:4000',
        '127.0.0.1:4001',
        '127.0.0.1:4002',
        '127.0.0.1:4003',
        '127.0.0.1:4004',
        '127.0.0.1:4006',
        '127.0.0.1:4007',
        '127.0.0.1:4008'
      );

      var dbIds = {};
      pool.database.forEach(function(record) {
        dbIds[record.id] = true;
      });
      expect(dbIds).to.have.all.keys(
        '127.0.0.1:4000',
        '127.0.0.1:4001',
        '127.0.0.1:4002',
        '127.0.0.1:4003',
        '127.0.0.1:4004',
        '127.0.0.1:4005',
        '127.0.0.1:4006',
        '127.0.0.1:4007',
        '127.0.0.1:4008'
      );
      done();
    });
  });

  it('should reach only several levels until enough', function(done) {
    var pool = new Pool([{id: '127.0.0.1:4001', ip: '127.0.0.1', port: '4001'}], 'node_expanding_testnet');
    changeConfig(1, 2);
    pool.start(function() {
      var dbIds = {};
      pool.database.forEach(function(record) {
        dbIds[record.id] = true;
      });
      expect(dbIds).to.not.include.keys('127.0.0.1:4008');
      done();
    });
  });
});