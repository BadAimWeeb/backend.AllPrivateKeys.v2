const MAX_PRIVATE_KEY = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140n;
const WSURL = "wss://mainnet.infura.io/ws/v3/67f1c4a06fa74fc18e722b748cf0348a";

import Web3, { providers } from "web3";
let web3 = new Web3();

web3.setProvider(new providers.WebsocketProvider(WSURL));

import { generateRandomBigInt } from "./support";

export default async () => {
    return {
        short: "ETH",
        name: "Ethereum",
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

                let account = web3.eth.accounts.privateKeyToAccount(privateString);
                let address = account.address;

                rows.push(new Promise(async function getData(r) {
                    try {
                        let ar = await Promise.all([
                            web3.eth.getBalance(address),
                            web3.eth.getTransactionCount(address)
                        ]);

                        let formattedBalance = "";
                        {
                            let paddedBalance = ar[0].padStart(19, "0");
                            let ether = paddedBalance.slice(0, -18);
                            let frac = paddedBalance.slice(-18);

                            formattedBalance = ether + "." + frac;
                        }

                        r([
                            (i + 1) + ".",
                            privateString,
                            `<a href="https://etherscan.io/address/${address}" target="_blank">${address}</a>`,
                            formattedBalance,
                            ar[1].toString()
                        ]);
                    } catch {
                        web3.setProvider(new providers.WebsocketProvider(WSURL));
                        getData(r)
                    }
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
