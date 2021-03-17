const MAX_PRIVATE_KEY = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd036413fn;
const fetch = require("node-fetch");

const { getAddress } = require("./support/TRX");

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
        short: "UDST_TRX",
        name: "USDT\xA0(TRON\xA0TRC-20)",
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
                let privateKey = private.toString(16).padStart(64, "0");

                let address = getAddress(privateKey);

                rows.push(new Promise(async r => {
                    let j;
                    for (; ;) {
                        try {
                            j = await (await fetch(`https://apilist.tronscan.org/api/account?address=${address}`)).json();
                            break;
                        } catch {}
                    }

                    let token = j.tokens.find(t => t.tokenId === "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t") ?? { balance: 0 };
                    let formattedBalance = "";
                    {
                        let paddedBalance = token.balance.toString().padStart(7, "0");
                        let tr = paddedBalance.slice(0, -6);
                        let frac = paddedBalance.slice(-6);

                        formattedBalance = tr + "." + frac;
                    }

                    r([
                        (i + 1) + ".",
                        privateKey,
                        `<a href="https://tronscan.org/#/address/${address}" target="_blank">${address}</a>`,
                        formattedBalance
                    ]);
                }));
            }

            return {
                header: [
                    "No.",
                    "Private key",
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
