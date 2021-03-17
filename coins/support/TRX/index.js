const crypto = require("crypto");
const { keccak_256 } = require("js-sha3");
const { encode58 } = require("./base58");

const ADDRESS_PREFIX = '41'

const generateKeys = private => {
    const ecdh = crypto.createECDH('secp256k1');
    if (private) {
        ecdh.setPrivateKey(private, "hex");
    } else {
        ecdh.generateKeys();
    }
    return { publicKey: ecdh.getPublicKey('hex'), privateKey: ecdh.getPrivateKey('hex') }
}

const computeAddress = (publicKey) => {
    let pubBytes = [...Buffer.from(publicKey, 'hex')]
    if (pubBytes.length === 65) pubBytes = pubBytes.slice(1)

    const hash = keccak_256(pubBytes)
    let addressHex = hash.substring(24)
    addressHex = ADDRESS_PREFIX + addressHex

    return addressHex
}

const getBase58CheckAddress = address => {
    const hash = sha256(sha256(address))
    const checkSum = hash.substr(0, 8)
    const fullAddress = Buffer.from(address + checkSum, 'hex')

    return encode58(fullAddress)
}

const sha256 = msg => crypto.createHash('sha256').update(Buffer.from(msg, 'hex')).digest('hex');

const getAddress = private => {
    let { publicKey } = generateKeys(private);
    let addressBytes = computeAddress(publicKey);

    return getBase58CheckAddress(addressBytes);
}

module.exports = {
    generateKeys,
    computeAddress,
    getBase58CheckAddress,
    sha256,
    getAddress
}
