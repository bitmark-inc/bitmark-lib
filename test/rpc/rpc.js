// var chai = chai || require('chai');
// var expect = chai.expect;
// var libDir = '../../lib/';
// var Address = require(libDir + 'address.js');
// var config = require(libDir + 'config.js');
// var common = require(libDir + 'util/common.js');
// var rpc = require(libDir + 'rpc/rpc.js');
// var Q = require('q');

// var Asset = require(libDir + 'records/asset.js');
// var Issue = require(libDir + 'records/issue.js');
// var Transfer = require(libDir + 'records/transfer.js');
// var PrivateKey = require(libDir + 'private-key.js');


// describe('RPC', function(){
//   this.timeout(15000);
//   var deferred = Q.defer();
//   var promise = deferred.promise;
//   var pkAsset, pkIssue, pkTf1, pkTf2;
//   var asset, issue01, issue02, transfer01;
//   var network = 'testnet';

//   pkAsset = new PrivateKey(network);
//   pkIssue = new PrivateKey(network);
//   pkTf1 = new PrivateKey(network);
//   pkTf2 = new PrivateKey(network);

//   rpc.init([], network, function(){
//     deferred.resolve();
//   });

//   it('Should be able to register asset', function(done){
//     promise.then(function(){
//       var deferred = Q.defer();
//       asset = new Asset()
//         .setName('something')
//         .setDescription('something\'s description')
//         .setFingerprint(common.generateRandomBytes(100).toString('hex'))
//         .sign(pkAsset);
//       rpc.registerAsset(asset, function(error){
//         expect(error).to.not.exist;
//         done();
//         deferred.resolve();
//       });
//       return deferred.promise;
//     });
//   });

//   it('Should be able to issue multiple bitmarks from an asset', function(done) {
//     promise.then(function(){
//       var deferred = Q.defer();
//       issue01 = new Issue()
//         .fromAsset(asset)
//         .setNonce(1)
//         .sign(pkIssue);
//       issue02 = new Issue()
//         .fromAsset(asset)
//         .setNonce(2)
//         .sign(pkIssue);

//       rpc.issueBitmarks([issue01, issue02], function(error){
//         expect(error).to.not.exist;
//         expect(issue01.getPaymentAddress()).to.exist;
//         expect(issue02.getPaymentAddress()).to.exist;
//         done();
//         deferred.resolve();
//       });
//       return deferred.promise;
//     });
//   });

//   // it('Should be able to transfer bitmark', function(done) {
//   //   promise.then(function(){
//   //     var deferred = Q.defer();
//   //     transfer01 = new Transfer()
//   //       .from(issue01)
//   //       .to(pkTf1.getAddress().toString())
//   //       .sign(pkIssue);
//   //     rpc.transferBitmark(transfer01, function(error){
//   //       expect(error).to.not.exist;
//   //       expect(transfer01.getPaymentAddress()).to.exist;
//   //       done();
//   //       deferred.resolve();
//   //     });
//   //     return deferred.promise;
//   //   });
//   // });

// });