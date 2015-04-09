var common = require('./util/common.js');
var varint = require('./util/varint.js');
var base58 = require('./util/base58.js');
var assert = require('./util/assert.js');
var _ = require('lodash');

var networks = require('./networks.js');
var config = require('./config.js');

var BigInt = require('bigi');
var keyHandlers = require('./key-types/key-handlers.js');
var Address = require('./address.js');

function PrivateKeyInfo(values){
  this.getValues = function(){ return values; };
}

function _verifyNetwork(network) {
  network = network || networks.livenet;
  if (_.isString(network)) {
    network = networks[network];
    assert(network, new TypeError('Private key error: can not recognize network'));
  }
  assert(_.isFinite(network.kif_value), new TypeError('Private key error: missing KIF information in network parameter'));
  return network;
}

function _verifyType(type) {
  type = type || config.key.type.ed25519;
  if (_.isString(type)) {
    type = config.key.type[type.toLowerCase()];
  }
  assert(type.name && config.key.type[type.name], new TypeError('Private key error: can not recognize type'));
  return type;
}

function parseKIFString(kifString) {
  var kifBuffer = base58.decode(kifString);

  var keyVariant = varint.decode(kifBuffer);
  var keyVariantBufferLength = keyVariant.toBuffer().length;
  keyVariantBufferLength = keyVariantBufferLength || 1;

  // check for whether this is a kif
  var keyPartVal = new BigInt(config.key.part.private_key.toString());
  assert(keyVariant.and(new BigInt('1')).equals(keyPartVal), 'Private key error: can not parse the kif string');
  // detect network
  var networkVal = keyVariant.shiftRight(1).and(new BigInt((0x01).toString())).intValue();
  var network = networkVal === networks.livenet.address_value ? networks.livenet : networks.testnet;
  // key type
  var keyTypeVal = keyVariant.shiftRight(4).and(new BigInt((0x07).toString())).intValue();
  var keyType = common.getKeyTypeByValue(keyTypeVal);
  assert(keyType, 'Private key error: unknow key type');

  // check the length of kif
  var kifLength = keyVariantBufferLength + keyType.seed_length + config.key.checksum_length;
  assert(kifLength === kifBuffer.length, 'Private key error: KIF for ' + keyType.name + ' must be ' + kifLength + ' bytes');

  // get private key
  var seed = kifBuffer.slice(keyVariantBufferLength, kifLength - config.key.checksum_length);

  // check checksum
  var checksum = common.doubleSHA256(kifBuffer.slice(0 ,kifLength - config.key.checksum_length));
  checksum = checksum.slice(0, config.key.checksum_length);
  assert(common.bufferEqual(checksum, kifBuffer.slice(kifLength-config.key.checksum_length, kifLength)),
    'Private key error: checksum mismatch');

  // get address
  var keyTypeHandler = keyHandlers.getHandler(keyType.name);
  var keyPair = keyTypeHandler.generateKeyPairFromSeed(seed);

  return new PrivateKeyInfo({
    _address: new Address(keyPair.pubKey, network, keyType),
    _priKey: keyPair.priKey,
    _type: keyType.name,
    _network: network.name,
    _kif: kifString
  });
}

function buildPrivateKey(keyPair, network, type) {
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
      throw new TypeError('Private key error: can not recognize buffer format. It must be either a seed/private key buffer');
    }
  } else {
    seed = keyTypeHanlder.getSeedFromPriKey(keyPair.priKey);
  }

  var keyVariantVal, keyVariantBuffer;
  var keyPartVal, networkVal, keyTypeVal;
  var checksum, kifBuffer, kif;

  keyPartVal = new BigInt(config.key.part.private_key.toString());
  networkVal = new BigInt(network.kif_value.toString());
  keyTypeVal = new BigInt(type.value.toString());

  keyVariantVal = keyTypeVal.shiftLeft(3).or(networkVal);
  keyVariantVal = keyVariantVal.shiftLeft(1).or(keyPartVal);
  keyVariantBuffer = varint.encode(keyVariantVal);
  // correct keyVariantBuffer, toBuffer of bigi return no bytes if the value is 0
  keyVariantBuffer = keyVariantBuffer.length ? keyVariantBuffer : new Buffer([0]);

  checksum = common.doubleSHA256(Buffer.concat([keyVariantBuffer, seed], keyVariantBuffer.length+ seed.length));
  checksum = checksum.slice(0, config.key.checksum_length);
  kifBuffer = Buffer.concat([keyVariantBuffer, seed, checksum], keyVariantBuffer.length + seed.length + checksum.length);
  kif = base58.encode(kifBuffer);
  return new PrivateKeyInfo({
    _address: new Address(keyPair.pubKey, network, type),
    _priKey: keyPair.priKey,
    _type: type.name,
    _network: network.name,
    _kif: kif
  });
}

function newPrivateKey(network, type) {
  var keyTypeHanlder = keyHandlers.getHandler(type.name);
  var keyPair = keyTypeHanlder.generateKeyPair();
  return buildPrivateKey(keyPair, network, type);
}

function PrivateKey(network, type) {
  if (!(this instanceof PrivateKey)) {
    return new PrivateKey(network, type);
  }

  // detect if this is the call from another constructor
  if (network instanceof PrivateKeyInfo) {
    common.addImmutableProperties(this, network.getValues());
    return;
  }

  // If this is not a call from another constructor, create new private key
  network = _verifyNetwork(network);
  type = _verifyType(type);

  var data = newPrivateKey(network, type);
  common.addImmutableProperties(this, data.getValues());
}

PrivateKey.fromKIF = function(kifString) {
  assert(_.isString(kifString), new TypeError('Private key error: Expect ' + kifString + ' to be a string'));
  return new PrivateKey(parseKIFString(kifString));
};

PrivateKey.fromBuffer = function(data, network, type) {
  // verify data
  assert(data, new TypeError('Private key buffer is required'));
  if (_.isString(data) && /^([0-9a-f]{2})+$/.test(data.toLowerCase())) {
    data = new Buffer(data.toLowerCase(), 'hex');
  }
  assert(Buffer.isBuffer(data), new TypeError('Private key error: can not recognize buffer input format'));

  network = _verifyNetwork(network);
  type = _verifyType(type);

  return new PrivateKey(buildPrivateKey(data, network, type));
};

PrivateKey.prototype.toBuffer = function(){ return this._priKey; };

PrivateKey.prototype.toString = function(){ return this._priKey.toString('hex'); };

PrivateKey.prototype.toKIF = function(){ return this._kif; };

PrivateKey.prototype.getNetwork = function(){ return this._network; };

PrivateKey.prototype.getType = function(){ return this._type; };

PrivateKey.prototype.getAddress = function(){ return this._address; };

module.exports = PrivateKey;