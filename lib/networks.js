module.exports = {
  livenet: {
    name: 'livenet',
    address_value: 0x00,
    kif_value: 0x00,
    static_hostnames: ['nodes.test.bitmark.com'],
    static_nodes: ['118.163.120.178:3566', '118.163.120.176:3130'],
  },
  testnet: {
    name: 'testnet',
    address_value: 0x01,
    kif_value: 0x01,
    static_hostnames: ['nodes.live.bitmark.com'],
    static_nodes: ['118.163.122.206:3130', '118.163.122.207:3130'],
  }
};