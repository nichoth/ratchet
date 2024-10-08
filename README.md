# ratchet
![tests](https://github.com/nichoth/ratchet/actions/workflows/nodejs.yml/badge.svg)
[![types](https://img.shields.io/npm/types/@nichoth/ratchet?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![install size](https://flat.badgen.net/packagephobia/install/@nichoth/ratchet)](https://packagephobia.com/result?p=@nichoth/ratchet)
[![license](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

Key ratcheting in typescript, implemented with [noble crypto](https://paulmillr.com/noble/).

[Read some API docs](https://nichoth.github.io/ratchet/)

<!-- toc -->

## install

```sh
npm i -S @nichoth/ratchet
```

## Example

### Create a new keypair

```ts
import { create } from '@nichoth/ratchet'
const alice = create()

// => {
//    ed25519: {
//        privateKey:Uint8Array
//        publicKey:Uint8Array
//    };
//    x25519: {
//        privateKey:Uint8Array
//        publicKey:Uint8Array
//     }
//  }
```

### Encrypt a new message
This returns a tuple of `[Message, { keys }]`, where `keys` is the new keypair that was created for this message. A string version of the public key is embedded in the message.

```ts
import { message } from '@nichoth/ratchet'

// a message from Alice to Bob
const [msg, { keys }] = message(
    'hello world',
    bob.x25519.publicKey,
    alicesDid
)
```

### Decrypt a message

```ts
import { decryptMsg } from '@nichoth/ratchet'

// pass in the message and the keypair containing the relevant secret key
const decrypted =  decryptMsg(msg, bob.x25519)
```

-------------------------------------------------------------------

## Types

All the key types are just aliases to `Uint8Array`.

* [Ed25519Keys](#ed25519keys)
* [X25519Keys](#x25519keys)
* [DID](#did)
* [Keys](#keys)
* [Message](#message)

### Ed25519Keys

```ts
interface Ed25519Keys {
    privateKey:Uint8Array;
    publicKey:Uint8Array;
}
```

### X25519Keys

```ts
type X25519Keys = Ed25519Keys;
```

### DID
```ts
type DID = `did:key:z${string}`;
```

### Keys
These are aliases to `Uint8Array`.

```ts
interface Keys {
    ed25519: {
        privateKey:Ed25519Keys['privateKey'];
        publicKey:Ed25519Keys['publicKey'];
    };
    x25519: {
        privateKey:X25519Keys['privateKey'];
        publicKey:X25519Keys['publicKey'];
    }
}
```

### Message

```ts
interface Message {
    keys:{  // <-- base64pad encoded
        publicKey:string;
    };
    author:DID;
    body:{
        text:string;
    };
}
```

An encrypted message looks like this:

```ts
{
    keys: { publicKey: 'W+V510cXyL6LT8+MIT7KmE9+PccQtTOZwWNCYG+EVxY=' },
    author: 'did:key:z6Mker5GURbWxk3YxW8vet9dt1Mk55D97hzLDGBtSpMBm21S',
    body: {
        text: 'HnlVO3QvJJQhdqmM8EGnsJgmgYpu/GOXl2OR/EFPptk8RdGvLxxmG4vQQ2pNpm2JxEvlfoZC'
    }
}
```

Decrypted, it looks like this:

```js
{
    keys: { publicKey: 'W+V510cXyL6LT8+MIT7KmE9+PccQtTOZwWNCYG+EVxY=' },
    author: 'did:key:z6Mker5GURbWxk3YxW8vet9dt1Mk55D97hzLDGBtSpMBm21S',
    body: { text: 'hello messages' }
}
```

## API

This exposes ESM and common JS via [package.json `exports` field](https://nodejs.org/api/packages.html#exports).

### ESM
```js
import { create, encrypt } from '@nichoth/ratchet'
```

### Common JS
```js
const { create, encrypt } = require('@nichoth/ratchet')
```
