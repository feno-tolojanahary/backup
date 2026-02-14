const path = require('node:path');
const fs = require("node:fs/promises");
const s3Wasabi = require('./helper/s3');
const { config } = require("./../config");
const { removeLog } = require("./backupLog");
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
        
        for (const archive of archives) { 
            try {
                const deleteArchiveFunc = [];
                if (archive.s3Keys) {
                    for (const key of s3Keys) {
                        deleteArchiveFunc.push(s3Wasabi.deleteFile(key));
                    }
                } 
                await Promise.all(deleteArchiveFunc);
                backupEvent.emit("backup_delete", { name: archive.name, storage: "wasabi" })
            } catch (err) {}
        }

        
    }
}

exports.removeS3Archive = async (archiveName) => {
    try {
        let removePromise = [];
        const backups = await backupService.getAllBackups({ name: archiveName, storage: "wasabi" });
        if (backups.length === 0) {
            const existWasabi = await s3Wasabi.checkFileExists(archiveName);
            if (!existWasabi) {
                throw new Error("Wasabi: file does not exists")
            } else {
                // direct deletion of the file
                backupEvent.emit("backup_delete", { name: archiveName, storage: "wasabi" })
                return;
            }
        } 
        // deletion of the file from database info
        const backup = backups[0];
        if (backup.s3Keys?.length > 0) {
            removePromise = backup.s3Keys.map(key => s3Wasabi.deleteFile(key))
        } 
        await Promise.all(removePromise);
        backupEvent.emit("backup_delete", { name: archiveName, storage: "wasabi" });
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
}

exports.copyBackupToS3 = async (backupFile) => {
    try {
        const fileName = backupFile.name;
        await s3Wasabi.createBucketIfNotExists({ bucket: config.wasabi.bucketName });
        const filePath = path.join(config.workingDirectory, fileName);
        const res = await s3Wasabi.uploadFile({ filePath });
        backupFile.s3Keys = [ res.Key ];
        if (res) {
            console.log("uploading file done")
            backupEvent.emit("backup_success", { ...backupFile, storage: "wasabi" })
        } else {
            console.log("Error when sending file to wasabi");
            backupEvent.emit("backup_failed", { ...backupFile, storage: "wasabi" })
        }
    } catch (err) {
        console.log("Error when copying backup to wasabi: ", err.message);
        backupEvent.emit("backup_failed", { ...backupFile, storage: "wasabi" })
    }
}

exports.encryptedBackupToS3 = async (backupInfo) => {
    try {
        const entries = await fs.readdir(backupInfo.encryptedDirPath, { withFileTypes: true });
        const files = entries.filter(entry => entry.isFile());
        const metaFiles = files.map(file => ({ filePath: path.join(backupInfo.encryptedDirPath, file.name), key: path.basename(backupInfo.encryptedDirPath) + "/" + file.name }));
        const uploadFiles = metaFiles.map(({ key, filePath }) => s3Wasabi.uploadFile({ filePath, key }));
        backupInfo.s3Keys = metaFiles.map(({ key }) => key);
        await Promise.all(uploadFiles);
        backupEvent.emit("backup_success", { ...backupInfo, storage: "wasabi", encrypted: true })
    } catch (error) {
        console.log(error.message);
        backupEvent.emit("backup_failed", { ...backupInfo, storage: "wasabi", encrypted: true })
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
