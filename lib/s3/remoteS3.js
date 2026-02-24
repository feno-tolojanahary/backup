const path = require('node:path');
const fs = require("node:fs/promises");
const S3Manager = require('./s3');
const s3Manager = new S3Manager();
const { config } = require("../../config");
const { backupEvent } = require("../helper/event");
const backupService = require('../db/backupService');
const { resolveS3Config, getS3Config } = require('../helper/mapConfig');

exports.wasabiConfigExists = () => {
    const defaultConfig = resolveS3Config();
    const hasConfig = defaultConfig.accessKey && defaultConfig.secretKey && defaultConfig.bucketName
    return hasConfig;
}

exports.listS3Backup = async () => {
    try {
        await s3Manager.createBucketIfNotExists();
        const fileList = await s3Manager.listFiles();
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
                const res = await s3Manager.deleteFile(archive.storagePath);
                console.log("should delete the key: ", res)
                backupEvent.emit("backup_delete", { backupUid: archive.backupUid, storagePath: archive.storagePath, storage: "s3" })
            } catch (err) {
                console.log("Error when deleting wasabi file: ", err.message)
            }
        }        
    }
}

exports.removeS3Archive = async (nameId) => {
    try {
        let removePromise = [];
        const backRes = await backupService.findByNameOrId(nameId);
        if (!backRes.data) {
            const existWasabi = await s3Manager.checkFileExists(nameId);
            if (!existWasabi) {
                throw new Error("Wasabi: file does not exists")
            } else {
                // direct deletion of the file
                // backupEvent.emit("backup_delete", { name, storage: "s3" })
                return;
            }
        } 
        // deletion of the file from database info
        const backup = backRes.data;
        if (backup.files?.length > 0) {
            removePromise = backup.files.map(file => s3Manager.deleteFile(file.storagePath))
        } 
        await Promise.all(removePromise);
        backupEvent.emit("backup_delete", { backupUid: backup.backupUid, storage: "s3" });
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
}

exports.copyBackupToS3 = async (metaBackup) => {
    try {
        const fileName = metaBackup.storagePath;
        await s3Manager.createBucketIfNotExists();
        const filePath = path.join(config.workingDirectory, fileName);
        const res = await s3Manager.uploadFile({ filePath });
        const backupFile = { storagePath: res.Key, size: res.Size / 1024 }
        backupFile.uploadedData = [backupFile];
        if (res) {
            console.log("uploading file done")
            backupEvent.emit("backup_success", { ...metaBackup, storage: "s3" })
        } else {
            console.log("Error when sending file to wasabi");
            backupEvent.emit("backup_failed", { ...metaBackup, storage: "s3" })
        }
    } catch (err) {
        console.log("Error when copying backup to wasabi: ", err.message);
        backupEvent.emit("backup_failed", { ...metaBackup, storage: "s3" })
    }
}

exports.encryptedBackupToS3 = async (metaBackup) => {
    try {
        const entries = await fs.readdir(metaBackup.encryptedDirPath, { withFileTypes: true });
        const files = entries.filter(entry => entry.isFile());
        const metaFiles = files.map(file => ({ filePath: path.join(metaBackup.encryptedDirPath, file.name), key: path.basename(metaBackup.encryptedDirPath) + "/" + file.name }));
        const uploadedData = [];
        for (const { key, filePath } of metaFiles) {
            const res = await s3Manager.uploadFile({ filePath, key });
            if (!res) 
                throw new Error("Error uploading file to wasabi.");
            const stat = await fs.stat(filePath);
            const backupFile = { storagePath: res.Key, size: stat.size / 1024 }
            uploadedData.push(backupFile);
        }
        metaBackup.uploadedData = uploadedData;
        backupEvent.emit("backup_success", { ...metaBackup, storage: "s3", encrypted: true })
    } catch (error) {
        console.log("Error sending encrypted backup: ", error.message);
        backupEvent.emit("backup_failed", { ...metaBackup, storage: "s3", encrypted: true })
    }
}

exports.testConnection = async () => {
    try {
        await s3Manager.listBuckets();
        return true;
    } catch (error) {
        return false;
    }
}

exports.syncObjectSourceDestination = async (sourceConfName, destConfName, onProgress) => {
    const sourceConf = getS3Config(sourceConfName);
    const destConf = getS3Config(destConfName);
    let skippedCount = 0, proccessCount = 0, uploadedCount = 0;
    if (!sourceConf) {
        throw new Error("No s3 config specified who have a name ", sourceConfName)
    }
    if (!destConf) {
        throw new Error("No s3 config specified who have a name ", destConfName)
    }

    const sourceS3 = new S3Manager(sourceConf);
    const destS3 = new S3Manager(destConf);

    const objects = await sourceS3.listBucketsObject()

    const emitProgress = () => {
        if (!typeof onProgress !== "function") return;
        const percent = objects.length === 0 ? 100 : Math.min(100, (processCount / objects.length) * 100);
        onProgress({
            skippedCount,
            processCount,
            uploadedCount,
            percent,
            total: objects.length
        })
    }

    for (const object of objects) {
        try {
            if (await destS3.checkFileExists(object.Key)) {
                skippedCount += 1;
                emitProgress();
                continue;
            }
            const sourceClient = sourceS3.getClient();
            const destClient = destS3.getClient();
            const objectData = await sourceClient.getObject({
                bucket: sourceConf.bucketName,
                Key: object.Key
            }).promise();

            await destClient.putObject({
                Bucket: sourceConf.bucketName,
                Key: objectData.Key,
                Body: objectData.Body,
                ContentType: objectData.ContentType
            }).promise();

            uploadedCount += 1;
            emitProgress();

        } catch (err) {
            skippedCount += 1;
            console.log("Error when checking object existance: ", err.message)
        } finally {
            proccessCount += 1;
            emitProgress();
        }
    }   
}