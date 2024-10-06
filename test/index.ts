import 'dotenv/config'
import { equals } from 'uint8arrays'
import { test } from '@bicycle-codes/tapzero'
import { type Keys, create, getSecret } from '../src/index.js'
// import Debug from '@bicycle-codes/debug'
// const debug = Debug('test')

let alice:Keys
let bob:Keys
test('setup', async t => {
    alice = create()
    bob = create()
    t.ok(alice, 'Alice should exist')
    t.ok(bob, 'Bob should exist')
})

let key
test('create a new secret key via ECDH', t => {
    key = getSecret(alice, bob.publicKey)
    t.ok(key instanceof Uint8Array, 'should return new bytes')
})

test('bob derives a key', t => {
    const bobsKey = getSecret(bob, alice.publicKey)
    t.ok(bobsKey instanceof Uint8Array, 'should return bytes')
    t.ok(equals(key, bobsKey), 'should return the same key')
})

// test('encrypt with the key', t => {

// })
