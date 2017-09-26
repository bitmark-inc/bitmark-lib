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
    auth_key_index: 999
  },
  record: {
    asset: {
      value: 0x02,
      max_name: 64,
      max_metadata: 2048,
      max_fingerprint: 1024
    },
    issue: {value: 0x03 },
    transfer: {value: 0x04}
  },
  seed: {
    version: 0x01,
    length: 32,
    checksum_length: 4,
    network_length: 1,
    magic: new Buffer('5afe', 'hex'),
    counter_length: 16,
    nonce_length: 24
  },
  currency: {
    'bitcoin': 0x01
  },
  // rpc: {
  //   // TODO: change these numbers for production
  //   request_timeout: 10000, // deadline for a node to return the result of a call, otherwise we add it to dead list
  //   minimum: 1, // the minumum of nodes to get the data from
  //   enough: 5, // the number of nodes we do not need to get more nodes

  //   broadcast: {
  //     minimum: 1,
  //     enough: 3
  //   },
  //   discover: {
  //     enoughAliveNode: 3,
  //     enoughNodeRecord: 5
  //   },

  //   renewal_too_few: 5 * 1000, // interval for checking the database when the number of nodes is less than minimum
  //   renewal_few: 60 * 1000, // interval for checking the database when the number of nodes is higher than minimum but less than enough

  //   alive_node_expiry: 24 * 60 * 60 * 1000, // time an alive node will need to be rechecked
  //   dead_node_keeping: 7 * 24 * 60 * 60 * 1000, // if the client can't connect to the node for an amount of time, the node will be removed from the database
  // },
};
