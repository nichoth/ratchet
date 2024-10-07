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

function generateEntropy (numBytes = 16) {
    return sodium.randombytes_buf(numBytes)
}
