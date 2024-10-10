# ratchet
![tests](https://github.com/nichoth/ratchet/actions/workflows/nodejs.yml/badge.svg)
[![types](https://img.shields.io/npm/types/@nichoth/ratchet?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![install size](https://flat.badgen.net/packagephobia/install/@nichoth/ratchet)](https://packagephobia.com/result?p=@nichoth/ratchet)
[![license](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

<!-- toc -->

## install

```sh
npm i -S @nichoth/ratchet
```

## notes

* [Why Are You Using Ed25519 Keys for X3DH?](https://soatok.blog/2020/11/14/going-bark-a-furrys-guide-to-end-to-end-encryption/#why-ed25519-keys-x3dh)

> piggybacking on another protocol called Gossamer to handle the distribution of Ed25519 public keys.

> we’re actually using birationally equivalent X25519 keys derived from the Ed25519 keypair for the X3DH step.

This is like what we do in [webauthn-keys](https://github.com/bicycle-codes/webauthn-keys/blob/955581371202418a61081321cb78dadc9fd5ed1c/src/index.ts#L163). We use the sodium function `ed25519_to_curve25519`:

```js
sodium.crypto_sign_ed25519_pk_to_curve25519(
    ed25519KeyPair.publicKey,
)
```

See [this sodium document](https://libsodium.gitbook.io/doc/advanced/ed25519-curve25519)


## See also

https://soatok.blog/2020/07/12/comparison-of-symmetric-encryption-methods/#chacha-vs-salsa20

* [Implementing Signal’s Double Ratchet algorithm](https://nfil.dev/coding/encryption/python/double-ratchet-example/)
* [soatok -- ChaCha vs. Salsa20](https://soatok.blog/2020/07/12/comparison-of-symmetric-encryption-methods/#chacha-vs-salsa20) -- use ChaCha
