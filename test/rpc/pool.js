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

// make it get more nodes faster
config.rpc.renewal_few = 2000;


function createRPCServer(port) {
  var server = tls.createServer(options, function(stream){
    stream.on('data', function(data){
      data = data.toString();
      data = JSON.parse(data);
      var method = data.method;
      if (method === 'Node.List') {
        stream.write(JSON.stringify({id: data.id, ok: true, result: {addresses: ['127.0.0.1:8004']}}) + String.fromCharCode(10));
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
  createRPCServer(8004);

  it('should always return Pool instance', function() {
    var pool = Pool([], emptyNetwork).start();
    expect(pool).to.be.instanceof(Pool);
    pool.stop();
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

});
