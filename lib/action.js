const fs = require("node:fs/promises");
const { config } = require("./../config");
const Log = require("./log");
const s3Wasabi = require("./helper/s3");
const { restoreMongoDb } = require('./dbdriver');
const logFile = new Log("backup.log")

exports.removeArchives = async () => {
    const lastDateTmp = new Date().getTime() - config.retentionTime*1000;
    const archives = await logFile.getArchiveToRemove(new Date(lastDateTmp));
    const deleteArchiveFunc = archives.map(archive => Action.removeBackupOnS3(archive));
    await Promise.all(deleteArchiveFunc);
}

exports.backupList = async () => {
    const backupList = await logFile.getBackupList({ limit: 20, skip: 0 });
    for (const backupInfo of backupList) {
        console.log(`Index: ${backupInfo.index}  Name: ${backupInfo.archiveName}  Date: ${backupInfo.dataIso}`);
    }
}

exports.restoreBackup = async (name, opts) => {
    try {
        const backupInfo = await logFile.getByName(name);
        if (backupInfo) {
            console.log(`Index ${name} not found in the backup`);
            process.exit(1);
        }
        console.log(`Download ${name} from wasabi`);
        const downloadPath = await s3Wasabi.downloadFile({ key: backupInfo.fileName });
        console.log(`${name} downloaded to ${downloadPath}`)
        if (!downloadPath) {
            console.log("The database doesnt exists on the wasabi s3");
            process.exit(0);
        }
        const restoreName = opts?.to ?? backupInfo.fileName.split(".")[0];        
        await restoreMongoDb(downloadPath, restoreName);
        await fs.unlink(downloadPath);     
        console.log(`removing ${downloadPath}`)
    } catch (error) {
        console.log("Error when restoring a backup: ", error.message);
    }
}3