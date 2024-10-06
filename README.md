# package name here
![tests](https://github.com/nichoth/ratchet/actions/workflows/nodejs.yml/badge.svg)
[![types](https://img.shields.io/npm/types/@nichoth/ratcher?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![install size](https://flat.badgen.net/packagephobia/install/@nichoth/ratchet)](https://packagephobia.com/result?p=@bicycle-codes/crypto-util)
[![dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen.svg?style=flat-square)](package.json)
[![license](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

Key ratcheting in typescript.

[See a live demo](https://nichoth.github.io/ratchet/)

<!-- toc -->

## install

```sh
npm i -S @nichoth/ratchet
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
