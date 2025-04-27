require('dotenv').config()
const AWS = require("aws-sdk");
const fs = require("node:fs");
const path = require("node:path");
const { config } = require("../config");
const { promisify } = require("node:util");

let accessKeyId = process.env.WS3_ACCESS_KEY_ID;
let secretAccessKey = process.env.WS3_SECRET_ACCESS_KEY;
let wasabiEndpoint = new AWS.Endpoint('s3.wasabisys.com');
let bucketName = process.env.WS3_DEFAULT_BUCKET;

if (config?.wasabi?.accessKey && config?.wasabi?.secretKey && config?.wasabi?.bucketName) {
    accessKeyId = config.wasabi.accessKey;
    secretAccessKey = config.wasabi.secretKey;
    bucketName = config.wasabi.bucketName;
}

class S3Wasabi {
    constructor() {
        this.s3 = new AWS.S3({
            endpoint: wasabiEndpoint,
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        });
    }

    async createBucketIfNotExists({ bucket }) {
        let result = null;
        const params = {
            Bucket: bucket,
            ACL: "private"
        }
        const createBucket = promisify(this.s3.createBucket);  
        const getBucketAcl = promisify(this.s3.getBucketAcl);

        const acl = await getBucketAcl({ Bucket: bucket });
        console.log("acl: ", acl)
        if (!acl) {
            result = await createBucket(params)
        }
        return result;
    }

    uploadFile ({filePath, fileName = path.basename(filePath)}) {
        const params = {
            Bucket: bucketName,
            Key: fileName,
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
}

module.exports = new S3Wasabi();