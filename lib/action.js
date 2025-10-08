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

exposts.restoreBackup = async (index, opts) => {
    try {
        const backupInfo = await logFile.getByIndex(index);
        if (backupInfo) {
            console.log(`Index ${index} not found in the backup`);
            process.exit(1);
        }
        const downloadPath = await s3Wasabi.downloadFile({ key: backupInfo.fileName });
        await restoreMongoDb(downloadPath, opts?.to);
    } catch (error) {
        console.log("Error when restoring a backup: ", error.message);
    }
}