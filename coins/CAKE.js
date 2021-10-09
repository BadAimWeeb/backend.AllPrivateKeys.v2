const MAX_PRIVATE_KEY = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140n;
const WSURL = [
    "https://bsc-dataseed1.binance.org/",
    "https://bsc-dataseed2.binance.org/",
    "https://bsc-dataseed3.binance.org/",
    "https://bsc-dataseed4.binance.org/",
    "https://bsc-dataseed1.defibit.io/",
    "https://bsc-dataseed2.defibit.io/",
    "https://bsc-dataseed3.defibit.io/",
    "https://bsc-dataseed4.defibit.io/",
    "https://bsc-dataseed1.ninicoin.io/",
    "https://bsc-dataseed2.ninicoin.io/",
    "https://bsc-dataseed3.ninicoin.io/",
    "https://bsc-dataseed4.ninicoin.io/"
];
const CONTRACT = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";

import Web3 from "web3";
let web3 = new Web3();

import { generateRandomBigInt } from "./support";

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

web3.setProvider(new Web3.providers.HttpProvider(WSURL[Number(generateRandomBigInt(0n, BigInt(WSURL.length)))]));

export default async () => {
    return {
        short: "CAKE",
        name: "PancakeSwap\xA0(BNB\xA0BEP-20)",
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

                //let address = getAddressFromPrivateKey(privateString);
                let account = web3.eth.accounts.privateKeyToAccount(privateString);
                let address = account.address;

                rows.push(new Promise(async function getData(r) {
                    try {
                        let ar = await tokenContract.methods.balanceOf(address).call();

                        let formattedBalance = "";
                        {
                            let paddedBalance = ar[0].padStart(19, "0");
                            let ether = paddedBalance.slice(0, -18);
                            let frac = paddedBalance.slice(-18)

                            formattedBalance = ether + "." + frac;
                        }

                        r([
                            (i + 1) + ".",
                            privateString,
                            `<a href="https://www.bscscan.com/token/${CONTRACT}?a=${address}" target="_blank">${address}</a>`,
                            formattedBalance
                        ]);
                    } catch (e) {
                        web3.setProvider(new Web3.providers.HttpProvider(WSURL[Number(generateRandomBigInt(0n, BigInt(WSURL.length)))]));
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