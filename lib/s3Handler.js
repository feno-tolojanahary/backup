const path = require('node:path');
const s3Wasabi = require('./helper/s3');
const { config } = require("./../config");
const { removeLog } = require("./backupLog");

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
        return true;
    } catch (error) {
        console.log("Error: ", error.message);
        return false;
    }
}

exports.copyBackupToS3 = async (fileName) => {
    try {
        await s3Wasabi.createBucketIfNotExists({ bucket: config.wasabi.bucketName });
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

exports.testConnection = async () => {
    try {
        await s3Wasabi.listBuckets();
        return true;
    } catch (error) {
        return false;
    }
}
