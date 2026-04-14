const fs = require("fs");
const { mkdir } = require("fs/promises");
const { pipeline } = require("node:fs/promises");
const backupService = require("../db/backupService");
const { parseStorageSize } = require("../helper/utils");
const MongodbManager = require("../sources/mongodb/mongodbManager");
const LocalStorage = require("./localStorage/localStorages");
const RemoteHost = require("./remote/remoteHost");
const S3Provider = require("./s3/s3Provider");
const path = require("node:path");
const { config } = require("../../config");
const { searchConfig } = require("../helper/mapConfig");
const { backupEvent } = require("../helper/event");
const remoteHandler = require("./remote/remoteHandler");

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
            await backupService.delete({ id: backup.backup_id })
        }
    }
    if (config.type === "local-storage") {
        const localStorage = new LocalStorage(config);
        for (const backup of overflowBackups) {
            const storagePaths = backup.storagePaths.split(";");
            const deleteEntries = storagePaths.map((sPath) => localStorage.deleteEntry(sPath));
            await Promise.all(deleteEntries);
            await backupService.delete({ id: backup.backup_id })
        }       
    }
    if (config.type === "remote") {
        const remoteHost = new RemoteHost(config);
        for (const backup of overflowBackups) {
            const storagePaths = backup.storagePaths.split(";");
            const deleteEntries = storagePaths.map((sPath) => remoteHost.removeEntry(sPath));
            await Promise.all(deleteEntries);
            await backupService.delete({ id: backup.backup_id })
        }
    }
}

exports.testConf = async (conf) => {
    const testMongodb = async (conf) => {
        try {
            const mongoMng = new MongodbManager(conf);
            await mongoMng.databaseExists();
            conf.status = "connected";
            conf.connected = true;
        } catch (error) {
            console.log(error)
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
            console.log(error)
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
    let resConf = {};
    switch(conf.type) {
        case "mongodb":
            resConf = await testMongodb(conf);
            break;
        case "object-replication":
            resConf = await testS3Provider(conf);
            break;
        case "ssh":
            resConf = await testHost(conf);
            break;
        case "local-storage":
            resConf = await testLocalStorage(conf);
            break;
        default:
            throw new Error("Unknown type config");
    }
    return resConf;
}

exports.downloadBackup = async ({ backup, destParentPath = "", conf}) => {
    let connectedRemoteHost;
    try {
        if (!conf) {
            conf = searchConfig(backup.storage_conf);
            if (!conf)
                throw new Error(`The configuration ${backup.storage_conf} no longer exists.`);
        }
        if (!["s3", "ssh", "local-storage"].includes(conf.type))
            throw new Error("The config type is not valid.")
        if (!destParentPath) {
            destParentPath = config.workingDirectory;
        }
        console.log("local dest path: ", destParentPath)
        const backupPath = path.join(destParentPath, backup.name);
        if (backup.encrypted) {
            await mkdir(backupPath, { recursive: true });
        }
        if (conf.type === "s3") {
            const s3Provider = new S3Provider(conf);
            for (const backupFile of backup.files) {
                const filePath = path.join(backupPath, path.basename(backupFile.storagePath))
                const objStrm = await s3Provider.getObjectStream(backupFile.storagePath);
                await pipeline(objStrm, fs.createWriteStream(filePath));
            }
            return backupPath;
        } else if (conf.type === "ssh") {
            const remoteHost = new RemoteHost(conf);
            await remoteHost.connect();
            connectedRemoteHost = remoteHost;
            for (const backupFile of backup.files) {
                if (backupFile.type === "file") {
                    await remoteHost.downloadFile(backupFile.storagePath, backupPath);
                } else {
                    await remoteHost.downloadDir(backupFile.storagePath, backupPath);  
                }
            }
            await remoteHost.disconnect();
            connectedRemoteHost = null;
            return backupPath;
        } else if (conf.type === "local-storage") {
            const localStorage = new LocalStorage(conf);
            const storageDestPath = localStorage.getDestPath();
            for (const backupFile of backup.files) {
                const entryPath = path.join(storageDestPath, path.basename(backupFile.storageDestPath));
                if (backup.type === "file") {
                    const res = await localStorage.copyFile(entryPath, backupPath);
                    return res.fullPath;
                } else {
                    const res = await localStorage.copyFolder(entryPath, backupPath);
                    return res.fullPath;
                }
            }
        }
    } catch (error) {
        console.log(`Error download: `, error);
        if (connectedRemoteHost)
            connectedRemoteHost.disconnect();
        return;
    }
}

exports.deleteBackup = async (backup) => {
    const conf = searchConfig(backup.storage_conf);
    try {
        if (conf.type === "s3") {
            const s3Provider = new S3Provider(conf);
            // remove backup on s3
            for (const backupFile of backup.files) {
                await s3Provider.deleteObject(backupFile.storagePath);
            }
            await backupService.delete({ id: backup.id })
        }
        if (conf.type === "local-storage") {
            const localStorage = new LocalStorage(conf);
            const deleteEntries = backup.files.map((bFile) => localStorage.deleteEntry(bFile.storagePath));
            await Promise.all(deleteEntries);
            await backupService.delete({ id: backup.id })
        }
        if (conf.type === "remote") {
            const remoteHost = new RemoteHost(conf);
            const deleteEntries = backup.files.map((bFile) => remoteHost.removeEntry(bFile.storagePath));
            await Promise.all(deleteEntries);
            await backupService.delete({ id: backup.id })
        }
        backupEvent.emit("backup_delete", backup);
    } catch (error) {
        throw new Error(`Error deleting backup ${backup.name}.`);
    }
}

exports.listByConf = async (conf) => {
    let remoteHost = null;
    try {
        let list = [];
        if (conf.type === "s3") {
            const s3Provider = new S3Provider(conf);
            list = await s3Provider.listBackup(conf);
        } else if (conf.type === "remote") {
            remoteHost = new RemoteHost();
            await remoteHost.connect();
            list = remoteHost.getFileList();
            await remoteHost.disconnect();
        } else if (conf.type === "local-storage") {
            const localStorage = new LocalStorage(conf);
            list = localStorage.getFiles();
        }
        return list;
    } catch (error) {
        console.log(`Error get list from config ${conf.name}`);
        if (remoteHost && remoteHost.isConnected())
            remoteHost.disconnect();
        return [];
    }
}