const fs = require("fs/promises");
const MongodbManager = require("./mongodbManager");
const { decryptDataPath } = require("./../../encryption/cryptoTools");

const restoreEncryptedBackup = async ({restoreName, downloadPath, sourceConfig, originalName}) => {
    // const res = await sendIpcRequest({ msg: "decrypt", payload: downloadPath });
    if (!downloadPath)
        throw new Error("the download path is not provided.");
    const decryptedPath = await decryptDataPath(downloadPath);
    const mongoManager = new MongodbManager(sourceConfig);
    await mongoManager.restoreMongoDb(decryptedPath, restoreName, { originalName });
    await fs.rm(downloadPath, { recursive: true });     
    console.log(`removing ${downloadPath}`)
}

const restorePlainBackup = async ({restoreName, downloadPath, sourceConfig, originalName}) => {
    if (!downloadPath) {        
        console.log("The database doesnt exists on the s3 s3");
        process.exit(0);
    }
    const mongoManager = new MongodbManager(sourceConfig);
    await mongoManager.restoreMongoDb(downloadPath, restoreName, { originalName });
    await fs.unlink(downloadPath);     
    console.log(`removing ${downloadPath}`)
}

module.exports = {
    restoreEncryptedBackup,
    restorePlainBackup
}