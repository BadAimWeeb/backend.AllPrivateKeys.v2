const MAX_SEED = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;

//import bip39 from "bip39";
import * as polkaUtil from "@polkadot/util-crypto";
import { ApiPromise as polkaAPI, WsProvider } from '@polkadot/api';

import { generateRandomBigInt } from "./support/index.js";

export default async () => {
    const wsProvider = new WsProvider('wss://rpc.polkadot.io');
    const api = await polkaAPI.create({ provider: wsProvider });

    return {
        short: "DOT",
        name: "Polkadot",
        pageHandler: async (page, count) => {
            try {
                if (count > 100 || count <= 0) return null;

                let p;
                let xp = (MAX_SEED / BigInt(count));
                if (xp * BigInt(count) < MAX_SEED) xp += 1n;

                if (!isNaN(parseFloat(page))) {
                    p = BigInt(page);

                    if (p <= 0n || p > xp) {
                        p = generateRandomBigInt(1n, (MAX_SEED / BigInt(count)));
                    }
                } else {
                    p = generateRandomBigInt(1n, (MAX_SEED / BigInt(count)));
                }

                let data = [];

                for (let i = 0; i < count; i++) {
                    let bip39seed = ((p - 1n) * BigInt(count)) + 1n + BigInt(i);
                    if (bip39seed > MAX_SEED) break;

                    let seedUint = Uint8Array.from([
                        ...Buffer.from(
                            bip39seed.toString(16).padStart(64, "0"),
                            "hex"
                        )
                    ]);

                    //let mnemonic = bip39.entropyToMnemonic(Buffer.from(bip39seed.toString(16), "hex"));
                    let { publicKey, secretKey: privateKey } = polkaUtil.schnorrkelKeypairFromSeed(seedUint);

                    let address = polkaUtil.encodeAddress(publicKey, 0);

                    data.push([
                        address,
                        [
                            (i + 1) + ".",
                            "0x" + bip39seed.toString(16).padStart(64, "0"),
                            `<a href="https://polkascan.io/polkadot/account/${address}" target="_blank">${address}</a>`,
                        ]
                    ]);
                }

                let ar = await api.query.system.account.multi(data.map(x => x[0]));

                return {
                    header: [
                        "No.",
                        "Seed",
                        "Address (SR25519)",
                        "Balance"
                    ],
                    rows: data.map((x, i) => {
                        let balanceFree = ar[i].data.free;

                        let paddedBalance = balanceFree.toString().padStart(11, "0");
                        let full = paddedBalance.slice(0, -10);
                        let frac = paddedBalance.slice(-10);

                        return [...x[1], full + "." + frac];
                    }),
                    page: p.toString(),
                    maxPage: xp.toString()
                }
            } catch (e) {
                console.log(e);
                throw e;
            }
        }
    }
}
