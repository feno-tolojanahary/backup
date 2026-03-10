const fs = require("fs/promises");
const MongodbManager = require("./mongodbManager");

const restoreEncryptedBackup = async ({restoreName, downloadPath, sourceConf}) => {
    const res = await sendIpcRequest({ msg: "decrypt", payload: downloadPath });
    const decryptedPath = res.payload;
    const mongoManager = new MongodbManager(sourceConf);
    await mongoManager.restoreMongoDb(decryptedPath, restoreName);
    await fs.rm(downloadPath, { recursive: true });     
    console.log(`removing ${downloadPath}`)
}

const restorePlainBackup = async ({restoreName, downloadPath, sourceConf}) => {
    if (!downloadPath) {        
        console.log("The database doesnt exists on the s3 s3");
        process.exit(0);
    }
    const mongoManager = new MongodbManager(sourceConf);
    await mongoManager.restoreMongoDb(downloadPath, restoreName);
    await fs.unlink(downloadPath);     
    console.log(`removing ${downloadPath}`)
}

module.exports = {
    restoreEncryptedBackup,
    restorePlainBackup
}