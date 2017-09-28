# bitmark-lib

[![Build Status](https://travis-ci.org/bitmark-inc/bitmark-lib.svg?branch=master)](https://travis-ci.org/bitmark-inc/bitmark-lib)
[![Coverage Status](https://coveralls.io/repos/bitmark-inc/bitmark-lib/badge.svg?branch=master)](https://coveralls.io/r/bitmark-inc/bitmark-lib?branch=master)

# Install

```sh
$ npm install bitmark-lib
```

# Set up

```javascript
var bitmarkLib = require('bitmark-lib');
```

# Usage

## Seed

Seed is where everything starts. From Seed we can generate auth key, encryption key, etc.

To create a new random seed:

```javascript
var seed = new Seed();
```

There are 2 optional parameters for the Seed constructor: *network* and *version*. The default for *network* is `livenet`, and the only supported version now is 1.

```javascript
var seed = new Seed('testnet');
var seed = new Seed('testnet', 1);
```

The seed could be represented in string format to import back later on
```javascript
var backup = seed.toString(); // using toBase58 is equivalent
var restore = Seed.fromString(backup);
var isValidSeedString = Seed.isValid(backup); // check whether a string is in valid format
```

Passing a counter to the seed, it will create a new 32 key
```javascript
var key = seed.generateKey(999);
```
Note: the counter 999 and 1000 are preserve to generate auth key and encryption key

#### Methods
* *generateKey(counter)* — returns 32 bytes in a Buffer object
* *toString()* — returns the seed in string format
* *toBase58()* — returns the seed in string format (same as `toString`)
* *getNetwork()* — returns either `livenet` or `testnet`, depending on the key
* *getVersion()* — return version of the seed
* *getCore()* — returns 32 bytes core data

## Auth Key

#### Set up

```javascript
var AuthKey = bitmarkLib.AuthKey;
```

#### Instantiate

To instatiate a AuthKey object:

```javascript
var authKey01 = new AuthKey();
```

There are 2 optional parameters for the AuthKey constructor: *network* and *key type*. The default for *network* is `livenet`, and the default for *key type* is `ed25519`.

```javascript
var authKey02 = new AuthKey('testnet');
var authKey03 = new AuthKey('livenet', 'ed25519');
```

To parse the private key from the KIF string:

```javascript
var authKey = AuthKey.fromKIF('cELQPQoW2YDWBq37V6ZLnEiHDD46BG3tEvVmj6BpiCSvQwSszC');
```

To parse the private key from buffer:

```javascript
var authKey = AuthKey.fromBuffer('75d954e8f790ca792502148edfefed409d3da04b49443d390435e776821252e26c60fe96ba261d2f3942a33d2eaea2391dfb662de79bc0c4ef53521ce8b11c20', 'testnet', 'ed25519');
```

The buffer can be either a hexadecimal string or a Buffer object. For ed25519, we can input a seed (32 bytes) or a full private key (64 bytes).

To create the auth key from the seed
```javascript
var authKey = AuthKey.fromSeed(new Seed());
```

#### Methods
* *toBuffer()* — returns a Buffer object containing the private key
* *toString()* — returns *toBuffer()* in hexadecimal format
* *toKIF()* — returns the private key in KIF format.
* *getNetwork()* — returns either `livenet` or `testnet`, depending on the key
* *getType()* — returns the key type (currently only `ed25519`)
* *getAccountNumber()* — returns an AccountNumber object (see next section)

---

## AccountNumber

#### Set up

```javascript
var AccountNumber = bitmarkLib.AccountNumber;
```

#### Instantiate

To instatiate an AccountNumber object from an account number string:

```javascript
var accountNumber = new AccountNumber('bxnT1iqAWFWM2MpSNGMHTq92Y27n81B3ep4vFcTpra4AEU9q7d');
var sameAccountNumber = AccountNumber.fromString('bxnT1iqAWFWM2MpSNGMHTq92Y27n81B3ep4vFcTpra4AEU9q7d');
```

To instantiate an AccountNumber object from a Buffer object:

```javascript
var buffer = new Buffer('73346e71883a09c0421e5d6caa473239c4438af71953295ad903fea410cabb44', 'hex');
var accountNumber = new AccountNumber(buffer, 'testnet', 'ed25519');
var sameAccountNumber01 = AccountNumber.fromBuffer(buffer, 'testnet', 'ed25519');
var sameAccountNumber02 = AccountNumber.froMBuffer('73346e71883a09c0421e5d6caa473239c4438af71953295ad903fea410cabb44', 'testnet', 'ed25519');
```

Note:
* `network` and `keytype` are optional, the defaults are `livenet` and `ed25519`.
* When instantiating a AccountNumber from a Buffer object using the constructor function, input the Buffer object instead of a hexadecimal string value.

To instantiate an AccountNumber object from a AuthKey:

```javascript
var authKey = AuthKey.fromKIF('cELQPQoW2YDWBq37V6ZLnEiHDD46BG3tEvVmj6BpiCSvQwSszC');
var accountNumber = authKey.getAccountNumber()
```

#### Validation

```javascript
AccountNumber.isValid('erxs7Li15xcioSpGLi1kPhA4vNvJSJYEUnTzU4oJ989coEuUv;'); // returns false because of bad account number string
AccountNumber.isValid('ayUWeSeJEcATAHQTBU1qkVcEh9V12cnfCeFWAh1Jq7NdVMjH5q', 'testnet'); // returns false because of wrong network
AccountNumber.isValid('erxs7Li15xcioSpGLi1kPhA4vNvJSJYEUnTzU4oJ989coEuUvb', 'testnet'); // returns true
```

#### Methods

* *toString()* — returns the account number as a string
* *getNetwork()* — returns either `livenet` or `testnet`, depending on the account number
* *getPublicKey()* — returns the public key as a hexadecimal string value
* *getKeyType()* — returns the key type (currently only `ed25519`)

---

## Records

### Asset Record

#### Set up

```javascript
var Asset = bitmarkLib.Asset
```

#### Instantiate

To instantiate an Asset record object:

```javascript
var asset = new Asset()
      .setName('Asset name')
      .addMetadata('description', 'this is asset description')
      .setFingerprint('73346e71883a09c0421e5d6caa473239c4438af71953295ad903fea410cabb44')
      .sign(authKey);
```

#### Methods
* *isSigned()* — returns `true` if the asset record is signed
* *getName()* — returns the string value for an Asset's *Name* property
* *setMetadata(jsonMetadata)* - set the metadata for the asset
* *importMetadata(stringMetadata)* - set the metadata in string format
* *addMetadata(key, value)* - add the metadata to existing metadata set of the asset
* *removeMetadata(key)* - remove a specific metadata from existing metadata set
* *getMetadata()* - get the json metadata
* *getFingerprint()* — returns the hexadecimal value for an Asset's *Fingerprint* property
* *getRegistrant()* — returns an AccountNumber object specifying the Asset's *Registrant* property
* *getSignature()* — returns the Asset object's signature buffer
* *getId()* — returns the Asset object's 'AssetIndex' as a string value (only available when the record is broadcast via RPC)
* *getId()* — returns the Asset object's transaction id (only available when the record is broadcasted via RPC)


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
      .sign(authKey);
```

Note: `fromAsset()` can receive either an Asset object or an *asset-id* string.

#### Methods
* *isSigned()* — returns `true` if the issue record is signed
* *getOwner()* — returnss an AccountNumber object specifying the Issue record's *Owner* property
* *getSignature()* — returns the Issue object's signature buffer
* *getAsset()*: returns the Issue record's corresponding *AssetIndex* as a string value
* *getId()* — returns a hexadecimal string id for the Issue record (only available when the record is broadcast via RPC)


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
      .fromTx(previousTransfer)
      .toAccountNumber(newOwner)
      .sign(authKey);
```

Note: `fromTx()` can receive either an Issue or Transfer object *or* an id string from either an Issue or Transfer object. 

#### Methods
* *isSigned()* — returns `true` if the transfer record is signed
* *getOwner()* —  returnss an AccountNumber object specifying the the Transfer record's *Owner* property
* *getSignature()*: returns the Transfer object's signature buffer
* *getPreTxId()*: returns a hexadecimal string of a *Id* for the previous record in the chain-of ownership (either an Issue record or Transfer record) — the same as a record's *Link* property in the blockchain data structure
* *getId()* — returns a hexadecimal string id for the Transfer record (only available when the record is broadcast via RPC)

---

## Utilities

### Fingerprint

```javascript
var bitmarkLib = require('bitmark-lib');
var fingerprint = bitmarkLib.util.fingeprint;
```

#### Methods
* *fromBuffer(Buffer)* - return a fingerprint string from buffer content
* *fromString(string)* - return a fingerprint string from string content


--


# License

Copyright (c) 2014-2017 Bitmark Inc (support@bitmark.com).

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
