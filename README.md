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

To instatiate a PrivateKey object:

```javascript
var privateKey01 = new PrivateKey();
```

There are 2 optional parameters for the PrivateKey constructor: network and key type. The default for network is `livenet`, and the default for key type is `ed25519`.

```javascript
var privateKey02 = new PrivateKey('testnet');
var privateKey03 = new PrivateKey('livenet', 'ed25519');
```

To parse the private key from the KIF string:

```javascript
var privateKey = PrivateKey.fromKIF('cELQPQoW2YDWBq37V6ZLnEiHDD46BG3tEvVmj6BpiCSvQwSszC');
```

To parse the private key from the KIF string:

```javascript
var privateKey = PrivateKey.fromBuffer('75d954e8f790ca792502148edfefed409d3da04b49443d390435e776821252e26c60fe96ba261d2f3942a33d2eaea2391dfb662de79bc0c4ef53521ce8b11c20', 'testnet', 'ed25519');
```

The buffer can be either a hex string or Buffer object. For ed25519, we can input a seed (32 bytes) or a full private key (64 bytes).

#### Methods
* *toBuffer()* — returns a Buffer object containing the private key
* *toString()* — returns *toBuffer()* in hexidecimal format
* *toKIF()* — returns the private key in KIF format.
* *getNetwork()* — returns either `livenet` or `testnet`, depending on the key
* *getKeyType()* — returns the key system type (currently only `ed25519`)
* *getAddress()* — returns an Address object (see next section)

---

## Address

#### Set up

```javascript
var Address = bitmarkLib.Address;
```

#### Instantiate

To instatiate an Address object from a hexidecimal string:

```javascript
var address = new Address('bxnT1iqAWFWM2MpSNGMHTq92Y27n81B3ep4vFcTpra4AEU9q7d');
var sameAddress = Address.fromString('bxnT1iqAWFWM2MpSNGMHTq92Y27n81B3ep4vFcTpra4AEU9q7d');
```

To instantiate an Address object from a Buffer object:

```javascript
var buffer = new Buffer('73346e71883a09c0421e5d6caa473239c4438af71953295ad903fea410cabb44', 'hex');
var address = new Address(buffer, 'testnet', 'ed25519');
var sameAddress01 = Address.fromBuffer(buffer, 'testnet', 'ed25519');
var sameAddress02 = Address.froMBuffer('73346e71883a09c0421e5d6caa473239c4438af71953295ad903fea410cabb44', 'testnet', 'ed25519');
```

Note:
* `network` and `keytype` are optional, the defaults are `livenet` and `ed25519`.
* When instantiating aa Address from a Buffer object using the constructor function, input the Buffer object instead of a hexidecimal string value.

To instantiate an Address object from a PrivateKey:

```javascript
var privateKey = PrivateKey.fromKIF('cELQPQoW2YDWBq37V6ZLnEiHDD46BG3tEvVmj6BpiCSvQwSszC');
var address = privateKey.getAddress()
```

#### Validation

```javascript
Address.isValid('erxs7Li15xcioSpGLi1kPhA4vNvJSJYEUnTzU4oJ989coEuUv;'); // returns false because of bad address string
Address.isValid('ayUWeSeJEcATAHQTBU1qkVcEh9V12cnfCeFWAh1Jq7NdVMjH5q', 'testnet'); // returns false because of wrong network
Address.isValid('erxs7Li15xcioSpGLi1kPhA4vNvJSJYEUnTzU4oJ989coEuUvb', 'testnet'); // returns true
```

#### Methods

* *toString()* — returns the address as a hexidecimal string
* *getNetwork()* — returns either `livenet` or `testnet`, depending on the address
* *getPublicKey()* — returns a public key as a hexidecimal string value
* *getKeyType()* — returns the key system type (currently only `ed25519`)

---

## Records

### Asset Record

#### Set up

```javascript
var Asset = bitmarkLib.Asset
```

#### Instantiate

To instatiate an Asset record object:

```javascript
var asset = new Asset()
      .setName('Asset name')
      .setDescription('Asset description')
      .setFingerprint('73346e71883a09c0421e5d6caa473239c4438af71953295ad903fea410cabb44')
      .sign(privateKey);
```

#### Methods
* *getRPCMessage()* — returns a json object for sending in an RPC message
* *isSigned()* — returns `true` if the asset record is signed
* *getName()* — returns the string value for an Asset's *Description* property
* *getDescription()* — returns the string value for an Asset's *Description* property
* *getFingerprint()* — returns the hexidecimal value for an Asset's *Fingerprint* property
* *getRegistrant()* — returns an Address object specifying the Asset's *Registrant* property 
* *getSignature()* — returns the Asset object's signature buffer
* *getId()* — returns the Asset object's 'AssetIndex' as a string value (only available when the record is broadcast via RPC)
* *getTxId()* — returns the Asset object's transaction id (only available when the record is broadcasted via RPC)


### Issue Record

#### Set up

```javascript
var Issue = bitmarkLib.Issue
```

#### Instantiate

To instatiate an Issue record object:

```javascript
var issue = new Issue()
      .fromAsset(asset)
      .setNonce(1)
      .sign(privateKey);
```

Note: `fromAsset()` can receive either an Asset object or an *asset-id* string.

#### Methods
* *getRPCMessage()* — returns a json object for sending in an RPC message
* *isSigned()* — returns `true` if the issue record is signed
* *getOwner()* — returnss an Address object specifying the Issue record's *Owner* property
* *getSignature()* — returns the Issue object's signature buffer
* *getAsset()*: returns the Issue record's corresponding *AssetIndex* as a string value
* *getPaymentAddress()* — only available when the record is broadcast via RPC
* *getTxId()* — returns a hexadecimal string id for the Issue record (only available when the record is broadcast via RPC)


---

### Transfer

#### Set up

```javascript
var Transfer = bitmarkLib.Transfer
```

#### Instantiate


To instatiate a Transfer record object:

```javascript
var transfer = new Transfer()
      .from(previousTransfer)
      .to(newOwner)
      .sign(privateKey);
```

Note: `from()` can receive either an Issue or Transfer object *or* an id string from either an Issue or Transfer object. 

#### Methods
* *getRPCMessage()* — returns a json object for sending in an RPC message
* *isSigned()* — returns `true` if the transfer record is signed
* *getOwner()* —  returnss an Address object specifying the the Transfer record's *Owner* property
* *getSignature()*: returns the Transfer object's signature buffer
* *getPreTx()*: returns a hexadecimal string of a *TxId* for the previous record in the chain-of ownership (either an Issue record or Transfer record) — the same as a record's *Link* property in the blockchain data structure
* *getPaymentAddress()* — only available when the record is broadcast via RPC
* *getTxId()* — returns a hexadecimal string id for the Transfer record (only available when the record is broadcast via RPC)

---

## RPC

Under construction

--


# License

Copyright (c) 2014-2015 Bitmark Inc (support@bitmark.com).

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