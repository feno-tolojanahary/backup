const S3Provider = require("./s3Provider")
const { resolveS3Config, getS3Config } = require('../helper/mapConfig');
const backupService = require("../../db/backupService");
const { parseStorageSize } = require("../../helper/utils");

exports.wasabiConfigExists = () => {
    const defaultConfig = resolveS3Config();
    const hasConfig = defaultConfig.accessKey && defaultConfig.secretKey && defaultConfig.bucketName
    return hasConfig;
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

    const sourceS3 = new S3Provider(sourceConf);
    const destS3 = new S3Provider(destConf);

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