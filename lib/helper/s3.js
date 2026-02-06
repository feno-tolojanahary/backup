require('dotenv').config()
const AWS = require("aws-sdk");
const fs = require("node:fs");
const { writeFile } = require("node:fs/promises");
const path = require("node:path");
const { config } = require("../../config");

let accessKeyId = process.env.WS3_ACCESS_KEY_ID;
let secretAccessKey = process.env.WS3_SECRET_ACCESS_KEY;
let wasabiEndpoint = new AWS.Endpoint(process.env.WS3_ENDPOINT);
let bucketName = process.env.WS3_DEFAULT_BUCKET;
let definedRegion = process.env.WS3_REGION;

if (config?.wasabi?.accessKey && config?.wasabi?.secretKey && config?.wasabi?.bucketName) {
    accessKeyId = config.wasabi.accessKey;
    secretAccessKey = config.wasabi.secretKey;
    bucketName = config.wasabi.bucketName;
    definedRegion = config.wasabi.region;
  
} else {
    console.log("No wasabi config defined")
}

class S3Wasabi {
    constructor() {
        this.s3 = new AWS.S3({
            endpoint: wasabiEndpoint,
            accessKeyId: accessKeyId,
            region: definedRegion,
            secretAccessKey: secretAccessKey,
            s3ForcePathStyle: true 
        });
    }

    // the create bucket function actually have an error
    async createBucketIfNotExists({ bucket }) {
         try {
            // Check if the bucket exists
            await this.s3.headBucket({ Bucket: bucket }).promise();
        } catch (error) {
            if (error.code === 'NotFound') {
            // If the bucket doesn't exist, create it
            try {
                const params = {
                    Bucket: bucketName,
                    ACL: 'private', // optional: set bucket ACL as private or another option like 'public-read'
                };
                await this.s3.createBucket(params).promise();
                console.log(`Bucket "${bucketName}" created successfully.`);
            } catch (err) {
                console.log(err.message, ` Bucket name: ${bucketName}`);
            }
            } else {
                console.error('Error checking if bucket exists:', error);
            }
        }
    }

    uploadFile ({filePath, key = path.basename(filePath)}) {
        const params = {
            Bucket: bucketName,
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
        const params = {
            Bucket: bucketName,
            Key: key
        }
        try {
            const data = await this.s3.getObject(params).promise();
            const path = path.join(downloadPath, path.basename(key));
            await writeFile(path, data.Body);
            return path;
        } catch (error) {
            console.log("S3 download file error: ", error.message);
        }
    }

    deleteFile = (key) => {
        const params = {
            Bucket: bucketName,
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
            Bucket: bucketName,
            MaxKeys: max
        }
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
}

module.exports = new S3Wasabi();