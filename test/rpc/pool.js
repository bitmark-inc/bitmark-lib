var chai = chai || require('chai');
var expect = chai.expect;

var libDir = '../../lib/';
var Pool = require(libDir + 'rpc/pool.js');
var config = require(libDir + 'config.js');
var common = require(libDir + 'util/common.js');


var tls = require('tls');
var fs = require('fs');
var options = {
  key: fs.readFileSync('./test/rpc/private-key.pem'),
  cert: fs.readFileSync('./test/rpc/public-cert.pem')
};


function createRPCServer(port) {
  var server = tls.createServer(options, function(stream){
    stream.on('data', function(){
      data = JSON.parse(data);
      var method = data.method;
      if (method === 'Node.List') {
        return [];
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
  createRPCServer(8003);

  it('should always return Pool instance', function() {
    var pool = Pool([], emptyNetwork);
    expect(pool).to.be.instanceof(Pool);
  });


  it('should be able to connect to nodes provided', function(done){
    var nodes = [{id: '127.0.0.1:8002', ip: '127.0.0.1', port: '8002'}];
    var pool = new Pool(nodes, emptyNetwork);
    expect(pool.status).to.equal('unavailable');
    pool.on('status:changed', function(status){
      if (status === 'available') {
        expect(pool._connections['127.0.0.1:8002']).to.be.ok;
        done();
      }
    });
  });

  it('should be unavailable at the begining', function(){
    var pool = new Pool(null, fullNetwork);
    expect(pool.status).to.equal('unavailable');
  });
  it('should not add dead node to list of connections', function(){
    pool.on('status:changed', function(status){
      if (status === 'available') {
        expect(pool._connections[fullNetwork.static_nodes[0]]).to.not.be.ok;
        done();
      }
    });
  });
  it('should be able to connect to static nodes provided by the network parameter', function(done){
    pool.on('status:changed', function(status){
      if (status === 'available') {
        expect(pool._connections[fullNetwork.static_nodes[1]]).to.be.ok;
        expect(pool._connections[fullNetwork.static_nodes[2]]).to.be.ok;
        done();
      }
    });
  });
});
