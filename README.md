# bitmark-lib

The pure Javascript Bitmark library for node.js and browsers.

# Install

```sh
$ npm install pg
```

# Set up

```javascript
var bitmarkLib = require('bitmark-lib');
```

# Usage

## Private Key

#### Set up

```javascript
var PrivateKey = bitmarkLib.PrivateKey;
```

#### Instantiate

Here is how we instantia a private key

```javascript
var privateKey01 = new PrivateKey();
```

There are 2 optional parameters for Private Key constructor, which are network and key type. The defaul for network is `livenet` and for key type is `ed25519`.

```javascript
var privateKey02 = new PrivateKey('testnet');
var privateKey03 = new PrivateKey('livenet', 'ed25519');
```

We can also parse the private key from KIF string.

```javascript
var privateKey = PrivateKey.fromKIF('cELQPQoW2YDWBq37V6ZLnEiHDD46BG3tEvVmj6BpiCSvQwSszC');
```

or from buffer

```javascript
var privateKey = PrivateKey.fromBuffer('75d954e8f790ca792502148edfefed409d3da04b49443d390435e776821252e26c60fe96ba261d2f3942a33d2eaea2391dfb662de79bc0c4ef53521ce8b11c20', 'testnet', 'ed25519');
```

Buffer can be either hex string or Buffer object. For ed25519, we can input a seed (32 bytes) or a full private key (64 bytes).

#### Methods
* toBuffer: return a Buffer object containing the private key
* toString: return hex form of toBuffer
* toKIF: return the private key in KIF
* getNetwork: return either livenet or testnet based on the key
* getKeyType: return only `ed25519` for now
* getAddress: return address object which will be introduced next

## Address

#### Set up

```javascript
var Address = bitmarkLib.Address;
```

#### Instantiate

From String

```javascript
var address = new Address('bxnT1iqAWFWM2MpSNGMHTq92Y27n81B3ep4vFcTpra4AEU9q7d');
var sameAddress = Address.fromString('bxnT1iqAWFWM2MpSNGMHTq92Y27n81B3ep4vFcTpra4AEU9q7d');
```

From Buffer

```javascript
var buffer = new Buffer('73346e71883a09c0421e5d6caa473239c4438af71953295ad903fea410cabb44', 'hex');
var address = new Address(buffer, 'testnet', 'ed25519');
var sameAddress01 = Address.fromBuffer(buffer, 'testnet', 'ed25519');
var sameAddress02 = Address.froMBuffer('73346e71883a09c0421e5d6caa473239c4438af71953295ad903fea410cabb44', 'testnet', 'ed25519');
```

Note:
* `network` and `keytype` are optional, the defaults are livenet and ed25519
* When instantiate a Address from buffer using the constructor, input buffer object instead of hex

Or from PrivateKey

```javascript
var privateKey = PrivateKey.fromKIF('cELQPQoW2YDWBq37V6ZLnEiHDD46BG3tEvVmj6BpiCSvQwSszC');
var address = privateKey.getAddress()
```

#### Validation

```javascript
Address.isValid('erxs7Li15xcioSpGLi1kPhA4vNvJSJYEUnTzU4oJ989coEuUv;'); // return false because of bad address string
Address.isValid('ayUWeSeJEcATAHQTBU1qkVcEh9V12cnfCeFWAh1Jq7NdVMjH5q', 'testnet'); // return false because of wrong network
Address.isValid('erxs7Li15xcioSpGLi1kPhA4vNvJSJYEUnTzU4oJ989coEuUvb', 'testnet'); // return true
```

#### Methods

* toString: return address string
* getNetwork: return either livenet or testnet based on the address
* getPublicKey: return public key hex string
* getKeyType: return `ed25519`


## Records

### Asset

#### Set up

```javascript
var Asset = bitmarkLib.Asset
```

#### Instantiate

```javascript
var asset = new Asset()
      .setName('Asset name')
      .setDescription('Asset description')
      .setFingerprint('73346e71883a09c0421e5d6caa473239c4438af71953295ad903fea410cabb44')
      .sign(privateKey);
```

#### Methods
* getRPCMessage: return json object to be used for sending via RPC
* isSigned: return `true` if the record is signed
* getName
* getDescription
* getFingerprint
* getRegistrant: return address object of registrant
* getId: only available when the record is broadcasted via RPC
* getTxId: only available when the record is broadcasted via RPC


### Issue

#### Set up

```javascript
var Issue = bitmarkLib.Issue
```

#### Instantiate

```javascript
var issue = new Issue()
      .fromAsset(asset)
      .setNonce(1)
      .sign(privateKey);
```

Node: `fromAsset` can receive either asset object of asset-id string

#### Methods
* getRPCMessage: return json object to be used for sending via RPC
* isSigned: return `true` if the record is signed
* getOwner: return owner address object
* getSignature: return signature buffer
* getAsset: return asset id string
* getPaymentAddress: only available when the record is broadcasted via RPC
* getTxId: only available when the record is broadcasted via RPC


### Transfer

#### Set up

```javascript
var Transfer = bitmarkLib.Transfer
```

#### Instantiate

```javascript
var transfer = new Transfer()
      .from(previousTransfer)
      .to(newOwner)
      .sign(privateKey);
```

Node: `from` can receive either issue, transfer object, or id string

#### Methods
* getRPCMessage: return json object to be used for sending via RPC
* isSigned: return `true` if the record is signed
* getOwner: return owner address object
* getSignature: return signature buffer
* getPreTx: return previous transaction id string
* getPaymentAddress: only available when the record is broadcasted via RPC
* getTxId: only available when the record is broadcasted via RPC

## RPC
Under construction

# License

Copyright (c) 2015-2015 Bitmark Inc (support@bitmark.com).

Permission to use, copy, modify, and distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.