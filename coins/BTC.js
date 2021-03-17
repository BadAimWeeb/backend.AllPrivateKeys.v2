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
        short: "BTC",
        name: "Bitcoin",
        pageHandler: async (page, count) => {
            if (count > 100 || count <= 0) return null;

            let p = BigInt(page);
            let rows = [];
            let xp = (MAX_PRIVATE_KEY / BigInt(count));
            if (xp * BigInt(count) < MAX_PRIVATE_KEY) xp += 1n;

            if (p <= 0n || p > xp) {
                p = generateRandomBigInt(1n, (MAX_PRIVATE_KEY / BigInt(count)));
            }

            let w3pbp = {};
            for (let i = 0; i < count; i++) {
                let private = ((p - 1n) * BigInt(count)) + 1n + BigInt(i);
                if (private > MAX_PRIVATE_KEY) break;
                let privateString = private.toString(16).padStart(64, "0");
                let privateBuffer = Buffer.from(privateString, "hex");

                let ec = BTC.ECPair.fromPrivateKey(privateBuffer);

                rows.push(new Promise(async r => {
                    let rp = () => {};
                    let rData = new Promise(x => { rp = x; });1

                    let address = BTC.payments.p2pkh({ pubkey: ec.publicKey }).address;
                    w3pbp[address] = rp;

                    let r3 = await rData;

                    let formattedBalance = (r3.balance / 1e+8).toFixed(8);
                    let txn = r3.txn;

                    r([
                        (i + 1) + ".",
                        ec.toWIF(),
                        `<a href="https://www.blockchain.com/btc/address/${address}" target="_blank">${address}</a>`,
                        formattedBalance,
                        txn.toString()
                    ]);
                }));
            }

            let url = `https://blockchain.info/multiaddr?n=0&active=${encodeURIComponent(Object.keys(w3pbp).join("|"))}`;
            let r = await (await fetch(url)).json();
            for (let a of r.addresses) {
                w3pbp[a.address]({
                    balance: a.final_balance,
                    txn: a.n_tx
                });
            }

            return {
                header: [
                    "No.",
                    "WIF/Private key",
                    "Address",
                    "Balance",
                    "TX.n"
                ],
                rows: await Promise.all(rows),
                page: p.toString(),
                maxPage: xp.toString()
            }
        }
    }
}
