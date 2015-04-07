var chai = chai || require('chai');
var expect = chai.expect;
var libDir = '../../lib/';
var config = require(libDir + 'config.js');
var common = require(libDir + 'util/common.js');

/**
 * ****  CREATING ISSUE
 * new Issue()
 *   .fromAsset(asset/idstring)
 *   .setNonce(nonce)
 *   .sign(key)
 *
 * **** Util
 * asset.getRPCMessage()
 * asset.toJSON()
 */

describe('Issue', function(){});