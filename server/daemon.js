require("dotenv").config();
const net = require("net");
const fs = require("fs");
const Action = require("../lib/action");
const { getFormattedName, IPC_PATH } = require("../lib/utils");
const cron = require("node-cron");
const dbDriver = require("../lib/dbdriver");
const s3Handler = require("../lib/s3Handler");
const { config } = require("../config");
const { sendToRemoteServers, hasConnectedServers } = require("../lib/remote/remoteHandler");
const vaultSession = require("../lib/encryption/vaultSession");
const { derivePasswordKey, deriveMasterKey, decryptDataPath, generateVaultFile } = require("../lib/encryption/cryptoTools") 

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
                const dbName = payload;
                const dataDump = await dbDriver.dumpMongoDb(dbName);
                reply({ success: true, payload: dataDump });
            } catch (err) {
                console.log("Error 'export' event: ", err.message);
                reply({ success: false });
            }
            return;
        }

        if (action === "decrypt") {
            try {
                const filePath = payload;
                const decryptedFilePath = await decryptDataPath(filePath);
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



const cronJob = config.cronJob || '* * * * *';
const task = cron.schedule(cronJob, () => { 
    // call backup task
    (async () => {
        try {           
            if (config.useEncryption) {
                try {
                    vaultSession.getMasterKey();
                } catch (error) {
                    console.log(error.message);
                    return;
                }
            }
            console.log("start backup file")
            const formattedName = getFormattedName(config.dbName);
            console.log("formattedName: ", formattedName)
            let backupFile;
            if (config.useEncryption) {
                backupFile = await dbDriver.dumpMongoDb(formattedName);        
                await s3Handler.encryptedBackupToS3(backupFile);
            } else {
                backupFile = await dbDriver.plainDumpMongoDb(formattedName);        
                await s3Handler.copyBackupToS3(backupFile);
            }
            if ((await hasConnectedServers())) {
                // await removeOverFlowFileServers({ newUploadSize: backupFile.size });
                await sendToRemoteServers(backupFile, { isDir: config.useEncryption });
            }
            // remove archive
            await Action.removeArchives();
        } catch(error) {
            console.log(error)
        }
    })()
})

task.start();

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