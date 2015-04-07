'use strict';

module.exports = {
  key: {
    type: {
      ed25519: {
        name: 'ed25519',
        value: 0x01,
        pubkey_length: 32,
        prikey_length: 64,
        seed_length: 32
      }
    },
    part: {
      private_key: 0x00,
      public_key: 0x01
    },
    checksum_length: 4,
  },
  record: {
    asset: {
      value: 0x01,
      max_name: 64,
      max_description: 256,
      max_fingerprint: 1000
    },
    issue: {value: 0x02 },
    transfer: {value: 0x03}
  },
  rpc: {
    request_timeout: 3000,
    // todo: change these numbers for production
    minimum: 1,
    enough: 15,

    renewal_too_few: 5 * 1000, // interval for checking the database when the number of nodes is less than minimum
    renewal_few: 60 * 1000, // interval for checking the database when the number of nodes is higher than minimum but less than enough
    renewal_enough: 30 * 60 * 1000, // interval for checking the database when the number of nodes is enough

    period_node_expiry: 24 * 60 * 60 * 1000, // time an alive node will need to be rechecked
    max_period_node_keeping: 7 * 24 * 60 * 60 * 1000, // if the client can't connect to the node for an amount of time, the node will be removed from the database
  },
};