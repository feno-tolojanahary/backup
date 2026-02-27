const fs = require('node:fs');
const net = require("net");
const { config } = require("./../config");
const { spawn } = require("node:child_process");
const { IPC_PATH } = require("../lib/helper/utils")

function isDaemonStarted () {
    return new Promise((resolve) => {
        const socket = net.createConnection(IPC_PATH);
        socket.once("connect", () => {
            socket.destroy();
            resolve(true);
        })
        socket.once("error", () => {
            resolve(false)
        })
    })
}

async function startDaemon({exitAfterStart = true} = {}, cb = () => {}) {
    try {
        if (await isDaemonStarted()) {
            console.log("Service backup already active.");
            process.exit(0);
        }
        const daemonOut = fs.openSync(config.daemonOut, 'a');
        const daemonErr = fs.openSync(config.daemonErr, 'a');
        const daemon = spawn("node", [ "./server/daemon" ], {
            detached: true,
            stdio: [ 'ignore', daemonOut, daemonErr ]
        });
        daemon.unref();
        console.log("Backup service started.");
        if (typeof cb === "function") cb();
    } catch (error) {
        console.log("Error starting daemon: ", error.message)
        if (typeof cb === "function") cb(error);
    }
    if (exitAfterStart) process.exit(0);
}

async function statusDaemon() {
    if (await isDaemonStarted()) 
        console.log("Service backup status: [active]");
    else 
        console.log("Service backup status: [not active]");
    process.exit(0);
}

async function stopDaemon() {
    const socket = net.createConnection(IPC_PATH);
    socket.on("connect", () => {
        socket.write(JSON.stringify({ action: "shutdown" }))
        console.log("Service backup stopped.");
    });
    socket.on("error", () => {
        console.log("The backup service is not running.");
    })
}

module.exports = {
    startDaemon,
    statusDaemon,
    stopDaemon,
    isDaemonStarted
}