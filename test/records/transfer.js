var chai = chai || require('chai');
var expect = chai.expect;
var libDir = '../../lib/';
var config = require(libDir + 'config.js');
var common = require(libDir + 'util/common.js');

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

describe('Transfer', function(){});