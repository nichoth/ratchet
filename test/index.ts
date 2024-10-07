import 'dotenv/config'
import { equals } from 'uint8arrays'
import { test } from '@bicycle-codes/tapzero'
import { publicKeyToDid } from '@bicycle-codes/crypto-util/util'
import {
    type Keys,
    create,
    getSecret,
    encrypt,
    decrypt,
    message,
    decryptMsg
} from '../src/index.js'
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

let key:Uint8Array
test('create a new secret key via ECDH', t => {
    key = getSecret(alice, bob.publicKey)
    t.ok(key instanceof Uint8Array, 'should return new bytes')
})

test('bob derives a key', t => {
    const bobsKey = getSecret(bob, alice.publicKey)
    t.ok(bobsKey instanceof Uint8Array, 'should return bytes')
    t.ok(equals(key, bobsKey), 'should return the same key')
})

let cipherText:string
test('encrypt something', t => {
    const encrypted = cipherText = encrypt(key, 'hello, world of chacha')
    t.equal(typeof encrypted, 'string', 'should return a string')
})

test('decrypt the string', t => {
    const plainText = decrypt(cipherText, key)
    t.equal(typeof plainText, 'string', 'should return a string')
    t.equal(plainText, 'hello, world of chacha', 'should decrypt the message')
})

let msg
test('encrypt a message', t => {
    const [_msg, { keys }] = message(
        'hello messages',
        bob.publicKey,
        publicKeyToDid.ecc(alice.publicKey),
    )
    msg = _msg

    console.log('the message...', msg)
    t.ok(msg, 'returns a message')
    t.equal(typeof msg.body.text, 'string', 'should return the right shape object')
    t.equal(msg.author, publicKeyToDid.ecc(alice.publicKey),
        'should have the right author')
    t.ok(keys.publicKey instanceof Uint8Array, 'returns keys separately')
})

test('Bob can decrypt the message that Alice created', t => {
    const decrypted = decryptMsg(msg, bob)
    t.ok(decrypted, 'should return something')
    t.equal(decrypted.body.text, 'hello messages', 'should decrypt the message')
})
