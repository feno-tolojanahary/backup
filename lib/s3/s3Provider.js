const { 
    S3Client,
    ListObjectsV2Command,
    HeadObjectCommand,
    GetObjectCommand,
    HeadBucketCommand
} = require("@aws-sdk/client-s3");

const { Upload } = require("@aws-sdk/lib-storage");

class S3Provider {
    constructor(config) {
        const { accessKey, secretKey, region, endpoint, bucketName } = config;
        this.s3 = new S3Client({
            region,
            endpoint,
            credentials: {
                accessKeyId, accessKey,
                secretAccessKey: secretKey
            }
        });
        this.bucketName = bucketName
        this.config = config;
    }

    getClient() {
        return this.s3;
    }

    getConf () {
        return this.config;
    }

    async getListObjects ({ prefix = "" } = {}) {
        const objects = [];
        let continuationToken;

        do {
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                ContinuationToken: continuationToken,
                MaxKeys: 1000
            })
            const response = await this.s3.send(command);
            if (response.Contents) {
                objects.push(...response.Contents);
            }
            continuationToken = response.NextContinuationToken;
        } while (continuationToken)
    }

    async objectExists (key) {
        try {
            const command = new HeadObjectCommand({ Bucket: this.bucketName, Key: key });
            await this.s3.send(command);
            return true;
        } catch(err) {
            if (err.message === "NotFound" || err.$metadata?.httpStatusCode === 404) 
                return false;
            console.log("Error checking object exists: ", err.message);
        }
    }

    async getObjectStream(key) {
        const res = await this.s3.send(new GetObjectCommand({ Bucket: this.bucketName, Key: key }))
        if (!res.Body) {
            throw new Error("The object does not exists.");
        }
        return res.Body;
    }

    uploadStream (stream, key) {
        const upload = new Upload({
            client: this.s3,
            params: {
                Bucket: this.bucketName,
                Key: key,
                Body: stream
            },
            queueSize: 4,
            partSize: 8 * 1024 * 1024,
            leavePartsOnError: false
        })
        return upload.done();
    }

    async testConnection() {
        try {
            await this.s3.send(new HeadBucketCommand({ Bucket: this.bucketName }))
            return {
                ok: true
            }
        } catch (error) {
            return {
                ok: false,
                error: error.message
            }
        }
    }
}


module.exports = S3Provider;