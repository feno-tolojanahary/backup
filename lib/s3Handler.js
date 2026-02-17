const path = require('node:path');
const fs = require("node:fs/promises");
const s3Wasabi = require('./helper/s3');
const { config } = require("./../config");
const { backupEvent } = require("./helper/event");
const backupService = require('./db/backupService');

exports.wasabiConfigExists = () => {
    const hasConfig = config.wasabi.accessKey && config.wasabi.secretKey && config.wasabi.bucketName
    return hasConfig;
}

exports.listS3Backup = async () => {
    try {
        await s3Wasabi.createBucketIfNotExists({ bucket: config.wasabi.bucketName });
        const fileList = await s3Wasabi.listFiles();
        return fileList.Contents;
    } catch (error) {
        console.log("ERROR: ", error.message);
    }
}

exports.removeS3Archives = async (archives) => {
    if (archives.length > 0) {
        console.log("archives: ", archives)        
        for (const archive of archives) { 
            try {
                const res = await s3Wasabi.deleteFile(archive.storagePath);
                console.log("should delete the key: ", res)
                backupEvent.emit("backup_delete", { storagePath: archive.storagePath, storage: "wasabi" })
            } catch (err) {
                console.log("Error when deleting wasabi file: ", err.message)
            }
        }        
    }
}

exports.removeS3Archive = async (storagePath) => {
    try {
        let removePromise = [];
        const backups = await backupService.getAllBackups({ storagePath, storage: "wasabi" });
        if (backups.length === 0) {
            const existWasabi = await s3Wasabi.checkFileExists(storagePath);
            if (!existWasabi) {
                throw new Error("Wasabi: file does not exists")
            } else {
                // direct deletion of the file
                backupEvent.emit("backup_delete", { storagePath, storage: "wasabi" })
                return;
            }
        } 
        // deletion of the file from database info
        const backup = backups[0];
        if (backup.s3Keys?.length > 0) {
            removePromise = backup.s3Keys.map(key => s3Wasabi.deleteFile(key))
        } 
        await Promise.all(removePromise);
        backupEvent.emit("backup_delete", { storagePath, storage: "wasabi" });
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
}

exports.copyBackupToS3 = async (metaBackup) => {
    try {
        const fileName = metaBackup.storagePath;
        await s3Wasabi.createBucketIfNotExists({ bucket: config.wasabi.bucketName });
        const filePath = path.join(config.workingDirectory, fileName);
        const res = await s3Wasabi.uploadFile({ filePath });
        metaBackup.storagePath = res.Key;
        if (res) {
            console.log("uploading file done")
            backupEvent.emit("backup_success", { ...metaBackup, storage: "wasabi" })
        } else {
            console.log("Error when sending file to wasabi");
            backupEvent.emit("backup_failed", { ...metaBackup, storage: "wasabi" })
        }
    } catch (err) {
        console.log("Error when copying backup to wasabi: ", err.message);
        backupEvent.emit("backup_failed", { ...metaBackup, storage: "wasabi" })
    }
}

exports.encryptedBackupToS3 = async (metaBackup) => {
    try {
        const entries = await fs.readdir(metaBackup.encryptedDirPath, { withFileTypes: true });
        const files = entries.filter(entry => entry.isFile());
        const metaFiles = files.map(file => ({ filePath: path.join(metaBackup.encryptedDirPath, file.name), key: path.basename(metaBackup.encryptedDirPath) + "/" + file.name }));
        for (const { key, filePath } of metaFiles) {
            const res = await s3Wasabi.uploadFile({ filePath, key });
            if (!res) 
                throw new Error("Error uploading file to wasabi.");
            const stat = await fs.stat(filePath);
            const metadata = { ...metaBackup, storagePath: res.Key, size: stat.size / 1024 }
            backupEvent.emit("backup_success", { ...metadata, storage: "wasabi", encrypted: true })
        }
    } catch (error) {
        console.log("Error sending encrypted backup: ", error.message);
        backupEvent.emit("backup_failed", { ...metaBackup, storage: "wasabi", encrypted: true })
    }
}

exports.testConnection = async () => {
    try {
        await s3Wasabi.listBuckets();
        return true;
    } catch (error) {
        return false;
    }
}