module.exports = {
  livenet: {
    name: 'livenet',
    account_number_value: 0x00,
    kif_value: 0x00,
    seed_value: 0x00,
    // static_hostnames: ['nodes.live.bitmark.com'],
    // static_nodes: ['128.199.91.96:2130', '128.199.120.176:2130']
  },
  testnet: {
    name: 'testnet',
    account_number_value: 0x01,
    kif_value: 0x01,
    seed_value: 0x01
    // static_hostnames: ['nodes.test.bitmark.com'],
    // static_nodes: ['128.199.89.154:2130', '139.59.224.237:2130', '128.199.187.59:2130', '128.199.190.4:2130']
  }
};
