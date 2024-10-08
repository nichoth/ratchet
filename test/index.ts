import { equals } from 'uint8arrays'
import { test } from '@bicycle-codes/tapzero'
import { publicKeyToDid } from '@bicycle-codes/crypto-util/util'
import {
    type Keys,
    type DID,
    type Message,
    type Ed25519Keys,
    type X25519Keys,
    create,
    getSecret,
    encrypt,
    decrypt,
    message,
    decryptMsg,
    edToCurve,
    createEd,
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
    key = getSecret(alice.x25519.privateKey, bob.x25519.publicKey)
    t.ok(key instanceof Uint8Array, 'should return new bytes')
})

test('bob derives a key', t => {
    const bobsKey = getSecret(bob.x25519.privateKey, alice.x25519.publicKey)
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

let msg:Message  // a message from Alice to Bob
let msgOneAlicesKeys:X25519Keys
let alicesDid:DID
test('encrypt a message', t => {
    alicesDid = publicKeyToDid.ecc(alice.ed25519.publicKey)
    const [_msg, { keys }] = message(
        'hello messages',
        bob.x25519.publicKey,
        alicesDid
    )
    msgOneAlicesKeys = keys
    msg = _msg

    console.log('the message...', msg)
    t.ok(msg, 'returns a message')
    t.equal(typeof msg.body.text, 'string',
        'should return the right shape object')
    t.equal(msg.author, publicKeyToDid.ecc(alice.ed25519.publicKey),
        'should have the right author')
    t.ok(keys.publicKey instanceof Uint8Array, 'returns keys separately')
})

let decryptedMsg:Message
test('Bob can decrypt the message that Alice created', t => {
    const decrypted = decryptedMsg = decryptMsg(msg, bob.x25519)
    t.ok(decrypted, 'should return something')
    t.equal(decrypted.body.text, 'hello messages', 'should decrypt the message')
})

let bobsMsg:Message
let bobsNewKeys:X25519Keys
test('Bob can create a message, using the last message as key material', t => {
    [bobsMsg, { keys: bobsNewKeys }] = message(
        'hello from Bob',
        decryptedMsg.keys.publicKey,
        publicKeyToDid.ecc(bob.ed25519.publicKey),
    )

    t.ok(bobsMsg, 'should return something')
    t.equal(typeof bobsMsg.body.text, 'string', 'should return a new message')
})

test("Alice can decrypt Bob's new message", t => {
    const decrypted = decryptMsg(bobsMsg, msgOneAlicesKeys)
    t.equal(decrypted.body.text, 'hello from Bob', 'should decrypt the message')
})

let msgThree:Message
let msgThreeAlicesKeys:X25519Keys
test('Alice ratchets the messages', t => {
    const [_msgThree, { keys }] = message(
        'hello number three',
        bobsMsg.keys.publicKey,
        alicesDid
    )
    msgThree = _msgThree
    msgThreeAlicesKeys = keys

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
        decryptMsg(msgThree, bob.x25519)  // <-- pass in original keys, not new ones
    } catch (err) {
        t.ok(err, 'should throw given the wrong keys')
    }
})

let msgList:Message[]
test('Alice can decrypt a series of messages', t => {
    msgList = [msg, bobsMsg, msgThree]

    const alicesDecryptionSchedule = [
        [msgOneAlicesKeys, bob.x25519.publicKey],  // <-- A to B
        [msgOneAlicesKeys, bobsMsg.keys.publicKey],  // <-- B to A
        [msgThreeAlicesKeys, bobsMsg.keys.publicKey]  // <-- A to B
    ] as const

    const alicesDecrypted = msgList.map((msg, i) => {
        return decryptMsg(
            msg,
            alicesDecryptionSchedule[i][0],
            alicesDecryptionSchedule[i][1]
        )
    })

    t.equal(alicesDecrypted[0].body.text, 'hello messages',
        'should decrypt the messages')
    t.equal(alicesDecrypted[2].body.text, 'hello number three',
        'should decrypt all messages')
})

test('Bob can decrypt the series of messages', t => {
    const bobsDecryptionSchedule = [
        [bob.x25519, msg.keys.publicKey],  // <-- A to B -- msg
        [bobsNewKeys, msg.keys.publicKey],  // <-- B to A -- bobsMsg
        [bobsNewKeys, msgThree.keys.publicKey]  // <-- A to B -- msgThree
    ] as const

    const bobsDecrypted = msgList.map((msg, i) => {
        return decryptMsg(
            msg,
            bobsDecryptionSchedule[i][0],
            bobsDecryptionSchedule[i][1]
        )
    })

    t.ok(bobsDecrypted, 'should return something')
    t.equal(bobsDecrypted[0].body.text, 'hello messages',
        'should decrypt the messages')
    t.equal(bobsDecrypted[2].body.text, 'hello number three',
        'should decrypt all messages')
})

let newKeys:Ed25519Keys
test('Create Ed25519 keys', t => {
    newKeys = createEd()
    t.ok(newKeys, 'should return some keys')
})

test('Edwards keys to x25519', t => {
    const x25519Keys = edToCurve(newKeys)
    t.ok(x25519Keys.privateKey instanceof Uint8Array, 'should return x25519 keys')

    const sharedKey = getSecret(x25519Keys.privateKey, bob.x25519.publicKey)
    t.ok(sharedKey instanceof Uint8Array, 'should return a new shared key')
})

test('Can decrypt given current message, prev message, and keys', t => {
    const decrypted = decryptMsg(bobsMsg, bobsNewKeys, msg)
    t.equal(decrypted.body.text, 'hello from Bob', 'should decrypt the message')
})
