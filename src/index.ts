import {
    x25519,
    edwardsToMontgomeryPub,
    edwardsToMontgomeryPriv,
    ed25519
} from '@noble/curves/ed25519'
import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import { sha256 } from '@noble/hashes/sha2'
import { hkdf } from '@noble/hashes/hkdf'
import { fromString, toString } from 'uint8arrays'
import { webcrypto } from '@bicycle-codes/one-webcrypto'
import type { DID } from '@bicycle-codes/crypto-util/types'
const NONCE_SIZE = 24
const KEY_SIZE = 32

export type { DID }

export interface Ed25519Keys {
    privateKey:Uint8Array;
    publicKey:Uint8Array;
}

export interface X25519Keys {
    privateKey:Uint8Array;
    publicKey:Uint8Array;
}

export interface Keys {
    ed25519: {
        privateKey:Ed25519Keys['privateKey'];
        publicKey:Ed25519Keys['publicKey'];
    };
    x25519: {
        privateKey:X25519Keys['privateKey'];
        publicKey:X25519Keys['publicKey'];
    }
}

/**
 * encoded as `base64pad`
 */
export interface SerializedKeys {
    privateKey:string;
    publicKey:string;
}

/**
 * Create a new Edwards keypair.
 *
 * @returns {{ privateKey:Uint8Array, publicKey:Uint8Array }}
 */
export function createEd ():{ privateKey:Uint8Array; publicKey:Uint8Array; } {
    const priv = ed25519.utils.randomPrivateKey()
    const pub = ed25519.getPublicKey(priv)

    return {
        privateKey: priv,
        publicKey: pub
    }
}

export function createX25519 (seed:Uint8Array = createRandom(KEY_SIZE)):X25519Keys {
    const sk = sha256(seed)
    const pk = x25519.scalarMultBase(sk)
    return { privateKey: sk, publicKey: pk }
}

/**
 * @see {@link https://github.com/paulmillr/noble-curves#ed25519-x25519-ristretto255 noble docs}
 * >   ed25519 => x25519 conversion
 *
 * Use Edwards keys for signatures, x25519 for Diffie-Hellman/encryption
 * @param edKeys The Edwards keypair
 * @returns {Keys} The x25519 keypair
 */
export function edToCurve (edKeys:{ publicKey:Uint8Array; privateKey:Uint8Array }):{
    publicKey:Uint8Array,
    privateKey:Uint8Array
} {
    return {
        publicKey: edwardsToMontgomeryPub(edKeys.publicKey),
        privateKey: edwardsToMontgomeryPriv(edKeys.privateKey)
    }
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
 * Create a new ed25519 keypair and x25519 keypair.
 *
 * @param seed Private key material
 * @returns {keys} New keypairs
 */
export function create ():Keys {
    const edKeys = createEd()
    const xKeys = edToCurve(edKeys)

    return {
        ed25519: {
            privateKey: edKeys.privateKey,
            publicKey: edKeys.publicKey,
        },
        x25519: {
            privateKey: xKeys.privateKey,
            publicKey: xKeys.publicKey
        }
    }
}

export interface Message {
    keys:{  // <-- base64pad encoded keys
        publicKey:string;
    };
    author:DID;
    body:{
        text:string;
    };
}

/**
 * Create a new encrypted message using a new keypair + the other party's most
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
    theirPublicKey:string|X25519Keys['publicKey'],
    author:DID,
    newKeypair?:{
        privateKey:string|X25519Keys['publicKey'],
        publicKey: string|X25519Keys['privateKey']
    },
    info?:string
):[Message, { keys:X25519Keys }] {
    const keypair = newKeypair || createX25519()
    const newSecret = getSecret(keypair.privateKey, theirPublicKey, info)
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

/**
 * This decrypts a message given the message + the "next" keypair.
 * (The keypair that is next in the sequence of msgs vs keys)
 *
 * Or pass in the current message, current keypair, and previous message
 */
export function decryptMsg (
    msg:Message,
    keypair:X25519Keys,
    publicKey?:Uint8Array|string|Message
):Message {
    let secret:Uint8Array|string = msg.keys.publicKey
    if (publicKey && (publicKey as Message).body) {
        // is message
        const prevMsg = publicKey
        secret = getSecret(keypair.privateKey, (prevMsg as Message).keys.publicKey)
    } else {
        // is key
        secret = getSecret(keypair.privateKey, (publicKey as string) || msg.keys.publicKey)
    }
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
    privateKey:string|Uint8Array,
    publicKey:string|Uint8Array,
    info?:string
):Uint8Array {
    const privKey = typeof privateKey === 'string' ?
        fromString(privateKey, 'base64pad') :
        privateKey

    const pub = typeof publicKey === 'string' ?
        fromString(publicKey, 'base64pad') :
        publicKey

    const newSecret = hkdf(
        sha256,
        x25519.getSharedSecret(privKey, pub),
        undefined,
        info,
        32
    )

    return newSecret
}
