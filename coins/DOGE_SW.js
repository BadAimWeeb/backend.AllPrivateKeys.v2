const DOGECOIN = {
    messagePrefix: '\x19Dogecoin Signed Message:\n',
    bech32: 'doge',
    bip32: {
        public: 0x0827421e,
        private: 0x089944e4,
    },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e,
}

const MAX_PRIVATE_KEY = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140n;
const BTC = require("bitcoinjs-lib");
const fetch = require("node-fetch");

/** Generates BigInts between low (inclusive) and high (exclusive) */
function generateRandomBigInt(lowBigInt, highBigInt) {
    if (lowBigInt >= highBigInt) {
        throw new Error('lowBigInt must be smaller than highBigInt');
    }

    const difference = highBigInt - lowBigInt;
    const differenceLength = difference.toString().length;
    let multiplier = '';
    while (multiplier.length < differenceLength) {
        multiplier += Math.random()
            .toString()
            .split('.')[1];
    }
    multiplier = multiplier.slice(0, differenceLength);
    const divisor = '1' + '0'.repeat(differenceLength);

    const randomDifference = (difference * BigInt(multiplier)) / BigInt(divisor);

    return lowBigInt + randomDifference;
}

module.exports = async () => {
    return {
        short: "DOGE_SW",
        name: "Dogecoin (SegWit)",
        pageHandler: async (page, count) => {
            if (count > 100 || count <= 0) return null;

            let p = BigInt(page);
            let rows = [];
            let xp = (MAX_PRIVATE_KEY / BigInt(count));
            if (xp * BigInt(count) < MAX_PRIVATE_KEY) xp += 1n;

            if (p <= 0n || p > xp) {
                p = generateRandomBigInt(1n, (MAX_PRIVATE_KEY / BigInt(count)));
            }

            for (let i = 0; i < count; i++) {
                let private = ((p - 1n) * BigInt(count)) + 1n + BigInt(i);
                if (private > MAX_PRIVATE_KEY) break;
                let privateString = private.toString(16).padStart(64, "0");
                let privateBuffer = Buffer.from(privateString, "hex");

                let ec = BTC.ECPair.fromPrivateKey(privateBuffer, {
                    network: DOGECOIN
                });
                let address = BTC.payments.p2sh({ 
                    redeem: BTC.payments.p2wpkh({ pubkey: ec.publicKey, network: DOGECOIN }),
                    network: DOGECOIN
                }).address;

                rows.push(new Promise(async r => {
                    let j;
                    for (; ;) {
                        try {
                            j = await (await fetch(`https://dogechain.info/api/v1/address/balance/${address}`)).json();
                            break;
                        } catch { }
                    }

                    let formattedBalance = "";
                    {
                        let s = j.balance.split(".");
                        formattedBalance = s[0] + "." + s[1].padEnd(8, "0");
                    }

                    r([
                        (i + 1) + ".",
                        ec.toWIF(),
                        `<a href="https://dogechain.info/address/${address}" target="_blank">${address}</a>`,
                        formattedBalance
                    ]);
                }));
            }

            return {
                header: [
                    "No.",
                    "WIF/Private key",
                    "Address",
                    "Balance"
                ],
                rows: await Promise.all(rows),
                page: p.toString(),
                maxPage: xp.toString()
            }
        }
    }
}
