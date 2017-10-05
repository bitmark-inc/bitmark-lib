var bitmarklib = require("../index.js")
var axios = require("axios")

const apiServer = "https://api.devel.bitmark.com"

var mySeed = new bitmarklib.Seed.fromBase58('5XEECtxro3wPhntfQCrPMv3X3Kft6A8smRiwB4pbTxgyu44QmQUhKsz')
var authKey = bitmarklib.AuthKey.fromSeed(mySeed);

if (process.argv.length < 3) {
  return
}

// Generate a transfer
var transfer = new bitmarklib.Transfer()
transfer
  .fromTx(process.argv[2])
  .toAccountNumber("fqN6WnjUaekfrqBvvmsjVskoqXnhJ632xJPHzdSgReC6bhZGuP")
  .sign(authKey)
console.log(JSON.stringify(transfer, null, 2))

// The request data
var data = {transfer: transfer}
console.log(JSON.stringify(data, null, 2))

axios
  .post(apiServer + '/v1/transfer', data)
  .then((resp) => {
    console.log(resp.data)
  })
  .catch((err) => {
    console.log(err.response.data)
  })
