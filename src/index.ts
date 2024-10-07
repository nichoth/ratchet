import { x25519 } from '@noble/curves/ed25519'
import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import { sha256 } from '@noble/hashes/sha2'
import { hkdf } from '@noble/hashes/hkdf'
import { fromString, toString } from 'uint8arrays'
import { webcrypto } from '@bicycle-codes/one-webcrypto'
import type { DID } from '@bicycle-codes/crypto-util/types'
// import { createDebug } from '@bicycle-codes/debug'
// const debug = createDebug()
const NONCE_SIZE = 24
const KEY_SIZE = 32

export type { DID }

export interface Keys {
    privateKey:Uint8Array;
    publicKey:Uint8Array;
}

/**
 * encoded as `base64pad`
 */
export interface SerializedKeys {
    privateKey:string;
    publicKey:string;
}

/**
 * Generate some random bytes.
 */
function createRandom (length?:number) {
    const seed = new Uint8Array(length ?? 32)
    const random = webcrypto.getRandomValues(seed)
    return random
}

/**
 * Create a new 25519 keypair.
 *
 * @param seed Private key material
 * @returns {keys} A new keypair
 */
export function create (seed:Uint8Array = createRandom(KEY_SIZE)):Keys {
    const sk = sha256(seed)
    const pk = x25519.scalarMultBase(sk)

    return { privateKey: sk, publicKey: pk }
}

export interface Message {
    keys:{  // <-- base64pad encoded keys
        publicKey:string,
    };
    author:DID,
    body: {
        text:string;
    }
}

/**
 * Create an encrypted message using a new keypair + the other party's most
 * recent public key.
 *
 * Put the public half of the new keypair in the message, so it can
 * be decrypted with their most recent private key + the public key in
 * the message.
 *
 * @param text The text to encrypt
 * @param keypair Your ed25519 keypair
 * @param pub Their ed25519 public key
 * @param info Info param
 * @returns {[Message, { keys:Keys }]} The encrypted message and the new keypair
 *      used to encrypt it.
 */
export function message (
    text:string|Uint8Array,
    theirPublicKey:string|Uint8Array,
    author:DID,
    newKeypair?:{ privateKey:string|Uint8Array, publicKey: string|Uint8Array },
    info?:string
):[Message, { keys:Keys }] {
    const keypair = newKeypair || create()
    const newSecret = getSecret(keypair, theirPublicKey, info)
    const nonce = createRandom(NONCE_SIZE)
    const cipher = xchacha20poly1305(newSecret, nonce)
    const cipherText = cipher.encrypt(typeof text === 'string' ?
        fromString(text) :
        text)

    //
    // create this message with our new private key,
    // + their most recent public key
    //
    // put the public half of the new keypair in the message
    //

    const pub = (typeof keypair.publicKey === 'string' ?
        keypair.publicKey :
        toString(keypair.publicKey, 'base64pad'))

    // prepend the nonce to the encrypted content
    const encryptedContent = new Uint8Array([...nonce, ...cipherText])

    const msg:Message = {
        keys: {
            publicKey: pub
        },
        author,
        body: {
            text: toString(encryptedContent, 'base64pad')
        }
    }

    return [msg, {
        keys: {
            privateKey: (typeof keypair.privateKey === 'string' ?
                fromString(keypair.privateKey, 'base64pad') :
                keypair.privateKey),
            publicKey: (typeof keypair.publicKey === 'string' ?
                fromString(keypair.publicKey, 'base64pad') :
                keypair.publicKey
            )
        }
    }]
}

/**
 * Encrypt with a symmetric key.
 * Should be 24 byte nonce -- https://github.com/paulmillr/noble-ciphers?tab=readme-ov-file#encrypt-with-xchacha20-poly1305
 */
export function encrypt (
    key:string|Uint8Array,
    plainText:string|Uint8Array,
    nonce?:Uint8Array
):string {
    nonce = nonce ?? createRandom(NONCE_SIZE)
    const cipher = xchacha20poly1305(
        typeof key === 'string' ? fromString(key, 'base64pad') : key,
        nonce
    )

    const encrypted = cipher.encrypt(
        typeof plainText === 'string' ? fromString(plainText) : plainText,
    )

    // prepend the nonce to the cipher text
    return toString(new Uint8Array([...nonce, ...encrypted]), 'base64pad')
}

export function decryptMsg (msg:Message, keypair:Keys):Message {
    const secret = getSecret(keypair, msg.keys.publicKey)
    const cipherText = fromString(msg.body.text, 'base64pad')
    const nonce = cipherText.slice(0, NONCE_SIZE)
    const cipherBytes = cipherText.slice(NONCE_SIZE)  // slice 24 -> end
    const cipher = xchacha20poly1305(secret, nonce)
    const decrypted = cipher.decrypt(cipherBytes)

    return {
        ...msg,
        body: {
            text: toString(decrypted)
        }
    }
}

/**
 * Decrypt with a symmetric key.
 *
 * @param cipherText The cipher text, including the nonce
 * @param key The key to decrypt with
 * @returns {string} The decrypted text
 */
export function decrypt (cipherText:string, key:Uint8Array):string {
    const cipherBytes = fromString(cipherText, 'base64pad')
    const nonce = cipherBytes.slice(0, NONCE_SIZE)
    const cipherTextBytes = cipherBytes.slice(NONCE_SIZE)  // slice -- 24 -> end
    const cipher = xchacha20poly1305(
        typeof key === 'string' ? fromString(key, 'base64pad') : key,
        nonce
    )

    const plainText = cipher.decrypt(cipherTextBytes)
    return toString(plainText)
}

/**
 * Use ECDH to derive a new secret key.
 *
 * @param keypair Your keypair
 * @param pub Their public key
 * @param info Info param
 * @returns {Uint8Array} The new secret key
 */
export function getSecret (
    keypair:{ privateKey:string|Uint8Array, publicKey:string|Uint8Array },
    _pub:string|Uint8Array,
    info?:string
):Uint8Array {
    const { privateKey } = keypair
    const privKey = typeof privateKey === 'string' ?
        fromString(privateKey, 'base64pad') :
        privateKey

    const pub = typeof _pub === 'string' ? fromString(_pub, 'base64pad') : _pub

    const newSecret = hkdf(
        sha256,
        x25519.getSharedSecret(privKey, pub),
        undefined,
        info,
        32
    )

    return newSecret
}
