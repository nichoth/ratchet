import { fromString } from '@bicycle-codes/crypto-util'
import { sha256 } from '@noble/hashes/sha2'
import { hkdf } from '@noble/hashes/hkdf'
import libsodium from 'libsodium-wrappers'

await libsodium.ready
const sodium = libsodium
const IV_BYTE_LENGTH = sodium.crypto_sign_SEEDBYTES

/**
 * Create a new signing keypair and a new encryption keypair
 *
 * @returns
 */
export function create (nonce = generateEntropy(IV_BYTE_LENGTH)) {
    try {
        const ed25519KeyPair = sodium.crypto_sign_seed_keypair(nonce)

        return {
            nonce,
            publicKey: ed25519KeyPair.publicKey,
            privateKey: ed25519KeyPair.privateKey,
            encPK: sodium.crypto_sign_ed25519_pk_to_curve25519(
                ed25519KeyPair.publicKey,
            ),
            encSK: sodium.crypto_sign_ed25519_sk_to_curve25519(
                ed25519KeyPair.privateKey,
            ),
        }
    } catch (err) {
        throw new Error('Encryption/decryption key derivation failed.', {
            cause: err,
        })
    }
}

export function encrypt (
    key:string|Uint8Array,
    plainText:string|Uint8Array,
):Uint8Array {
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
        plainText,
        null,
        null,
        nonce,
        typeof key === 'string' ? fromString(key) : key
    )

    return encrypted
}

/**
 * @see {@link https://libsodium.gitbook.io/doc/quickstart#how-can-i-sign-and-encrypt-using-the-same-key-pair sodium docs}
 * > If you really need to use the same key pair for both operations,
 * > Diffie-Hellman key exchange can be made over Edwards25519, the same group as
 * > the one used for signatures.
 */

/**
 * Use Diffie-Hellman to generate a new shared secret key.
 *
 * @returns {Uint8Array} A new shared secret key.
 */
export function getSecret (
    privateKey:string|Uint8Array,
    publicKey:string|Uint8Array,
    info?:string
):Uint8Array {
    let privKeyA:Uint8Array
    if (typeof privateKey === 'string') {
        privKeyA = fromString(privateKey)
    } else {
        privKeyA = privateKey
    }

    let pubKeyB:Uint8Array
    if (typeof publicKey === 'string') {
        pubKeyB = fromString(publicKey)
    } else {
        pubKeyB = publicKey
    }

    const newSecret = sodium.crypto_scalarmult(privKeyA, pubKeyB)

    const secret = hkdf(
        sha256,
        newSecret,
        undefined,
        info,
        32
    )

    return secret
}

function generateEntropy (numBytes = 16) {
    return sodium.randombytes_buf(numBytes)
}
