const net = require("net");
const { IPC_PATH } = require("./../utils");


exports.sendIpcRequest = (message) => {
    return new Promise((resolve, reject) => {
        const socket = net.createConnection(IPC_PATH);

        let response = "";

        socket.on("connect", () => {
            socket.write(JSON.stringify(message));
        })

        socket.on("data", (chunk) => {
            response += chunk.toString();
        })

        socket.on("end", () => {
            try {
                resolve(JSON.parse(response));
            } catch {
                reject(new Error("Invalid IPC response"));
            }
        })
    })
}

exports.ipcServerAlive = () => {
    return new Promise((resolve) => {
        const socket = net.createConnection(IPC_PATH);

        socket.on("connect", () => {
            resolve(true)
        })

        socket.on("error", () => {
            resolve(false)
        })
    })
}