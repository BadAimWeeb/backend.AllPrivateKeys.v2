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
import BTC from "bitcoinjs-lib";
import fetch from "node-fetch";

import { generateRandomBigInt } from "./support";

export default async () => {
    return {
        short: "DOGE",
        name: "Dogecoin",
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
                let privateBuffer = Buffer.from(privateString, "hex");

                let ec = BTC.ECPair.fromPrivateKey(privateBuffer, {
                    network: DOGECOIN
                });
                let address = BTC.payments.p2pkh({ pubkey: ec.publicKey, network: DOGECOIN }).address;

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
