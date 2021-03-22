const MAX_PRIVATE_KEY = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140n;
import fetch from "node-fetch";
import { getAddress } from "./support/TRX";

import { generateRandomBigInt } from "./support";

export default async () => {
    return {
        short: "TRX",
        name: "TRON",
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

                    let formattedBalance = "";
                    {
                        let paddedBalance = j.balance.toString().padStart(7, "0");
                        let tr = paddedBalance.slice(0, -6);
                        let frac = paddedBalance.slice(-6);

                        formattedBalance = tr + "." + frac;
                    }
                    let txn = j.totalTransactionCount;

                    r([
                        (i + 1) + ".",
                        privateString,
                        `<a href="https://tronscan.org/#/address/${address}" target="_blank">${address}</a>`,
                        formattedBalance,
                        txn.toString()
                    ]);
                }));
            }

            return {
                header: [
                    "No.",
                    "Private key",
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
