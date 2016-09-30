var chai = chai || require('chai');
var expect = chai.expect;
var lib = require('../../index.js');

var RPCConnection = require(__baseBitmarkLibModulePath + 'lib/rpc/connection.js');
var config = require(__baseBitmarkLibModulePath + 'lib/config.js');
var common = require(__baseBitmarkLibModulePath + 'lib/util/common.js');
var errorList = require(__baseBitmarkLibModulePath + 'lib/error');

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

var createServer = function(port){
  var mergeResult = '';
  var server = tls.createServer(options, function(stream){
    stream.on('data', function(data){
      var method, result, tmp;

      data = data.toString();
      if (data === 'ended'){ // To test ended signal
        stream.end();
        return;
      }

      data = JSON.parse(data);
      method = data.method;
      if (method === 'singleMethodSuccess'){ // To test calling method success
        result = {id: data.id, ok: true, result: 'success'};
        result = JSON.stringify(result) + String.fromCharCode(10);
        stream.write(result);
        return;
      }

      if (method === 'singleMethodFail'){ // To test calling method fail
        result = {id: data.id, ok: false, error: 'fail'};
        result = JSON.stringify(result) + String.fromCharCode(10);
        stream.write(result);
        return;
      }

      if (method === 'mergeMethod01') { // To test merge method
        mergeResult = {id: data.id, ok: true, result: 'merge01'};
        mergeResult = JSON.stringify(mergeResult) + String.fromCharCode(10);
      }
      if (method === 'mergeMethod02') { // to test merge method
        tmp = {id: data.id, ok: true, result: 'merge02'};
        tmp = JSON.stringify(tmp) + String.fromCharCode(10);
        mergeResult += tmp;
        mergeResult = breakString(mergeResult, 6);
        mergeResult.forEach(function(part){
          stream.write(part); // send the result of 2 methods in chunks
        });
      }

      if (method === 'responseTimeout') { // to test the timeout for a method call
        return;
      }
    });
  });
  server.listen(port || 7000);
};


describe('RPC-Connection', function(){
  this.timeout(15000);
  it('should return RPC Connection instance when initiating without `new` keyword', function(){
    var conn = RPCConnection({ip: '127.0.0.2', port: 7000});
    expect(conn).to.be.instanceof(RPCConnection);
  });
  it('should throw error on no `options` passed in', function(){
    expect(function(){
      return new RPCConnection();
    }).to.throw(Error);
  });
  it('should throw error on missing ip', function(){
    expect(function(){
      return new RPCConnection({port: '3566'});
    }).to.throw(Error);
  });
  it('should throw error on missing port', function(){
    expect(function(){
      return new RPCConnection({ip: '118.163.120.178'});
    }).to.throw(Error);
  });
  it('should emit failed event on long handshake period', function(done){
    var conn = new RPCConnection({ip: '192.0.2.0', port: 7000});
    expect(conn.status).to.equal('connecting');
    conn.once('failed', function(error){
      expect(error.message).to.equal(errorList.rpc.TIMEOUT);
      expect(conn.status).to.equal('failed');
      done();
    });
  });

  createServer();
  it('should close the connection if no activities happen for a while', function(done){
    var conn = new RPCConnection({ip: '127.0.0.1', port: 7000, keepLivingTimeout: 2000});
    var successEventEmitted = false;
    expect(conn.status).to.equal('connecting');
    conn.once('connected', function(){
      successEventEmitted = true;
      expect(conn.status).to.equal('connected');
      setTimeout(function(){
        expect(conn.status).to.equal('ended');
        done();
      }, 2200);
    });
  });

  it('should emit "failed" event if the server ends the connection', function(done){
    var conn = new RPCConnection({ip: '127.0.0.1', port: 7000});
    var successEventEmitted = false;
    expect(conn.status).to.equal('connecting');
    conn.once('connected', function(){
      successEventEmitted = true;
      expect(conn.status).to.equal('connected');
    });
    conn.stream.write('ended');
    conn.once('failed', function(){
      expect(successEventEmitted).to.equal(true);
      expect(conn.status).to.equal('failed');
      done();
    });
  });

  it('should be able to tell if the method is successfully called', function(done){
    var conn = new RPCConnection({ip: '127.0.0.1', port: 7000});
    var successEventEmitted = false;
    conn.once('connected', function(){
      conn.callMethod('singleMethodSuccess', [], function(error) {
        expect(error).to.not.be.ok;
        done();
      });
    });
  });
  it('should be able to tell if the method called is failed', function(done){
    var conn = new RPCConnection({ip: '127.0.0.1', port: 7000});
    var successEventEmitted = false;
    conn.once('connected', function(){
      conn.callMethod('singleMethodFail', [], function(error) {
        expect(error).to.be.ok;
        done();
      });
    });
  });
  it('should be able to parse the data in chunks', function(done){
    var conn = new RPCConnection({ip: '127.0.0.1', port: 7000});
    var successEventEmitted = false;
    var self = this;
    conn.once('connected', function(){
      var method01 = false;
      conn.callMethod('mergeMethod01', [], function(error) {
        method01 = !error;
      });

      setTimeout(function(){
        conn.callMethod('mergeMethod02', [], function(error) {
          expect(method01).to.equal(true);
          expect(error).to.not.be.ok;
          done();
        });
      }, 200);
    });
  });

  it('should be able to set timeout on method calls', function(done){
    var conn = new RPCConnection({ip: '127.0.0.1', port: 7000});
    var successEventEmitted = false;
    var self = this;
    conn.once('connected', function(){
      conn.callMethod('responseTimeout', [], function(error) {
        expect(error).to.be.ok;
        done();
      }, 1000);
    });
  });

  it('should allow to end the connection', function(done) {
    var conn = new RPCConnection({ip: '127.0.0.1', port: 7000});
    var successEventEmitted = false;
    var self = this;
    conn.once('connected', function(){
      conn.end();
      setTimeout(function(){
        expect(conn.status).to.equal('ended');
        done();
      }, 200);
    });
  });

});









