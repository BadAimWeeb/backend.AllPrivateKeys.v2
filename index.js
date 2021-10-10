import thisPkg from "./package.json";
import * as io from "socket.io";
import express from "express";
import http from "http";
import semver from "semver";

(async () => {
    let thisPkgVersion = semver.parse(thisPkg.version);

    process.on("uncaughtException", console.log);
    process.on("unhandledRejection", console.log);

    const supportedCoins = await Promise.all(
        [
            "BTC", "BTC_SW", "ETH", "ETC", "DOGE", "DOGE_SW", "BNB", 
            "TRX", "USDT_TRX", "USDT_ETH", "BUSD-T_BNB", "TUSD", "USDC", 
            "BAT", "ZRX", "SOL", "CAKE"
        ]
            .map(async x => await (await import(`./coins/${x}.js`)).default())
    );

    console.log("loaded coins");

    const app = express();
    app.get("/apksocketping", (req, res) => {
        switch (req.query.mode) {
            case "socket":
                res.status(200).setHeader("Access-Control-Allow-Origin", "*");
                return res.json({ ok: true });
            default:
                res.status(400).setHeader("Access-Control-Allow-Origin", "*");
                return res.json({ error: "mode not supported" });
        }
    });

    app.get("/", (req, res) => {
        res.status(200).setHeader("Access-Control-Allow-Origin", "*");
        return res.json(`AllPrivateKeys v2 Resolver Service - i${thisPkgVersion.minor}${thisPkgVersion.patch ? "." + thisPkgVersion.patch : ""}`);
    });

    const server = http.createServer(app);

    const WSIO = new io.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        },
        path: "/apksocket"
    });

    const WSIOAPK = WSIO.of("/apksocket");
    WSIOAPK.on(
        "connection",
        /**
         * @param {io.Socket} socket Socket
         */
        socket => {
            socket.on("message", async (method, ...data) => {
                let ack = data.pop();
                try {
                    switch (method) {
                        case "query_supported_coin":
                            ack(supportedCoins.map(c => ({
                                short: c.short,
                                name: c.name
                            })));
                            break;
                        case "query_page":
                            if (typeof data[0] === "string" && (supportedCoins.map(x => x.short).indexOf(data[0]) + 1)) {
                                ack(await supportedCoins.find(x => x.short === data[0]).pageHandler(data[1], data[2]));
                            } else ack(null);
                            break;
                        case "service_version":
                            ack({
                                iter: thisPkgVersion.minor,
                                patch: thisPkgVersion.patch
                            }); break;
                        default:
                            ack(null);
                    }
                } catch (e) {
                    ack(null, e?.message ?? e);
                }
            });
        }
    );

    console.log("created socket");

    server.listen(process.env.PORT || 3000);

    console.log("listening");
})();