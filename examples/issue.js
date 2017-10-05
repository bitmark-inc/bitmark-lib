var bitmarklib = require('../index.js');
var axios = require("axios")

const apiServer = "https://api.devel.bitmark.com"

var mySeed = new bitmarklib.Seed.fromBase58('5XEECtxro3wPhntfQCrPMv3X3Kft6A8smRiwB4pbTxgyu44QmQUhKsz')
var authKey = bitmarklib.AuthKey.fromSeed(mySeed);


var myData = Date()
console.log("My data is:", myData)
var fingerprint = bitmarklib.util.fingerprint.fromString(myData)
console.log("Fingerprint:", fingerprint)

// Generate an asset
var asset = new bitmarklib.Asset()
asset
  .setName("my asset")
  .setMetadata({"jim": "test"})
  .setFingerprint(fingerprint)
  .sign(authKey)

// Generate an issue
var issue = new bitmarklib.Issue()
issue
  .fromAsset(asset)
  .sign(authKey)

// The request data
var data = {
  assets: [asset],
  issues: [issue]
}
console.log(JSON.stringify(data, null, 2))

axios
  .post(apiServer + '/v1/issue', data)
  .then((resp) => {
    console.log(resp.data)
  })
  .catch((err) => {
    console.log(err.response.data)
  })
