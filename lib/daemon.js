const Action = require("./action");
const { getFormattedName } = require("./utils");
const cron = require("node-cron");
const Log = require("./log");
const dbDriver = require("./dbdriver");
const s3Handler = require("./s3Handler");
const { config } = require("../config");
const { sendToRemoteServers } = require("./remote/remoteHandler");

const logFile = new Log("backup.log");

// running every day for default
const task = cron.schedule('* * * * *', () => { 
    // call backup task
    (async () => {
        try {           
            const trackInfo = { wasabi: false, remote: false };
            const formattedName = getFormattedName(config.dbName)
            const backupName = await dbDriver.dumpMongoDb(formattedName);        
            const resUpload = await s3Handler.copyBackupToS3(backupName);
            if (resUpload) {
                trackInfo.wasabi = true;
                console.log("backing up file to wasabi done");
            }
            const resRemote = await sendToRemoteServers(backupName);
            if (resRemote) {
                trackInfo.remote = true;
                console.log("backing up file to a remote server done");
            }
            await logFile.log(backupName, trackInfo);
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