
const util = require('node:util');
const path = require('node:path');
const archiver = require("archiver");
const fs = require('node:fs');
const s3Wasabi = require('./s3');
const { config } = require("./../config");
const exec = util.promisify(require('node:child_process').exec);
const Log = require("./log");


const logFile = new Log("backup.log")

const Action = {};


Action.dumpDatabase = async (outName) => {
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

Action.removeArchives = async () => {
    const lastDateTmp = new Date().getTime() - config.retentionTime*1000;
    const archives = await logFile.getArchiveToRemove(new Date(lastDateTmp));
    const deleteArchiveFunc = archives.map(archive => Action.removeBackupOnS3(archive));
    await Promise.all(deleteArchiveFunc);
}


Action.copyBackupToS3 = async (fileName) => {
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

Action.removeBackupOnS3 = async (name) => {
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


module.exports = Action;
