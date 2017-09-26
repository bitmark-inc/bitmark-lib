var common = require('./util/common.js');
var varint = require('./util/varint.js');
var base58 = require('./util/base58.js');
var assert = require('./util/assert.js');
var _ = require('lodash');

var networks = require('./networks.js');
var config = require('./config.js');

var BigInteger = require('bn.js');
var keyHandlers = require('./key-types/key-handlers.js');
var AccountNumber = require('./account-number.js');
var Seed = require('./seed.js');

function AuthKeyInfo(values) {
  this.getValues = function() { return values; };
}

function _verifyNetwork(network) {
  network = network || networks.livenet;
  if (_.isString(network)) {
    network = networks[network];
    assert(network, new TypeError('Auth key error: can not recognize network'));
  }
  assert(_.isFinite(network.kif_value), new TypeError('Auth key error: missing KIF information in network parameter'));
  return network;
}

function _verifyType(type) {
  type = type || config.key.type.ed25519;
  if (_.isString(type)) {
    type = config.key.type[type.toLowerCase()];
  }
  assert(type.name && config.key.type[type.name], new TypeError('Auth key error: can not recognize type'));
  return type;
}

function parseKIFString(kifString) {
  var kifBuffer = base58.decode(kifString);

  var keyVariant = varint.decode(kifBuffer);
  var keyVariantBufferLength = keyVariant.toBuffer().length;
  keyVariantBufferLength = keyVariantBufferLength || 1;

  // check for whether this is a kif
  var keyPartVal = new BigInteger(config.key.part.auth_key);
  assert(keyVariant.and(new BigInteger(1)).eq(keyPartVal), 'Auth key error: can not parse the kif string');
  // detect network
  var networkVal = keyVariant.shrn(1).and(new BigInteger(0x01)).toNumber();
  var network = networkVal === networks.livenet.account_number_value ? networks.livenet : networks.testnet;
  // key type
  var keyTypeVal = keyVariant.shrn(4).and(new BigInteger(0x07)).toNumber();
  var keyType = common.getKeyTypeByValue(keyTypeVal);
  assert(keyType, 'Auth key error: unknow key type');

  // check the length of kif
  var kifLength = keyVariantBufferLength + keyType.seed_length + config.key.checksum_length;
  assert(kifLength === kifBuffer.length, 'Auth key error: KIF for ' + keyType.name + ' must be ' + kifLength + ' bytes');

  // get private key
  var seed = kifBuffer.slice(keyVariantBufferLength, kifLength - config.key.checksum_length);

  // check checksum
  var checksum = common.sha3_256(kifBuffer.slice(0 ,kifLength - config.key.checksum_length));
  checksum = checksum.slice(0, config.key.checksum_length);
  assert(common.bufferEqual(checksum, kifBuffer.slice(kifLength-config.key.checksum_length, kifLength)),
    'Auth key error: checksum mismatch');

  // get account number
  var keyTypeHandler = keyHandlers.getHandler(keyType.name);
  var keyPair = keyTypeHandler.generateKeyPairFromSeed(seed);

  return new AuthKeyInfo({
    _accountNumber: new AccountNumber(keyPair.pubKey, network, keyType),
    _priKey: keyPair.priKey,
    _type: keyType.name,
    _network: network.name,
    _kif: kifString
  });
}


function buildAuthKey(keyPair, network, type) {
  var keyTypeHanlder = keyHandlers.getHandler(type.name);
  var seed;
  if (Buffer.isBuffer(keyPair)) { // keyPair is private key/seed only
    if (keyPair.length === type.prikey_length) {
      keyPair = keyTypeHanlder.generateKeyPairFromPriKey(keyPair); // keyPair from private key
      seed = keyTypeHanlder.getSeedFromPriKey(keyPair.priKey);
    } else if (keyPair.length === type.seed_length) { // keyPair is actually seed
      seed = keyPair;
      keyPair = keyTypeHanlder.generateKeyPairFromSeed(seed); // keyPair from seed
    } else {
      throw new TypeError('Auth key error: can not recognize buffer format. It must be either a seed/private key buffer');
    }
  } else {
    seed = keyTypeHanlder.getSeedFromPriKey(keyPair.priKey);
  }

  var keyVariantVal, keyVariantBuffer;
  var keyPartVal, networkVal, keyTypeVal;
  var checksum, kifBuffer, kif;

  keyPartVal = new BigInteger(config.key.part.auth_key);
  networkVal = new BigInteger(network.kif_value);
  keyTypeVal = new BigInteger(type.value);

  keyVariantVal = keyTypeVal.shln(3).or(networkVal);
  keyVariantVal.ishln(1).ior(keyPartVal);
  keyVariantBuffer = varint.encode(keyVariantVal);

  checksum = common.sha3_256(Buffer.concat([keyVariantBuffer, seed], keyVariantBuffer.length+ seed.length));
  checksum = checksum.slice(0, config.key.checksum_length);
  kifBuffer = Buffer.concat([keyVariantBuffer, seed, checksum], keyVariantBuffer.length + seed.length + checksum.length);
  kif = base58.encode(kifBuffer);
  return new AuthKeyInfo({
    _accountNumber: new AccountNumber(keyPair.pubKey, network, type),
    _priKey: keyPair.priKey,
    _type: type.name,
    _network: network.name,
    _kif: kif
  });
}

function newAuthKey(network, type) {
  var keyTypeHanlder = keyHandlers.getHandler(type.name);
  var keyPair = keyTypeHanlder.generateKeyPair();
  return buildAuthKey(keyPair, network, type);
}

function AuthKey(network, type) {
  if (!(this instanceof AuthKey)) {
    return new AuthKey(network, type);
  }

  // detect if this is the call from another constructor
  if (network instanceof AuthKeyInfo) {
    common.addImmutableProperties(this, network.getValues());
    return;
  }

  // If this is not a call from another constructor, create new private key
  network = _verifyNetwork(network);
  type = _verifyType(type);

  var data = newAuthKey(network, type);
  common.addImmutableProperties(this, data.getValues());
}

AuthKey.fromKIF = function(kifString) {
  assert(_.isString(kifString), new TypeError('Auth key error: Expect ' + kifString + ' to be a string'));
  return new AuthKey(parseKIFString(kifString));
};

AuthKey.fromBuffer = function(data, network, type) {
  // verify data
  assert(data, new TypeError('Auth key buffer is required'));
  if (_.isString(data) && /^([0-9a-f]{2})+$/.test(data.toLowerCase())) {
    data = new Buffer(data.toLowerCase(), 'hex');
  }
  assert(Buffer.isBuffer(data), new TypeError('Auth key error: can not recognize buffer input format'));

  network = _verifyNetwork(network);
  type = _verifyType(type);

  return new AuthKey(buildAuthKey(data, network, type));
};

AuthKey.fromSeed = function(seed) {
  assert(seed instanceof Seed, new TypeError('Auth key error: ' + seed + ' not an instance of Seed'));
  var key = seed.generateKey(config.key.auth_key_index);
  var network = _verifyNetwork(seed.getNetwork());
  var type = _verifyType();
  return new AuthKey(buildAuthKey(key, network, type));
}

AuthKey.prototype.toBuffer = function(){ return this._priKey; };

AuthKey.prototype.toString = function(){ return this._priKey.toString('hex'); };

AuthKey.prototype.toKIF = function(){ return this._kif; };

AuthKey.prototype.getNetwork = function(){ return this._network; };

AuthKey.prototype.getType = function(){ return this._type; };

AuthKey.prototype.getAccountNumber = function(){ return this._accountNumber; };

module.exports = AuthKey;
