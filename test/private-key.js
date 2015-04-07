var chai = chai || require('chai');
var expect = chai.expect;
var config = require('../lib/config.js');
var common = require('../lib/util/common.js');

/**
 * ****  CREATING PRIVATE KEY
 * new PrivateKey(network, keyType);
 * new PrivateKey(kifString);
 * PrivateKey.fromBuffer(buffer, network, key type)
 * PrivateKey.fromKIF(kifString);
 *
 * **** VALIDATE ADDRESS
 * PrivateKey.isValid(addressString, network)
 *
 * **** GET INFO
 * PrivateKey.toString() - return raw hex
 * PrivateKey.toKIF(network)
 * PrivateKey.getNetwork()
 * PrivateKey.getKeyType()
 * PrivateKey.getAddress()
 */

describe('Private Key', function(){});