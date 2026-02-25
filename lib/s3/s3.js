require('dotenv').config()
const AWS = require("aws-sdk");
const fs = require("node:fs");
const { writeFile } = require("node:fs/promises");
const path = require("node:path");
const { config } = require("../../config");
const { resolveS3Config } = require('../helper/mapConfig');

// let accessKeyId = process.env.WS3_ACCESS_KEY_ID;
// let secretAccessKey = process.env.WS3_SECRET_ACCESS_KEY;
// let wasabiEndpoint = new AWS.Endpoint(process.env.WS3_ENDPOINT);
// let bucketName = process.env.WS3_DEFAULT_BUCKET;
// let definedRegion = process.env.WS3_REGION;

// if (config?.wasabi?.accessKey && config?.wasabi?.secretKey && config?.wasabi?.bucketName) {
//     accessKeyId = config.wasabi.accessKey;
//     secretAccessKey = config.wasabi.secretKey;
//     bucketName = config.wasabi.bucketName;
//     definedRegion = config.wasabi.region;
  
// } else {
//     console.log("No wasabi config defined")
// }

class S3Manager {
    constructor(configName = "") {
        let { accessKey, secretKey, region, endpoint, bucketName } = resolveS3Config(configName);
        this.s3 = new AWS.S3({
            endpoint: new AWS.Endpoint(endpoint),
            accessKeyId: accessKey,
            region,
            secretAccessKey: secretKey,
            s3ForcePathStyle: true 
        });
        this.bucket = bucketName;
    }

    getClient() {
        return this.s3;
    }

    ensKey = (key) => {
        const prefix = config.wasabi?.backupPrefix || "";
        if (!prefix) return key;
        // avoid double-prefixing if key already includes the prefix
        return key.startsWith(prefix) ? key : prefix + key;
    }

    // the create bucket function actually have an error
    async createBucketIfNotExists() {
         try {
            // Check if the bucket exists
            await this.s3.headBucket({ Bucket: bucket }).promise();
        } catch (error) {
            if (error.code === 'NotFound') {
            // If the bucket doesn't exist, create it
            try {
                const params = {
                    Bucket: this.bucket,
                    ACL: 'private', // optional: set bucket ACL as private or another option like 'public-read'
                };
                await this.s3.createBucket(params).promise();
                console.log(`Bucket "${this.bucket}" created successfully.`);
            } catch (err) {
                throw new Error(err.message, ` Bucket name: ${this.bucket}`);
            }
            } else {
               throw new Error('Error checking if bucket exists:', error);
            }
        }
    }

    uploadFile ({filePath, key = path.basename(filePath)}) {
        key = this.ensKey(key)
        const params = {
            Bucket: this.bucket,
            Key: key,
            Body: fs.createReadStream(filePath)
        }

        var options = {
            partSize: 10 * 1024 * 1024, 
            queueSize: 1
        };

        return new Promise((resolve, reject) => {
            this.s3.upload(params, options, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            })
        });
    }

    async downloadFile ({ key, downloadPath = "./" }) {
        key = this.ensKey(key);
        const params = {
            Bucket: this.bucket,
            Key: key
        }
        const data = await this.s3.getObject(params).promise();
        const path = path.join(downloadPath, path.basename(key));
        await writeFile(path, data.Body);
        return path;
    }

    deleteFile = (key) => {
        key = this.ensKey(key)
        const params = {
            Bucket: this.bucket,
            Key: key
        }

        return new Promise((resolve, reject) => {
            this.s3.deleteObject(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            })
        })
    }

    listFiles = (max = 1000) => {
        const params = {
            Bucket: this.bucket,
            MaxKeys: max,
        }
        
        if (config.wasabi.backupPrefix)
            params.Prefix = config.wasabi.backupPrefix;

        return new Promise((resolve, reject) => {
            this.s3.listObjectsV2(params, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            })
        })
    }

    listBuckets = () => {
        return this.s3.listBuckets().promise();
    }

    downloadPrefix = async (prefix, localDir) => {
        let continuationToken = undefined;
        prefix = config.wasabi.backupPrefix ? config.wasabi.backupPrefix + "/" + prefix : prefix;
        do {
            const res = await this.s3.listObjectsV2({
                Bucket: this.bucket,
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
                    this.s3.getObject({
                        Bucket: this.bucket,
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
    }

    checkFileExists = (key) => new Promise((resolve) => {
        key = this.ensKey(key);
        this.s3.headObject({
            Bucket: this.bucket,
            Key: key
        }).then(() => {
            resolve(true)
        })
        .catch(_err => {
            resolve(false)
        })
    })

    listBucketsObject = async ({ prefix = "" } = {}) => {
        let continuationToken;
        let objects = []
        do {
            const response = await this.s3.listObjectsV2({
                Bucket: this.bucket,
                Prefix: prefix,
                ContinuationToken: continuationToken
            }).promise()

            if (Array.isArray(response.Contents) && response.Contents.length > 0) {
                objects.push(...response.Contents);
            }
            continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
        } while (continuationToken)
        return objects;
    }
}

module.exports = S3Manager;