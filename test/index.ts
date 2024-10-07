import 'dotenv/config'
import { equals } from 'uint8arrays'
import { test } from '@bicycle-codes/tapzero'
import { publicKeyToDid } from '@bicycle-codes/crypto-util/util'
import {
    type Keys,
    type DID,
    create,
    getSecret,
    encrypt,
    decrypt,
    message,
    decryptMsg,
    type Message
} from '../src/index.js'

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

let msg:Message
let msgOneAlicesKeys:Keys
let alicesDid:DID
test('encrypt a message', t => {
    alicesDid = publicKeyToDid.ecc(alice.publicKey)
    const [_msg, { keys }] = message(
        'hello messages',
        bob.publicKey,
        alicesDid
    )
    msg = _msg
    msgOneAlicesKeys = keys

    console.log('the message...', msg)
    t.ok(msg, 'returns a message')
    t.equal(typeof msg.body.text, 'string',
        'should return the right shape object')
    t.equal(msg.author, publicKeyToDid.ecc(alice.publicKey),
        'should have the right author')
    t.ok(keys.publicKey instanceof Uint8Array, 'returns keys separately')
})

let decryptedMsg:Message
test('Bob can decrypt the message that Alice created', t => {
    const decrypted = decryptedMsg = decryptMsg(msg, bob)
    t.ok(decrypted, 'should return something')
    t.equal(decrypted.body.text, 'hello messages', 'should decrypt the message')
})

let bobsMsg:Message
let bobsNewKeys:Keys
test('Bob can create a message, using the last message as key material', t => {
    [bobsMsg, { keys: bobsNewKeys }] = message(
        'hello from Bob',
        decryptedMsg.keys.publicKey,
        publicKeyToDid.ecc(bob.publicKey),
    )

    t.ok(bobsMsg, 'should return something')
    t.equal(typeof bobsMsg.body.text, 'string', 'should return a new message')
})

test("Alice can decrypt Bob's new message", t => {
    const decrypted = decryptMsg(bobsMsg, msgOneAlicesKeys)
    t.equal(decrypted.body.text, 'hello from Bob', 'should decrypt the message')
})

let msgThree:Message
test('Alice ratchets the messages', t => {
    [msgThree] = message(
        'hello number three',
        bobsMsg.keys.publicKey,
        alicesDid
    )

    t.equal(typeof msgThree.body.text, 'string', 'should create another message')
})

test("Bob can decrypt alice's message again", t => {
    const plainTextMsg = decryptMsg(msgThree, bobsNewKeys)
    t.equal(plainTextMsg.body.text, 'hello number three',
        'should decrypt the message')
})

test('Cannot decrypt a messge with the wrong keys', t => {
    t.plan(1)

    try {
        decryptMsg(msgThree, bob)
    } catch (err) {
        t.ok(err, 'should throw given the wrong keys')
    }
})
