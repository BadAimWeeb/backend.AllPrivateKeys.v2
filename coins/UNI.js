const MAX_PRIVATE_KEY = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140n;
const WSURL = "wss://mainnet.infura.io/ws/v3/67f1c4a06fa74fc18e722b748cf0348a";
const CONTRACT = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";

import { Web3 } from "web3";
let web3 = new Web3();

var tokenContract = new web3.eth.Contract([
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "type": "function"
    }
], CONTRACT);

web3.setProvider(new Web3.providers.WebsocketProvider(WSURL));

import { generateRandomBigInt } from "./support";

export default async () => {
    return {
        short: "UNI",
        name: "Uniswap\xA0(ETH\xA0ERC-20)",
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

                let account = web3.eth.accounts.privateKeyToAccount(privateString);
                let address = account.address;

                rows.push(new Promise(async function getData(r) {
                    try {
                        let ar = await tokenContract.methods.balanceOf(address).call();

                        let formattedBalance = "";
                        {
                            let paddedBalance = ar.toString().padStart(19, "0");
                            let ether = paddedBalance.slice(0, -18);
                            let frac = paddedBalance.slice(-18);

                            formattedBalance = ether + "." + frac;
                        }

                        r([
                            (i + 1) + ".",
                            privateString,
                            `<a href="https://etherscan.io/token/${CONTRACT}?a=${address}" target="_blank">${address}</a>`,
                            formattedBalance
                        ]);
                    } catch {
                        web3.setProvider(new Web3.providers.WebsocketProvider(WSURL));
                        getData(r)
                    }
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
