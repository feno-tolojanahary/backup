const path = require('node:path');
const s3Wasabi = require('./helper/s3');
const { config } = require("./../config");

exports.listS3Backup = async () => {
    try {
        const fileList = await s3Wasabi.listFiles();
        for (const fileName of fileList) {
            console.log(fileName);
        }
    } catch (error) {
        console.log("error when listing s3 backup");
    }
}

exports.copyBackupToS3 = async (fileName) => {
    try {
        console.log("start backup to wasabi: ", config.workingDirectory)
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

exports.removeBackupOnS3 = async (name) => {
    try {
        const key = name;
        const res = await s3Wasabi.deleteFile(key);
        if (res) {
            console.log(`Removing ${key} on S3 - ok`);
        }
    } catch (error) {
        console.log("error when removing backup on s3");
    }
}