const Action = require("./action");
const { getFormattedName } = require("./utils");


// running every day for default
const task = cron.schedule('0 0 * * *', () => { 
    // call backup task
    (async () => {
        try {            
            const formattedName = getFormattedName(config.dbName)
            const backupName = await Action.dumpDatabase(formattedName);        
            const resUpload = await Action.copyBackupToS3(backupName);
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
})

function launch() {
    setTimeout(launch, 10000);
}

console.log("backup daemon is running...");
launch();