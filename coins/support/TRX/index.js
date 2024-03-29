import crypto from "crypto";
import sha3 from "js-sha3";
const { keccak_256 } = sha3;
import { encode58 } from "./base58.js";

const ADDRESS_PREFIX = '41'

export const generateKeys = privateKey => {
    const ecdh = crypto.createECDH('secp256k1');
    if (privateKey) {
        ecdh.setPrivateKey(privateKey, "hex");
    } else {
        ecdh.generateKeys();
    }
    return { publicKey: ecdh.getPublicKey('hex'), privateKey: ecdh.getPrivateKey('hex') }
}

export const computeAddress = (publicKey) => {
    let pubBytes = [...Buffer.from(publicKey, 'hex')]
    if (pubBytes.length === 65) pubBytes = pubBytes.slice(1)

    const hash = keccak_256(pubBytes)
    let addressHex = hash.substring(24)
    addressHex = ADDRESS_PREFIX + addressHex

    return addressHex
}

export const getBase58CheckAddress = address => {
    const hash = sha256(sha256(address))
    const checkSum = hash.substr(0, 8)
    const fullAddress = Buffer.from(address + checkSum, 'hex')

    return encode58(fullAddress)
}

export const sha256 = msg => crypto.createHash('sha256').update(Buffer.from(msg, 'hex')).digest('hex');

export const getAddress = privateKey => {
    let { publicKey } = generateKeys(privateKey);
    let addressBytes = computeAddress(publicKey);

    return getBase58CheckAddress(addressBytes);
}
