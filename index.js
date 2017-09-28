global.__baseBitmarkLibModulePath = __dirname + '/';
module.exports = exports = {
  Seed: require('./lib/seed.js'),
  AccountNumber: require('./lib/account-number.js'),
  AuthKey: require('./lib/auth-key.js'),
  Asset: require('./lib/records/asset.js'),
  Issue: require('./lib/records/issue.js'),
  Transfer: require('./lib/records/transfer.js'),

  config: require('./lib/config.js'),
  networks: require('./lib/networks.js'),

  util: {
    common: require('./lib/util/common.js'),
    base58: require('./lib/util/base58.js'),
    binary: require('./lib/util/binary-packing.js'),
    varint: require('./lib/util/varint.js'),
    fingerprint: require('./lib/util/fingerprint.js')
  }
};
