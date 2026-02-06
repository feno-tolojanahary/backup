require("dotenv").config();
const net = require("net");
const fs = require("fs");
const Action = require("../lib/action");
const { getFormattedName, IPC_PATH } = require("../lib/utils");
const cron = require("node-cron");
const dbDriver = require("../lib/dbdriver");
const s3Handler = require("../lib/s3Handler");
const { config } = require("../config");
const { sendToRemoteServers, hasConnectedServers, removeOverFlowFileServers } = require("../lib/remote/remoteHandler");
const { s3Log, hostLog } = require("../lib/backupLog");
const vaultSession = require("../lib/encryption/vaultSession");
const { derivePasswordKey, deriveMasterKey } = require("../lib/encryption/cryptoTools") 

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
                pk.fill(0);
                vaultSession.unlock(mk);
                mk.fill(0);
                reply({ success: true })
            } catch (err) {
                reply({ success: false })
            }
        }

        if (action === "newpass_unlock") {
            const passwordKey = await generateVaultFile(payload.password);
            // unlock vault
            const masterKey = await deriveMasterKey(passwordKey);
            passwordKey.fill(0);
            vaultSession.unlock(masterKey);
            masterKey.fill(0);
            reply({ success: true })
        }

        if (action === "lock") {
            vaultSession.lock();
            socket.end(JSON.stringify({ success: true }))
        }

        if (action === "export") {
            const dbName = payload;
            const dataDump = await dbDriver.dumpMongoDb(dbName);
            reply({ success: true, payload: dataDump })
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
            console.log("start backup file")
            const formattedName = getFormattedName(config.dbName);
            console.log("formattedName: ", formattedName)
            const backupFile = await dbDriver.dumpMongoDb(formattedName);        
            const resUpload = await s3Handler.copyBackupToS3(backupFile.name);
            if (resUpload) {
                const dataLog = {
                    name: backupFile.name,
                    size: backupFile.size,
                    storage: "wasabi",
                    modifiedAt: new Date()
                }
                await s3Log.objLog(dataLog);
                console.log("backing up file to wasabi done");
            }
            if ((await hasConnectedServers())) {
                await removeOverFlowFileServers({ newUploadSize: backupFile.size });
                const resRemote = await sendToRemoteServers(backupFile.name);
                if (resRemote) {
                    const dataLogRemote = {
                        name: backupFile.name,
                        size: backupFile.size,
                        storage: "remote",
                        modifiedAt: new Date()
                    }
                    await hostLog.objLog(dataLogRemote);
                    console.log("backing up file to a remote server done");
                }
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

// function launch() {
//     setTimeout(launch, 10000);
// }

// launch();  