const cron = require("node-cron");
const util = require('node:util');
const path = require('node:path');
const { once } = require("node:events");
const archiver = require("archiver");
const fs = require('node:fs');
const s3Wasabi = require('./lib/s3');
const { config } = require("./config");
const exec = util.promisify(require('node:child_process').exec);
const { createInterface } = require("node:readline");
const { Command } = require('commander');
const Log = require("./lib/log");

const program = new Command();

program
    .name("backupdb")
    .description("Backup mongoose db into wasabi s3")
    .version("1.0.0");

program.command("now")
    .description("Run a backup of a database now")
    .option("-n, --name <value>", "set the name of the database backup")
    .option("-w, --wasabi", "also send a backup to wasabi")
    .action(backupManually);

program.parse();

async function init() {
    try {
        if (!fs.existsSync(config.workingDirectory)) {
            fs.mkdirSync(config.workingDirectory);
        }  
        if (!fs.existsSync(config.backupLog)) {
            fs.mkdirSync(config.backupLog);
        }
    } catch(error) {
        console.log("Error creating system backup directories: ", error.message);
    }
}

init();

const logFile = new Log("backup.log")

// running every day for default
const task = cron.schedule('0 0 * * *', () => { 
    // call backup task
    (async () => {
        try {            
            const formattedName = getFormattedName(config.dbName)
            const backupName = await dumpDatabase(formattedName);        
            const resUpload = await copyBackupToS3(backupName);
            await logFile.log(backupName);
                    if (resUpload) {
                        console.log("backup to s3 successfully")
                    }
            // remove archive
            await removeArchives();
        } catch(error) {
            console.log(error)
        }
    })()
})

task.start();

function backupManually (cmd, opts) { 
    (async () => {
        const dbName = opts.opts().name;
        const backupName = await dumpDatabase(dbName);
        await logFile.log(backupName);
        if (opts.opts().wasabi) {   
            const res = await copyBackupToS3(backupName);
            if (res) console.log("sending backup to s3 done")
        }
        process.exit();
    })()
}

function getFormattedName (name, date = new Date()) {
    const year = date.getFullYear(), month = date.getMonth(), day = date.getDay(),
        hour = date.getHours(), minutes = date.getMinutes(), seconds = date.getSeconds();

    return `${name}_${year}-${month}-${day}-${hour}-${minutes}-${seconds}`;
}

async function dumpDatabase(outName) {
    const { stdout, stderr } = await exec(`mongodump --db ${config.dbName} -o ${outName}`, 
                                    { cwd: config.workingDirectory })
    console.log("start dumping database")
    if (stderr) {
        console.log("database backup done ");
        // process.exit(1);
    }
    if (stdout) {
        console.log("dump database: ", stdout);
    }
    // if (!stdout) return "";
    
    const archiveBackup = () => {
        const archiveName = `${outName}.zip`;
        return new Promise((resolve, _reject) => {
           // write backup into archive
            console.log("archive start")
           
            const output = fs.createWriteStream(path.join(config.workingDirectory, archiveName));
            const archive = archiver("zip", { zlib: { level: 9 } });
            archive.directory(path.join(config.workingDirectory, outName), outName);
            output.on("close", () => {
                console.log("archiving file done: " + archiveName)
                resolve(archiveName);
            })
            archive.pipe(output);
            archive.on("error", function (err) {
                console.log("error archiving: ", err.message);
                reject(err);
            });
            archive.on("warning", function (err) {
                if (err.code === "ENOENT") {
                    console.log("warning archiving file: ", err.message)
                } else {
                    // throw error
                    console.log("error archiving: ", err.message);
                    reject(err);
                }
            });
            archive.finalize();
        })
    }
    const archiveName = await archiveBackup();
    return archiveName;
}

async function removeArchives() {
    const lastDateTmp = new Date().getTime() - config.retentionTime*1000;
    const archives = await logFile.getArchiveToRemove(new Date(lastDateTmp));
    const deleteArchiveFunc = archives.map(archive => removeBackupOnS3(archive));
    await Promise.all(deleteArchiveFunc);
}


async function copyBackupToS3 (fileName) {
    try {
        console.log("start backup to wasabi: ", config.workingDirectory)
        const filePath = path.join(config.workingDirectory, fileName);
        const res = await s3Wasabi.uploadFile({ filePath });
        if (res) {
            console.log("uploading file done")
        }
        return res;
    } catch(error) {
        console.log("error backup to wasabi: ", error.message);
        process.exit(1);
    }
}

async function removeBackupOnS3 (name) {
    try {
        const key = name;
        const res = await s3Wasabi.deleteFile(key);
        if (res) {
            console.log(`Removing ${key} on S3 - ok`);
        }
    } catch (error) {
        console.log("error when removing backup on s3");
    }
}

