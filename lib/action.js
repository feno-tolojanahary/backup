const util = require('node:util');
const path = require('node:path');
const crypto = require("node:crypto");
const fs = require('node:fs');
const s3Wasabi = require('./s3');
const { config } = require("./../config");
const exec = util.promisify(require('node:child_process').exec);
const Log = require("./log");
const { archivePath, getFileLists } = require("./utils");
const { HistoryData } = require("./localData");

const logFile = new Log("backup.log")
const historyData = new HistoryData();

exports.dumpDatabase = async (outName) => {
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
    
    const outZip = path.join(config.workingDirectory, `${outName}.zip`);
    const filePath = path.join(config.workingDirectory, outName);
    const archiveName = await archivePath(filePath, outZip);
    return archiveName;
}

exports.dumpMysql = async (outName) => {
    if (!config.mysql) {
        throw new Error("mysql information is not defined");
    }
    const outputFile = `${outName}.sql`;
    const { stdout, stderr } = await exec(`mysqldump -u ${config.mysql.user} -p${config.mysql.password} ${config.mysql.database} > ${outputFile}`);
    if (stderr) {
        console.log("mysql dump database done")
    }
    if (stdout) {
        console.log("dump database: ", stdout)
    }

    const filePath = path.join(config.workingDirectory, outputFile);
    const outZip = path.join(config.workingDirectory, `${outName}.zip`);
    const archiveName = await archivePath(filePath, outZip);
    return archiveName;
}

exports.removeArchives = async () => {
    const lastDateTmp = new Date().getTime() - config.retentionTime*1000;
    const archives = await logFile.getArchiveToRemove(new Date(lastDateTmp));
    const deleteArchiveFunc = archives.map(archive => exports.removeBackupOnS3(archive));
    await Promise.all(deleteArchiveFunc);
}


exports.copyBackupToS3 = async (fileName) => {
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

exports.removeBackupOnS3 = async (name) => {
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

exports.backupDir = async (dir) => {
    const diffFiles = [];
    const source = path.join(__dirname, dir);
    const dest = path.join(config.dataDirectory, dir);
    
    const sourceFileLists = getFileLists(source);
    const destFileLists = getFileLists(dest);
    

    for (let srcFile of sourceFileLists) {
        const foundPath = destFileLists.find(dstFile => dstFile.path === srcFile.path);
        if (!foundPath) {
            diffFiles.push({ ...srcFile, status: "added" });
            continue;
        }
        if (srcFile.type !== foundPath.type) {
            diffFiles.push({ ...srcFile, status: "changed" });
        }

        // check diff file content
    }

    for (let dstFile of destFileLists) {
        const foundPath = sourceFileLists.find(srcFile => srcFile.path === dstFile.path)
        if (!foundPath) {
            diffFiles.push({ ...srcFile, status: "deleted" })
        }
    }

    const uuid = crypto.randomBytes(16).toString("hex");
    historyData.save({ uuid, diffFiles });
     
   
    // const res = await fs.cp(source, dest, { recursive: true });

    // const archivePath = dest + ".zip";
    // const name = await archivePath(dest, archivePath);
    // if (name) {
    //     console.log("archiving directory with success");
    //     s3Wasabi.uploadFile({ filePath: archivePath });
    // }
    // return res;
}
