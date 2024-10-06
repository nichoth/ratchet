import { x25519 } from '@noble/curves/ed25519'
import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import { sha256, sha512 } from '@noble/hashes/sha2'
import { hkdf } from '@noble/hashes/hkdf'
import { fromString } from 'uint8arrays'
import { webcrypto } from '@bicycle-codes/one-webcrypto'
// import { createDebug } from '@bicycle-codes/debug'
// const debug = createDebug()

export interface Message {
    pub:string;
    content:string;
}

export interface Keys {
    privateKey:Uint8Array;
    publicKey:Uint8Array;
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
 * Create a new x25519 keypair.
 *
 * @param seed Private key material
 * @returns {keys} A new keypair
 */
export function create (seed:Uint8Array = createRandom()):Keys {
    const sk = sha256(seed)
    const pk = x25519.scalarMultBase(sk)

    return { privateKey: sk, publicKey: pk }
}

export interface Message {
    keys:{  // <-- base64pad encoded keys
        public:string,
        prevPublic:string
    };
    content:string;
}

/**
 * Create a new message.
 *
 * @param text The text to encrypt
 * @param keypair Your ed25519 keypair
 * @param pub Their ed25519 public key
 * @param info Info param
 */
export function message (
    text:string|Uint8Array,
    keypair:{ privateKey:string|Uint8Array, publicKey:string|Uint8Array },
    pub:string|Uint8Array,
    info?:string
):Message {
    const newSecret = getSecret(keypair, pub, info)
    const nonce = createRandom()
    const cipher = xchacha20poly1305(newSecret, nonce)
    const cipherText = cipher.encrypt(typeof text === 'string' ?
        fromString(text) :
        text)
    const msg = {
        keys: {

        },
        body: { text: cipherText }
    }
}

/**
 * Use ECDH to derive a new secret key.
 *
 * @param keypair Your keypair
 * @param pub Their public key
 * @param info  Info param
 * @returns {Uint8Array} The new secret key
 */
export function getSecret (
    keypair:{ privateKey:string|Uint8Array, publicKey:string|Uint8Array },
    pub:string|Uint8Array,
    info?:string
):Uint8Array {
    const { privateKey } = keypair

    const newSecret = hkdf(
        sha256,
        x25519.getSharedSecret(privateKey, pub),
        undefined,
        info,
        // (info || (typeof keypair.publicKey === 'string' ?
        //     keypair.publicKey :
        //     toString(keypair.publicKey, 'base64pad') +
        //     (typeof pub === 'string' ? pub : toString(pub, 'base64pad'))
        // )),
        32
    )

    return newSecret
}
