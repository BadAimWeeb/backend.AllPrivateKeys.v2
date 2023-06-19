const MAX_PRIVATE_KEY = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140n;
import BTC from "bitcoinjs-lib";
import fetch from "node-fetch";

import { generateRandomBigInt } from "./support/index.js";

export default async () => {
    return {
        short: "BTC_SW",
        name: "Bitcoin\xA0(SegWit)",
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

            let w3pbp = {};
            for (let i = 0; i < count; i++) {
                let privateKey = ((p - 1n) * BigInt(count)) + 1n + BigInt(i);
                if (privateKey > MAX_PRIVATE_KEY) break;
                let privateString = privateKey.toString(16).padStart(64, "0");
                let privateBuffer = Buffer.from(privateString, "hex");

                let ec = BTC.ECPair.fromPrivateKey(privateBuffer);

                rows.push(new Promise(async r => {
                    let rp = () => {};
                    let rData = new Promise(x => { rp = x; });1

                    let { address } = BTC.payments.p2sh({ 
                        redeem: BTC.payments.p2wpkh({ pubkey: ec.publicKey }) 
                    });
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
