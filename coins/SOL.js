const MAX_PRIVATE_KEY = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140n;

import * as solanaWeb3 from '@solana/web3.js';
import ed25519 from "noble-ed25519"

import { generateRandomBigInt } from "./support";

export default async () => {
    let solanaConnection = new solanaWeb3.Connection(
        //solanaWeb3.clusterApiUrl("mainnet-beta"), 
        "https://solana-api.projectserum.com",
        "confirmed"
    );

    return {
        short: "SOL",
        name: "Solana",
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
                let privateByte = Uint8Array.from(
                    privateKey
                        .toString(16)
                        .padStart(64, "0")
                        .match(/[0-9a-fA-F]{2}/g)
                        .map(x => parseInt(x, 16))
                );

                // TweetNaCl requires 64-byte secret key (what?), which is 32-byte private key
                // joined with 32-byte public key.
                let publicByte = await ed25519.getPublicKey(privateByte);

                let keyPair = solanaWeb3.Keypair.fromSecretKey(
                    Uint8Array.from([
                        ...privateByte,
                        ...publicByte
                    ])
                );

                rows.push(new Promise(async function getData(r) {
                    let balance = await solanaConnection.getBalance(keyPair.publicKey);
                    let address = keyPair.publicKey.toString();

                    r([
                        (i + 1) + ".",
                        "[" + keyPair.secretKey.toString() + "]",
                        `<a href="https://explorer.solana.com/address/${address}" target="_blank">${address}</a>`,
                        balance.toFixed(9)
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
