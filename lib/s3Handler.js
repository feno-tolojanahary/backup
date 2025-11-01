const fs = require("node:fs/promises");
const path = require('node:path');
const s3Wasabi = require('./helper/s3');
const { config } = require("./../config");
const archiveFile = path.join(__dirname, "..", "data", "wasabi-archive.log");

exports.listS3Backup = async () => {
    try {
        const fileList = await s3Wasabi.listFiles();
        return fileList.Contents;
    } catch (error) {
        console.log("error when listing s3 backup");
    }
}

exports.removeS3Archives = async (archives) => {
    if (archives.length > 0) {
        const deleteArchiveFunc = archives.map(archive => s3Wasabi.deleteFile(archive));
        await Promise.all(deleteArchiveFunc);
        let data = archives[0];
        for (let i = 1; i < archives.length; i++) {
            data += archives[i] + "\n";
        }
        await fs.appendFile(archiveFile, data);
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

// exports.removeBackupOnS3 = async (name) => {
//     try {
//         const key = name;
//         const res = await s3Wasabi.deleteFile(key);
//         if (res) {
//             console.log(`Removing ${key} on S3 - ok`);
//         }
//     } catch (error) {
//         console.log("error when removing backup on s3");
//     }
// }