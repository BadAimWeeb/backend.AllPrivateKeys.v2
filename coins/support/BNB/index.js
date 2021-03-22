const PRIVKEY_LEN = 32;
const CURVE = "secp256k1";

import { ec as EC } from "elliptic";
import { ab2hexstring, sha256ripemd160 } from "./utils.js";
import bech32 from "bech32";

const ec = new EC(CURVE);

/**
 * Gets an address from a private key.
 * 
 * @param {string} privateKeyHex the private key hexstring
 * @param {string?} prefix the address prefix
 * 
 * @return {string} address
 */
export const getAddressFromPrivateKey = (privateKeyHex, prefix) => {
    return getAddressFromPublicKey(
        getPublicKeyFromPrivateKey(privateKeyHex),
        prefix
    );
}

/**
 * Calculates the public key from a given private key.
 * 
 * @param {string} privateKeyHex the private key hexstring
 * @return {string} public key hexstring
 */
export const getPublicKeyFromPrivateKey = (privateKeyHex) => {
    if (!privateKeyHex || privateKeyHex.length !== PRIVKEY_LEN * 2) {
        throw new Error("invalid privateKey")
    }
    const curve = new EC(CURVE)
    const keypair = curve.keyFromPrivate(privateKeyHex, "hex")
    const unencodedPubKey = keypair.getPublic().encode("hex", false)
    return unencodedPubKey
}

/**
 * Gets an address from a public key hex.
 * 
 * @param {string} publicKeyHex the public key hexstring
 * @param {string?} prefix the address prefix
 * 
 * @return {string}
 */
export const getAddressFromPublicKey = (publicKeyHex, prefix) => {
    const pubKey = ec.keyFromPublic(publicKeyHex, "hex")
    const pubPoint = pubKey.getPublic()
    const compressed = pubPoint.encodeCompressed()
    const hexed = ab2hexstring(compressed)
    const hash = sha256ripemd160(hexed) // https://git.io/fAn8N
    const address = encodeAddress(hash, prefix)
    return address
}

/**
 * Encodes an address from input data bytes.
 * 
 * @param {string | Buffer} value the public key to encode
 * @param {string?} prefix the address prefix
 * @param {BufferEncoding} type the output type (default: hex)
 * 
 * @return {string}
 */
export const encodeAddress = (value, prefix = "tbnb", type = "hex") => {
    /** @type {number[]} */
    let words;
    if (Buffer.isBuffer(value)) {
        words = bech32.toWords(Buffer.from(value))
    } else {
        words = bech32.toWords(Buffer.from(value, type))
    }
    return bech32.encode(prefix, words)
}
