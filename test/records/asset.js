var chai = chai || require('chai');
var expect = chai.expect;
var libDir = '../../lib/';
var config = require(libDir + 'config.js');
var common = require(libDir + 'util/common.js');

/**
 * ****  CREATING ASSET
 * new Asset()
 *   .setName(name)
 *   .setDescription(description)
 *   .setFingerprint(fingerprint)
 *   .sign(privateKey);
 *
 * **** Util
 * asset.getRPCMessage()
 * asset.toJSON()
 */

describe('Asset', function(){});