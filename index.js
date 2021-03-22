(async () => {
    process.on("uncaughtException", console.log);
    process.on("unhandledRejection", console.log);

    const io = await import("socket.io");
    const express = await import("express");
    const http = await import("http");

    const supportedCoins = await Promise.all(
        ["BTC", "BTC_SW", "ETH", "ETC", "TRX", "USDT_TRX", "DOGE", "DOGE_SW", "BNB"]
            .map(async x => (await import("./coins/" + x))())
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
        return res.json("AllPrivateKeys v2 Resolver Service - i5");
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