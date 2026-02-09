const path = require('node:path');
const s3Wasabi = require('./helper/s3');
const { config } = require("./../config");
const { removeLog } = require("./backupLog");
const { backupEvent } = require("./helper/event")

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
        const deleteArchiveFunc = archives.map(archive => s3Wasabi.deleteFile(archive));
        await Promise.all(deleteArchiveFunc);
        for (let i = 0; i < archives.length; i++) {
            const dataLog = { name: archives[i], storage: "wasabi", deletedDate: new Date() };
            console.log("s3 - remove - ", archives[i]);
            removeLog.objLog(dataLog);
        }
    }
}

exports.removeS3Archive = async (archiveName) => {
    try {
        const res = await s3Wasabi.deleteFile(archiveName);
        if (res.DeleteMarker === false) { 
            console.log("Wasabi: file does not exists")
            return false;
        }
        const dataLog = { name: archiveName, storage: "wasabi", deletedDate: new Date() };
        removeLog.objLog(dataLog);
    } catch (error) {
        console.log("Error when removing s3 archive");
    }
}

exports.copyBackupToS3 = async (backupFile) => {
    try {
        const fileName = backupFile.name;
        await s3Wasabi.createBucketIfNotExists({ bucket: config.wasabi.bucketName });
        const filePath = path.join(config.workingDirectory, fileName);
        const res = await s3Wasabi.uploadFile({ filePath });
        if (res) {
            console.log("uploading file done")
            backupEvent.emit("backup_success", { ...backupFile, storage: "wasabi" })
        } else {
            console.log("Error when sending file to wasabi");
            backupEvent.emit("backup_failed", { ...backupFile, storage: "wasabi" })
        }
    } catch (err) {
        console.log("Error when copying backup to wasabi");
        backupEvent.emit("backup_failed", { ...backupFile, storage: "wasabi" })
    }
}

exports.encryptedBackupToS3 = async (backupInfo) => {
    try {
        const entries = await fs.readdir(backupInfo.encryptedDirPath);
        const files = entries.filter(entry => entry.isFile());
        const metaFiles = files.map(file => ({ filePath: path.join(dirPath, file.name), key: path.basename(dirPath) + "/" + file.name }));
        const uploadFiles = metaFiles.map(({ key, filePath }) => s3Wasabi.uploadFile({ filePath, key }));
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
