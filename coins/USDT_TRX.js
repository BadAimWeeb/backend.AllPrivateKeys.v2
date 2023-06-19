const MAX_PRIVATE_KEY = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140n;
import fetch from "node-fetch";
import { getAddress } from "./support/TRX/index.js";

import { generateRandomBigInt } from "./support/index.js";

export default async () => {
    return {
        short: "USDT_TRX",
        name: "USDT\xA0(TRON\xA0TRC-20)",
        pageHandler: async (page, count) => {
            if (count > 100 || count <= 0) return null;

            let p;
            let xp = (MAX_PRIVATE_KEY / BigInt(count));
            if (xp * BigInt(count) < MAX_PRIVATE_KEY) xp += 1n;

            if (!isNaN(parseFloat(page))) {
                p = BigInt(page);

                if (p <= 0n || p > xp) {
                    p = generateRandomBigInt(1n, (MAX_PRIVATE_KEY / BigInt(count)));
                }
            } else {
                p = generateRandomBigInt(1n, (MAX_PRIVATE_KEY / BigInt(count)));
            }

            let rows = [];

            for (let i = 0; i < count; i++) {
                let privateKey = ((p - 1n) * BigInt(count)) + 1n + BigInt(i);
                if (privateKey > MAX_PRIVATE_KEY) break;
                let privateString = privateKey.toString(16).padStart(64, "0");

                let address = getAddress(privateString);

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
                        privateString,
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
