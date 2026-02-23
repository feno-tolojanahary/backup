require('dotenv').config()
const AWS = require("aws-sdk");
const fs = require("node:fs");
const { writeFile } = require("node:fs/promises");
const path = require("node:path");
const { getS3Config } = require("./s3Config");

class S3Wasabi {
    getResolvedConfig(configName = null) {
        const selected = getS3Config(configName);
        const endpoint = selected.endpoint || process.env.WS3_ENDPOINT;
        const region = selected.region || process.env.WS3_REGION;
        const accessKeyId = selected.accessKey || process.env.WS3_ACCESS_KEY_ID || process.env.WS3_ACCESS_KEY;
        const secretAccessKey = selected.secretKey || process.env.WS3_SECRET_ACCESS_KEY || process.env.WS3_SECRET_KEY;
        const bucketName = selected.bucketName || process.env.WS3_DEFAULT_BUCKET || process.env.WS3_BUCKET_NAME;
        const backupPrefix = selected.backupPrefix || "";
        return { endpoint, region, accessKeyId, secretAccessKey, bucketName, backupPrefix };
    }

    getClient(configName = null) {
        const conf = this.getResolvedConfig(configName);
        return new AWS.S3({
            endpoint: new AWS.Endpoint(conf.endpoint),
            accessKeyId: conf.accessKeyId,
            region: conf.region,
            secretAccessKey: conf.secretAccessKey,
            s3ForcePathStyle: true
        });
    }

    ensKey = (key, configName = null) => {
        const { backupPrefix: prefix } = this.getResolvedConfig(configName);
        if (!prefix) return key;
        // avoid double-prefixing if key already includes the prefix
        return key.startsWith(prefix) ? key : prefix + key;
    }

    // the create bucket function actually have an error
    async createBucketIfNotExists({ bucket, configName = null } = {}) {
         const conf = this.getResolvedConfig(configName);
         const s3 = this.getClient(configName);
         const resolvedBucket = bucket || conf.bucketName;
         try {
            // Check if the bucket exists
            await s3.headBucket({ Bucket: resolvedBucket }).promise();
        } catch (error) {
            if (error.code === 'NotFound') {
            // If the bucket doesn't exist, create it
            try {
                const params = {
                    Bucket: resolvedBucket,
                    ACL: 'private', // optional: set bucket ACL as private or another option like 'public-read'
                };
                await s3.createBucket(params).promise();
                console.log(`Bucket "${resolvedBucket}" created successfully.`);
            } catch (err) {
                throw new Error(err.message, ` Bucket name: ${resolvedBucket}`);
            }
            } else {
               throw new Error('Error checking if bucket exists:', error);
            }
        }
    }

    uploadFile ({filePath, key = path.basename(filePath), configName = null}) {
        const conf = this.getResolvedConfig(configName);
        const s3 = this.getClient(configName);
        key = this.ensKey(key, configName)
        const params = {
            Bucket: conf.bucketName,
            Key: key,
            Body: fs.createReadStream(filePath)
        }

        var options = {
            partSize: 10 * 1024 * 1024, 
            queueSize: 1
        };

        return new Promise((resolve, reject) => {
            s3.upload(params, options, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            })
        });
    }

    async downloadFile (arg1, arg2, arg3) {
        // Backward compatible signatures:
        // 1) downloadFile({ key, downloadPath, configName })
        // 2) downloadFile(key, downloadPath, configName)
        let key;
        let downloadPath = "./";
        let configName = null;
        if (typeof arg1 === "object" && arg1 !== null) {
            key = arg1.key;
            downloadPath = arg1.downloadPath || "./";
            configName = arg1.configName || null;
        } else {
            key = arg1;
            downloadPath = arg2 || "./";
            configName = arg3 || null;
        }
        const conf = this.getResolvedConfig(configName);
        const s3 = this.getClient(configName);
        key = this.ensKey(key, configName);
        const params = {
            Bucket: conf.bucketName,
            Key: key
        }
        const data = await s3.getObject(params).promise();
        const filePath = path.join(downloadPath, path.basename(key));
        await writeFile(filePath, data.Body);
        return filePath;
    }

    deleteFile = (key, configName = null) => {
        const conf = this.getResolvedConfig(configName);
        const s3 = this.getClient(configName);
        key = this.ensKey(key, configName)
        const params = {
            Bucket: conf.bucketName,
            Key: key
        }

        return new Promise((resolve, reject) => {
            s3.deleteObject(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            })
        })
    }

    listFiles = (max = 1000, configName = null) => {
        const conf = this.getResolvedConfig(configName);
        const s3 = this.getClient(configName);
        const params = {
            Bucket: conf.bucketName,
            MaxKeys: max,
        }
        
        if (conf.backupPrefix)
            params.Prefix = conf.backupPrefix;

        return new Promise((resolve, reject) => {
            s3.listObjectsV2(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            })
        })
    }

    listBuckets = (configName = null) => {
        const s3 = this.getClient(configName);
        return s3.listBuckets().promise();
    }

    downloadPrefix = async (prefix, localDir, configName = null) => {
        const conf = this.getResolvedConfig(configName);
        const s3 = this.getClient(configName);
        let continuationToken = undefined;
        prefix = conf.backupPrefix ? conf.backupPrefix + "/" + prefix : prefix;
        do {
            const res = await s3.listObjectsV2({
                Bucket: conf.bucketName,
                Prefix: prefix,
                ContinuationToken: continuationToken,
            }).promise();

            for (const obj of res.Contents) {
                // Skip "directory markers"
                if (obj.Key.endsWith('/')) continue;

                const localPath = path.join(
                    localDir,
                    obj.Key.substring(prefix.length)
                );

                // Ensure local folder exists
                fs.mkdirSync(path.dirname(localPath), { recursive: true });

                const file = fs.createWriteStream(localPath);

                await new Promise((resolve, reject) => {
                    s3.getObject({
                        Bucket: conf.bucketName,
                        Key: obj.Key,
                    })
                    .createReadStream()
                    .on('error', reject)
                    .pipe(file)
                    .on('close', resolve);
                });

            }

            continuationToken = res.IsTruncated
            ? res.NextContinuationToken
            : undefined;

        } while (continuationToken);

        return localDir;
    }

    checkFileExists = (key, configName = null) => new Promise((resolve) => {
        const conf = this.getResolvedConfig(configName);
        const s3 = this.getClient(configName);
        key = this.ensKey(key, configName);
        s3.headObject({
            Bucket: conf.bucketName,
            Key: key
        }).then(() => {
            resolve(true)
        })
        .catch(_err => {
            resolve(false)
        })
    })

}

module.exports = new S3Wasabi();
