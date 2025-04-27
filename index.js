const cron = require("node-cron");
const util = require('node:util');
const path = require('node:path');
require("dotenv").config();
const archiver = require("archiver");
const fs = require('node:fs');
const s3Wasabi = require('./lib/s3');
const { config } = require("./config");
const exec = util.promisify(require('node:child_process').exec);
const { Command } = require('commander');
const Log = require("./lib/log");
const { spawn } = require("node:child_process");
const LocalData = require("./lib/localData");

const program = new Command();
const localData = new LocalData();

program
    .name("backupdb")
    .description("Backup mongoose db into wasabi s3")
    .version("1.0.0");

program.command("now")
    .description("Run a backup of a database now")
    .option("-n, --name <value>", "set the name of the database backup")
    .option("-w, --wasabi", "also send a backup to wasabi")
    .action(backupManually);

program.command("start")
    .description("Start the service backup")
    .action(startDaemon);

program.command("status")
    .description("Check status of service backup")
    .action(statusDaemon);

program.command("stop")
    .description("Stop the service backup")
    .action(stopDaemon);

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
    try {
        const createBucket = await s3Wasabi.createBucketIfNotExists({ bucket: config.wasabi.bucketName });
        if (createBucket) 
            console.log("Creating wasabi bucket with success");
    } catch(error) {
        console.log("Error creating Wasabi bucket: ", error.message);
    }
}

init();

const logFile = new Log("backup.log");

async function startDaemon() {
    try {
        const daemonOut = fs.openSync('./log/daemon.log', 'a');
        const daemonErr = fs.openSync('./log/daemon.error');
        const daemon = spawn("node", [ "./lib/daemon" ], {
            detached: true,
            stdio: [ 'ignore', daemonOut, daemonErr ]
        });
        daemon.unref();
        localData.save(daemon.pid);
    } catch (error) {
        console.log("Error starting daemon: ", error.message)
    }
}

async function statusDaemon() {
    try {
        const pid = localData.read();
        if (!pid) {
            throw Error("not active")
        }
        process.kill(pid, 0);
        console.log("Service backup status: [active]");
    } catch(_err) {
        console.log("Service backup status: [not active]");
    }
}

async function stopDaemon() {
    try {
        const pid = localData.read();
        if (!pid) {
            console.log("The backup service is not running")
        }
        process.kill(pid, "SIGTERM");
    } catch(_err) { 
        console.log("Error when trying to stop service backup");
    }
}

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

