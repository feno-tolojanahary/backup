require("dotenv").config();
const Action = require("./action");
const { getFormattedName } = require("./utils");
const cron = require("node-cron");
const dbDriver = require("./dbdriver");
const s3Handler = require("./s3Handler");
const { config } = require("../config");
const { sendToRemoteServers, hasConnectedServers, removeOverFlowFileServers } = require("./remote/remoteHandler");
const { s3Log, hostLog } = require("./backupLog");

// running every day for default

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
    launch();
})

process.on("SIGTERM", function() {
    console.log("received termination");
    process.exit(0);
})

function launch() {
    setTimeout(launch, 10000);
}

console.log("backup daemon is running...");
launch();           