import 'dotenv/config'
import { test } from '@bicycle-codes/tapzero'
import { equals } from 'uint8arrays'
import type { Keys } from '../src/index.js'
import { create, getSecret } from '../src/sodium.js'

let alice:Keys
let bob:Keys
test('setup', async t => {
    alice = create()
    bob = create()
    t.ok(alice, 'Alice should exist')
    t.ok(bob, 'Bob should exist')
})

let key:Uint8Array
test('create a new secret key via diffie-hellman', t => {
    key = getSecret(alice.encSK, bob.encPK)
    t.ok(key instanceof Uint8Array, 'should return new bytes')
})

test('bob derives a key', t => {
    const bobsKey = getSecret(bob.encSK, alice.encPK)
    t.ok(bobsKey instanceof Uint8Array, 'should return bytes')
    t.ok(equals(key, bobsKey), 'Bob should derive the same key as Alice')
})

let cipherText:string
test('encrypt something', t => {
    const encrypted = cipherText = encrypt(key, 'hello, world of chacha')
    t.equal(typeof encrypted, 'string', 'should return a string')
})
