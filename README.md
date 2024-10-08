# ratchet
![tests](https://github.com/nichoth/ratchet/actions/workflows/nodejs.yml/badge.svg)
[![types](https://img.shields.io/npm/types/@nichoth/ratchet?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![install size](https://flat.badgen.net/packagephobia/install/@nichoth/ratchet)](https://packagephobia.com/result?p=@nichoth/ratchet)
[![license](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

Key ratcheting in typescript.

The same API, made with both [noble crypto](https://paulmillr.com/noble/) and [sodium](https://libsodium.gitbook.io/doc).

[See a live demo](https://nichoth.github.io/ratchet/)

<!-- toc -->

## install

```sh
npm i -S @nichoth/ratchet
```

## Types
All the key types are just aliases to `Uint8Array`.

* [Ed25519Keys](#ed25519keys)
* [X25519Keys](#x25519keys)
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

```ts
interface Keys {
    privateKey:Uint8Array;
    publicKey:Uint8Array;
    encPK:Uint8Array;
    encSK:Uint8Array;
}
```

### Message

```ts
import type { Message } from '@nichoth/ratchet'
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
import { ratchet } from '@nichoth/ratchet'
```

### Common JS
```js
require('@nichoth/ratchet')
```

## Use

### JS
```js
import '@nichoth/ratchet'
```

### pre-built JS
This package exposes minified JS files too. Copy them to a location that is
accessible to your web server, then link to them in HTML.

#### copy
Copy files so they are accessible to your server:

```sh
cp ./node_modules/@nichoth/ratchet/dist/index.min.js ./public/ratchet.min.js
```

#### HTML
Add a link to HTML:

```html
<script type="module" src="/ratchet.min.js"></script>
```
