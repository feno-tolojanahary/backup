require("dotenv").config();
const net = require("net");
const fs = require("fs");
const { IPC_PATH } = require("../lib/utils");
const vaultSession = require("../lib/encryption/vaultSession");
const { derivePasswordKey, deriveMasterKey, decryptDataPath, generateVaultFile } = require("../lib/encryption/cryptoTools"); 
const MongodbManager = require("../lib/dbdriver");
const { resolveMongodbConf } = require("../lib/helper/mapConfig");
const { retentionTask, launchSchedule } = require("./cronJob")

// running every day for default

const handleRequest = (socket) => {
    socket.on("data", async (buf) => {
        const { action, payload } = JSON.parse(buf.toString());
        const reply = (data) => {
            socket.end(JSON.stringify(data));
        }

        if (action === "shutdown") {
            reply({ success: true });
            process.kill(process.pid, "SIGTERM");
            return;
        }

        if (action === "unlock") {
            try { 
                const pk = await derivePasswordKey(payload.password);
                const mk = await deriveMasterKey(pk);
                pk?.fill(0);
                vaultSession.unlock(mk);
                mk?.fill(0);
                reply({ success: true });
                return;
            } catch (err) {
                reply({ success: false });
                return;
            }
        }

        if (action === "newpass_unlock") {
            try {
                const passwordKey = await generateVaultFile(payload.password);
                // unlock vault
                const masterKey = await deriveMasterKey(passwordKey);
                passwordKey?.fill(0);
                vaultSession.unlock(masterKey);
                masterKey?.fill(0);
                reply({ success: true });
            } catch (err) {
                console.log("Error 'newpass_unlock' event: ", err.message)
                reply({ success: false });
            }
            return;
        }

        if (action === "lock") {
            vaultSession.lock();
            socket.end(JSON.stringify({ success: true }));
            return;
        }

        if (action === "export") {
            try {
                const { dbName, source } = payload;
                const mongoManager = new MongodbManager(resolveMongodbConf(source));
                const dataDump = await mongoManager.dumpMongoDb(dbName);
                reply({ success: true, payload: dataDump });
            } catch (err) {
                console.log("Error 'export' event: ", err.message);
                reply({ success: false });
            }
            return;
        }

        if (action === "decrypt") {
            try {
                const dirPath = payload;
                const decryptedFilePath = await decryptDataPath(dirPath);
                reply({ success: true, payload: decryptedFilePath });
            } catch (err) {
                console.log("Error on 'decrypt': ", err.message)
                reply({ success: false });
            }
            return;
        }

        reply({ error: "UNKOWN_COMMAND" })
    })
}

if (process.platform !== "win32" && fs.existsSync(IPC_PATH)) {
    fs.unlinkSync(IPC_PATH);
}

const server = net.createServer(handleRequest);

server.listen(IPC_PATH, () => {
    if (process.platform !== "win32")
        fs.chmodSync(IPC_PATH, 0o600);
    console.log("backup daemon is running...");
});

const tempCodeUnlock = async () => {
    const password = "this is the password of the backup";
    const pk = await derivePasswordKey(password);
    const mk = await deriveMasterKey(pk);
    pk?.fill(0);
    vaultSession.unlock(mk);
}

retentionTask.start();

launchSchedule();

process.on("uncaughException", function (error) {
    console.error(err);
    // launch();
})

const shutdown = () => {
    console.log("received termination");
    server.close(() => {
        if (process.platform !== "win32" && fs.existsSync(IPC_PATH)) 
            fs.unlinkSync(IPC_PATH);
        process.exit(0);
    })
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);