require("dotenv").config();
const net = require("net");
const fs = require("fs");
const Action = require("../lib/action");
const { getFormattedName, IPC_PATH } = require("../lib/utils");
const cron = require("node-cron");
const dbDriver = require("../lib/dbdriver");
const remoteS3 = require("../lib/remoteS3");
const { config } = require("../config");
const { sendToRemoteServers, hasConnectedServers } = require("../lib/remote/remoteHandler");
const vaultSession = require("../lib/encryption/vaultSession");
const { derivePasswordKey, deriveMasterKey, decryptDataPath, generateVaultFile } = require("../lib/encryption/cryptoTools"); 
const jobService = require("../lib/db/jobService");
const MongodbManager = require("../lib/dbdriver");
const { resolveMongodbConf, searchConfig } = require("../lib/helper/mapConfig");
const { execMongoJob } = require("../lib/jobAction");
const backupService = require("../lib/db/backupService");
const RemoteHost = require("../lib/remote/remoteHost");

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

const retentionTask = cron.schedule("0 * * * *", async () => {
    try {
        const jobs = await jobService.getRentetionJobs();
        const remoteInstances = new Map();
        for (const job of jobs) {
            try {
                // Connect remote host in advance
                const destinations = job.destinations;
                for (const destConfName of destinations) {
                    const confDest = searchConfig(destConfName);
                    try {
                        if (confDest.type === "ssh" && !remoteInstances.has(destConfName)) {
                            const remoteHost = new RemoteHost(confDest);
                            await remoteHost.connect();
                            remoteInstances.set(destConfName, remoteHost);
                        }
                    } catch (error) {
                        console.log("Error when connecting to the host %s. Error: %s ", `${confDest.username}@${confDest.host}`, error.message)
                    }
                }
                await backupService.deleteExpiredBackupByJob(job, remoteInstances);
            } catch (error) {
                console.log("Error when remove old retention for job %. Error: %s ", job.name, error.message)
            }
        }
        // Disconnect all remote host
        if (remoteInstances.size > 0) {
            for (const remoteHost of remoteInstances.values()) {
                try {
                    await remoteHost.disconnect();
                } catch (err) {}
            }
        }
    } catch (error) {
        console.log("Error when launching cleanup old backup: ", error.message);
    }
})

retentionTask.start();

let wakeUpTimer = null;

const launchSchedule = async () => {
    try {
        if (wakeUpTimer) clearTimeout(wakeUpTimer);
        const runJobs = await jobService.getNextRunJob(Date.now() / 1000);
        if (runJobs && runJobs.length > 0) {
            // Execute jobs
            for (const job of runJobs) {
                await execMongoJob(job)
            }
        }
        const nextJob = await jobService.getNextToLaunch();
        if (!nextJob) {
            return;
        }
        const nextTimer = Math.max(Number(nextJob.next_run_at) * 1000 - Date.now(), 1000) ;
        wakeUpTimer = setTimeout(launchSchedule, nextTimer);
    } catch (error) {
        console.log("Error wake up schedule: ", error.message);
    }
}

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