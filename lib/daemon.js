const Action = require("./action");
const { getFormattedName } = require("./utils");
const cron = require("node-cron");
const Log = require("./log");
const s3Wasabi = require('./helper/s3');
const dbDriver = require("./dbdriver");
const s3Handler = require("./s3Handler");
const { config } = require("../config");


const logFile = new Log("backup.log");

// async function init() {
//     try {
//     } catch(error) {
//         // console.log("Error creating Wasabi bucket: ", error.message);
//         console.log(error)
//     }
// }

// init();

// running every day for default
const task = cron.schedule('* * * * *', () => { 
    // call backup task
    (async () => {
        try {           
            const formattedName = getFormattedName(config.dbName)
            const backupName = await dbDriver.dumpMongoDb(formattedName);        
            const resUpload = await s3Handler.copyBackupToS3(backupName);
            await logFile.log(backupName);
                    if (resUpload) {
                        console.log("backup to s3 successfully")
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