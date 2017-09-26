var common = require('./util/common.js');
var varint = require('./util/varint.js');
var base58 = require('./util/base58.js');
var assert = require('./util/assert.js');
var _ = require('lodash');

var networks = require('./networks.js');
var config = require('./config.js');

var BigInteger = require('bn.js');

// dummy internal object
function AccountNumberInfo(values){
  this.getValues = function(){ return values; };
}

function parseAccountNumberString(accountNumberString) {
  var accountNumberBuffer = base58.decode(accountNumberString);

  var keyVariant = varint.decode(accountNumberBuffer);
  var keyVariantBuffer = keyVariant.toBuffer();

  // check for whether this is an account number
  var keyPartVal = new BigInteger(config.key.part.public_key);
  assert(keyVariant.and(new BigInteger(1)).eq(keyPartVal), 'Account number error: this is not an account number');
  // detect network
  var networkVal = keyVariant.shrn(1).and(new BigInteger(0x01)).toNumber();
  var network = networkVal === networks.livenet.account_number_value ? networks.livenet : networks.testnet;
  // key type
  var keyTypeVal = keyVariant.shrn(4).and(new BigInteger(0x07)).toNumber();
  var keyType = common.getKeyTypeByValue(keyTypeVal);
  assert(keyType, 'Account number error: unknown key type');
  // check the length of the account number
  var accountNumberLength = keyVariantBuffer.length + keyType.pubkey_length + config.key.checksum_length;
  assert(accountNumberLength === accountNumberBuffer.length,
    'Account number error: key type ' + keyType.name.toUpperCase() + ' must be ' + accountNumberLength + ' bytes');

  // get public key
  var pubKey = accountNumberBuffer.slice(keyVariantBuffer.length, accountNumberLength - config.key.checksum_length);

  // check checksum
  var checksum = common.sha3_256(accountNumberBuffer.slice(0, keyVariantBuffer.length + keyType.pubkey_length));
  checksum = checksum.slice(0, config.key.checksum_length);
  assert(common.bufferEqual(checksum, accountNumberBuffer.slice(accountNumberLength-config.key.checksum_length, accountNumberLength)),
    'Account number error: checksum mismatchs');

  return new AccountNumberInfo({
    _prefix: keyVariantBuffer,
    _pubKey: pubKey,
    _network: network.name,
    _keyType: keyType.name,
    _string: accountNumberString,
  });
}

/**
 * build account number info from public key, network and type
 * @param  {buffer}
 * @param  {network}
 * @param  {keyType}
 * @return {info object}
 */
function buildAccountNumber(pubKey, network, keyType) {
  var keyTypeVal, keyVariantVal;
  var keyVariantBuffer, checksumBuffer;
  var accountNumberBuffer, base58AccountNumber;

  assert(pubKey.length === keyType.pubkey_length,
    'Account number error: public key for key type ' + keyType.name + ' must be ' + keyType.pubkey_length + ' bytes');

  // TODO: process the case when key variant proceed

  // prepare key variant byte
  keyTypeVal = new BigInteger(keyType.value);
  keyVariantVal = keyTypeVal.shln(4); // for key type from bit 5 -> 7
  keyVariantVal.ior(new BigInteger(config.key.part.public_key.toString())); // first bit indicates account number/auth key
  keyVariantVal.ior(new BigInteger(network.account_number_value).ishln(1)); // second bit indicates net
  keyVariantBuffer = varint.encode(keyVariantVal);

  checksumBuffer = common.sha3_256(Buffer.concat([keyVariantBuffer, pubKey], keyVariantBuffer.length + keyType.pubkey_length));
  checksumBuffer = checksumBuffer.slice(0, config.key.checksum_length);

  accountNumberBuffer = Buffer.concat([keyVariantBuffer, pubKey, checksumBuffer], keyVariantBuffer.length + keyType.pubkey_length + config.key.checksum_length);
  base58AccountNumber = base58.encode(accountNumberBuffer);

  return new AccountNumberInfo({
    _prefix: keyVariantBuffer,
    _pubKey: pubKey,
    _network: network.name,
    _keyType: keyType.name,
    _string: base58AccountNumber
  });
}

function AccountNumber(data, network, type) {
  if (!(this instanceof AccountNumber)) {
    return new AccountNumber(data, network, type);
  }

  if (Buffer.isBuffer(data)) {
    return AccountNumber.fromPublicKey(data, network, type);
  }

  if (_.isString(data)) {
    return AccountNumber.fromString(data);
  }

  if (data instanceof AccountNumberInfo) {
    common.addImmutableProperties(this, data.getValues());
    return;
  }

  throw TypeError('Account number error: can not recognize inputs');
}

AccountNumber.fromPublicKey = function(pubkey, network, type) {
  // verify network parameter
  network = network || networks.livenet;
  if (_.isString(network)) {
    network = networks[network];
    assert(network, new TypeError('Account number error: can not recognize network'));
  }
  assert(_.isFinite(network.account_number_value), new TypeError('Account number error: missing account number information in network parameter'));

  // verify type parameter
  type = type || config.key.type.ed25519;
  if (_.isString(type)) {
    type = config.key.type[type.toLowerCase()];
  }
  assert(type.name && config.key.type[type.name], new TypeError('Account number error: can not recognize type'));

  // verify pubkey
  assert(pubkey, new TypeError('Public key is required'));
  if (_.isString(pubkey) && /^([0-9a-f]{2})+$/.test(pubkey.toLowerCase())) {
    pubkey = new Buffer(pubkey.toLowerCase(), 'hex');
  }
  assert(Buffer.isBuffer(pubkey), new TypeError('Account number error: can not recognize public key format'));

  return new AccountNumber(buildAccountNumber(pubkey, network, type));
};

AccountNumber.fromString = function(accountNumberString) {
  assert(_.isString(accountNumberString), new TypeError('Account number error: Expect ' + accountNumberString + ' to be a string'));
  accountNumberString = common.normalizeStr(accountNumberString);
  return new AccountNumber(parseAccountNumberString(accountNumberString));
};

AccountNumber.isValid = function(accountNumberString, networkName) {
  assert(_.isString(accountNumberString), new TypeError('Expect ' + accountNumberString + ' to be a string'));
  accountNumberString = common.normalizeStr(accountNumberString);
  try {
    var accountNumber = AccountNumber.fromString(accountNumberString);
    if (networkName) {
      return networkName && accountNumber.getNetwork() == networkName;
    } else {
      return true;
    }
  } catch (error) {
    return false;
  }
};

AccountNumber.prototype.toString = function() {
  return this._string;
};

AccountNumber.prototype.getNetwork = function(){
  return this._network;
};

AccountNumber.prototype.getPublicKey = function(){
  return this._pubKey.toString('hex');
};

AccountNumber.prototype.getKeyType = function(){
  return this._keyType;
};

AccountNumber.prototype.pack = function(){
  return Buffer.concat([this._prefix, this._pubKey], this._prefix.length + this._pubKey.length);
};

module.exports = AccountNumber;
