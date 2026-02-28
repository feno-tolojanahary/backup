const backupService = require("../db/backupService");
const { parseStorageSize } = require("../helper/utils");
const LocalStorage = require("./localStorage/localStorages");
const RemoteHost = require("./remote/remoteHost");
const S3Provider = require("./s3/s3Provider");

exports.removeOverflowData = async (config, lastBackupSize) => {
    if (!config.maxDiskUsage)
        return;
    if (!resSum.success)
        return;
    const resSum = await backupService.getSizeSumBackupFile(config.name);
    const maxDiskUsage = parseStorageSize(config.maxDiskUsage);
    if (maxDiskUsage > resSum.totalSize + lastBackupSize)
        return;
    const lastBackupFiles = await backupService.getLastBackupFiles(config.name);
    let freeUpSize = maxDiskUsage - (lastBackupSize + resSum.totalSize);
    let totalToRemoveSize = 0;
    let overflowBackups = [];
    let index = 0;
    while(freeUpSize > totalToRemoveSize) {
        const currentBackup = lastBackupFiles[index];
        overflowBackups.push(currentBackup);
        totalToRemoveSize += currentBackup.totalSize;
        index++;
    }
    if (config.type === "s3") {
        const s3Provider = new S3Provider(config);
        for (const backup of overflowBackups) {
            // remove backup on s3
            for (const key of backup.storagePaths.split(";")) {
                await s3Provider.deleteObject(key);
            }
            await backupService.deleteMultiple({ id: backup.backup_id })
        }
    }
    if (config.type === "local-storage") {
        const localStorage = new LocalStorage(config);
        for (const backup of overflowBackups) {
            const storagePaths = backup.storagePaths.split(";");
            const deleteEntries = storagePaths.map((sPath) => localStorage.deleteEntry(sPath));
            await Promise.all(deleteEntries);
            await backupService.deleteMultiple({ id: backup.backup_id })
        }       
    }
    if (config.type === "remote") {
        const remoteHost = new RemoteHost(config);
        for (const backup of overflowBackups) {
            const storagePaths = backup.storagePaths.split(";");
            const deleteEntries = storagePaths.map((sPath) => remoteHost.removeEntry(sPath));
            await Promise.all(deleteEntries);
            await backupService.deleteMultiple({ id: backup.backup_id })
        }
    }
}