const backupService = require("../db/backupService");
const { parseStorageSize } = require("../helper/utils");
const MongodbManager = require("../sources/mongodb/mongodbManager");
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

exports.testConf = async (conf) => {
    const testMongodb = async (conf) => {
        try {
            const mongoMng = new MongodbManager(conf);
            await mongoMng.databaseExists();
            conf.connected = true;
        } catch (error) {
            conf.connected = false;
            conf.errorMsg = error.message;
        }
        return conf;
    }

    const testS3Provider = async (conf) => {
        const s3Provider = new S3Provider(conf);
        const status = await s3Provider.testConnection();
        conf.connected = status.ok;
        conf.errorMsg = status.error;
        return conf;
    }

    const testHost = async (conf) => {
        try {
            const remoteHost = new RemoteHost(conf);
            await remoteHost.connect();
            await remoteHost.disconnect();
            conf.connected = true;
        } catch (error) {
            conf.connected = false;
            conf.errorMsg = error.message;
        }
        return conf;
    }

    const testLocalStorage = async (conf) => {
        const localStorage = new LocalStorage(conf);
        const res = await localStorage.verifyFolderWritable();
        conf.connected = res.writable;
        conf.errorMsg = res.error;
        return conf;
    }

    switch(conf.type) {
        case "mongodb":
            testMongodb(conf);
            break;
        case "object-replication":
            testS3Provider(conf);
            break;
        case "ssh":
            testHost(conf);
            break;
        case "local-storage":
            testLocalStorage(conf);
            break;
        default:
            throw new Error("Unknown type config");
    }
}
