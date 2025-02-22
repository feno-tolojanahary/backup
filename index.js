const cron = require("node-cron");
const util = require('node:util');
const path = require('node:path')
const s3Wasabi = require('./lib/s3');
const { config } = require("./config");
const exec = util.promisify(require('node:child_process').exec);

// running every day for default
const task = cron.schedule('0 0 * * *', async () => { 
    // call backup task
    try {
        const backupName = await dumpDatabase();
        const resUpload = await copyBackupToS3(backupName);
        if (resUpload) {
            console.log("backup to s3 successfully")
        }
    } catch(error) {
        console.log(error)
    }
})

task.start();


const getFormattedName = (name, date = new Date()) => {
    const year = date.getFullYear(), month = date.getMonth(), day = date.getDay(),
        hour = date.getHours(), minutes = date.getMinutes(), seconds = date.getSeconds();

    return `${name}_${year}-${month}-${day}-${hour}-${minutes}-${seconds}`;
}

async function dumpDatabase() {
    const formattedName = getFormattedName(config.dbName)
    const { stdout } = exec(`mongodump --db ${config.dbName} -o ${formattedName}`, 
                                    { cwd: config.workingDirectory })
    if (!stdout) return "";
    return formattedName;
}

function copyBackupToS3 (fileName) {
    const filePath = path.join(config.workingDirectory, fileName);
    return s3Wasabi.uploadFile(filePath);
}



