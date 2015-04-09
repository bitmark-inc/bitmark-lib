var common = require('./util/common.js');
var varint = require('./util/varint.js');
var base58 = require('./util/base58.js');
var assert = require('./util/assert.js');
var _ = require('lodash');

var networks = require('./networks.js');
var config = require('./config.js');

var BigInt = require('bigi');

// dummy internal object
function AddressInfo(values){
  this.getValues = function(){ return values; };
}

function parseAddressString(addressString) {
  var addressBuffer = base58.decode(addressString);

  var keyVariant = varint.decode(addressBuffer);
  var keyVariantBuffer = keyVariant.toBuffer(); // key variant is reversed because bigi implementing big endian format
  // correct keyVariantBuffer, toBuffer of bigi return no bytes if the value is 0
  keyVariantBuffer = keyVariantBuffer.length ? keyVariantBuffer : new Buffer([0]);

  // check for whether this is an address
  var keyPartVal = new BigInt(config.key.part.public_key.toString());
  assert(keyVariant.and(new BigInt('1')).equals(keyPartVal), 'Address error: this is not an address');
  // detect network
  var networkVal = keyVariant.shiftRight(1).and(new BigInt((0x01).toString())).intValue();
  var network = networkVal === networks.livenet.address_value ? networks.livenet : networks.testnet;
  // key type
  var keyTypeVal = keyVariant.shiftRight(4).and(new BigInt((0x07).toString())).intValue();
  var keyType = common.getKeyTypeByValue(keyTypeVal);
  assert(keyType, 'Address error: unknow key type');
  // check the length of the address
  var addressLength = keyVariantBuffer.length + keyType.pubkey_length + config.key.checksum_length;
  assert(addressLength === addressBuffer.length,
    'Address error: key type ' + keyType.name.toUpperCase() + ' must be ' + addressLength + ' bytes');

  // get public key
  var pubKey = addressBuffer.slice(keyVariantBuffer.length, addressLength - config.key.checksum_length);

  // check checksum
  var checksum = common.doubleSHA256(addressBuffer.slice(0, keyVariantBuffer.length + keyType.pubkey_length));
  checksum = checksum.slice(0, config.key.checksum_length);
  assert(common.bufferEqual(checksum, addressBuffer.slice(addressLength-config.key.checksum_length, addressLength)),
    'Address error: checksum mismatchs');

  return new AddressInfo({
    _prefix: keyVariantBuffer,
    _pubKey: pubKey,
    _network: network.name,
    _keyType: keyType.name,
    _string: addressString,
  });
}

/**
 * build address info from public key, network and type
 * @param  {buffer}
 * @param  {network}
 * @param  {keyType}
 * @return {info object}
 */
function buildAddress(pubKey, network, keyType) {
  var keyTypeVal, keyVariantVal;
  var keyVariantBuffer, checksumBuffer;
  var addressBuffer, base58Address;

  assert(pubKey.length === keyType.pubkey_length,
    'Address error: public key for key type ' + keyType.name + ' must be ' + keyType.pubkey_length + ' bytes');

  // TODO: process the case when key variant proceed

  // prepare key variant byte
  keyTypeVal = new BigInt(keyType.value.toString());
  keyVariantVal = keyTypeVal.shiftLeft(4); // for key type from bit 5 -> 7
  keyVariantVal = keyVariantVal.or(new BigInt(config.key.part.public_key.toString())); // first bit indicates address/private key
  keyVariantVal = keyVariantVal.or(new BigInt(network.address_value.toString()).shiftLeft(1)); // second bit indicates net

  keyVariantBuffer = varint.encode(keyVariantVal);

  // correct keyVariantBuffer, toBuffer of bigi return no bytes if the value is 0
  keyVariantBuffer = keyVariantBuffer.length ? keyVariantBuffer : new Buffer([0]);

  checksumBuffer = common.doubleSHA256(Buffer.concat([keyVariantBuffer, pubKey], keyVariantBuffer.length + keyType.pubkey_length));
  checksumBuffer = checksumBuffer.slice(0, config.key.checksum_length);

  addressBuffer = Buffer.concat([keyVariantBuffer, pubKey, checksumBuffer], keyVariantBuffer.length + keyType.pubkey_length + config.key.checksum_length);
  base58Address = base58.encode(addressBuffer);

  return new AddressInfo({
    _prefix: keyVariantBuffer,
    _pubKey: pubKey,
    _network: network.name,
    _keyType: keyType.name,
    _string: base58Address
  });
}

function Address(data, network, type) {
  var info;

  if (!(this instanceof Address)) {
    return new Address(data, network, type);
  }

  if (Buffer.isBuffer(data)) {
    return Address.fromPublicKey(data, network, type);
  }

  if (_.isString(data)) {
    return Address.fromString(data);
  }

  if (data instanceof AddressInfo) {
    common.addImmutableProperties(this, data.getValues());
    return;
  }

  throw TypeError('Address error: can not recognize inputs');
}

Address.fromPublicKey = function(pubkey, network, type) {
  // verify network parameter
  network = network || networks.livenet;
  if (_.isString(network)) {
    network = networks[network];
    assert(network, new TypeError('Address error: can not recognize network'));
  }
  assert(_.isFinite(network.address_value), new TypeError('Address error: missing address information in network parameter'));

  // verify type parameter
  type = type || config.key.type.ed25519;
  if (_.isString(type)) {
    type = config.key.type[type.toLowerCase()];
  }
  assert(type.name && config.key.type[type.name], new TypeError('Address error: can not recognize type'));

  // verify pubkey
  assert(pubkey, new TypeError('Public key is required'));
  if (_.isString(pubkey) && /^([0-9a-f]{2})+$/.test(pubkey.toLowerCase())) {
    pubkey = new Buffer(pubkey.toLowerCase(), 'hex');
  }
  assert(Buffer.isBuffer(pubkey), new TypeError('Address error: can not recognize public key format'));

  return new Address(buildAddress(pubkey, network, type));
};

Address.fromString = function(addressString) {
  assert(_.isString(addressString), new TypeError('Address error: Expect ' + addressString + ' to be a string'));
  addressString = common.normalizeStr(addressString);
  return new Address(parseAddressString(addressString));
};

Address.isValid = function(addressString, networkName) {
  assert(_.isString(addressString), new TypeError('Expect ' + addressString + ' to be a string'));
  addressString = common.normalizeStr(addressString);
  try {
    var address = Address.fromString(addressString);
    if (networkName) {
      return networkName && address.getNetwork() == networkName;
    } else {
      return true;
    }
  } catch (error) {
    return false;
  }
};

Address.prototype.toString = function() {
  return this._string;
};

Address.prototype.getNetwork = function(){
  return this._network;
};

Address.prototype.getPublicKey = function(){
  return this._pubKey.toString('hex');
};

Address.prototype.getKeyType = function(){
  return this._keyType;
};

Address.prototype.pack = function(){
  return Buffer.concat([this._prefix, this._pubKey], this._prefix.length + this._pubKey.length);
};

module.exports = Address;