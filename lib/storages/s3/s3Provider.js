const fs = require("fs/promises");
const { createReadStream } = require("fs");
const { 
    S3Client,
    ListObjectsV2Command,
    HeadObjectCommand,
    GetObjectCommand,
    HeadBucketCommand,
    DeleteObjectCommand
} = require("@aws-sdk/client-s3");
const path = require('node:path');
const fs = require("node:fs/promises");
const S3Provider = require('./s3');
const { config } = require("../../config");
const { backupEvent } = require("../helper/event");
const backupService = require('../db/backupService');

const { Upload } = require("@aws-sdk/lib-storage");
const path = require("path");

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

    getPrefix = () => {
        return this.config.backupPrefix || ""
    }

    prefixKey = (key) => {
        const prefix = this.getPrefix();
        if (!prefix) return key;
        return key.startsWith(prefix) ? key : prefix + key;
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
            const command = new HeadObjectCommand({ Bucket: this.bucketName, Key: this.getPrefix(key) });
            await this.s3.send(command);
            return true;
        } catch(err) {
            if (err.message === "NotFound" || err.$metadata?.httpStatusCode === 404) 
                return false;
            console.log("Error checking object exists: ", err.message);
        }
    }

    async getObjectStream(key) {
        const res = await this.s3.send(new GetObjectCommand({ Bucket: this.bucketName, Key: this.getPrefix(key) }))
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
                Key: this.prefixKey(key),
                Body: stream
            },
            queueSize: 4,
            partSize: 8 * 1024 * 1024,
            leavePartsOnError: false
        })
        return upload.done();
    }

    async uploadDir (dirPath, prefix = "") {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const filePaths = entries.filter(entry => entry.isFile()).map(entry => path.join(dirPath, entry.name));
        const uploadRes = []
        for (const filePath of filePaths) {
            const fileStream = createReadStream(filePath);
            let key = path.join(prefix, path.basename(dirPath), path.basename(filePath));
            key = this.prefixKey(key);
            const res = await this.uploadStream(fileStream, key);
            uploadRes.push({...res, filePath, prefix: this.getPrefix() });
        }
        return uploadRes;
    }

    async deleteObject(key) {
        const res = await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: this.getPrefix(key) }))
        return res;
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

    listBackup = async () => {
        try {
            await this.createBucketIfNotExists();
            const fileList = await this.listFiles();
            return fileList.Contents;
        } catch (error) {
            console.log("ERROR: ", error.message);
        }
    }

    removeS3Archive = async (nameId) => {
        try {
            let removePromise = [];
            const backRes = await backupService.findByNameOrId(nameId);
            if (!backRes.data) {
                const existWasabi = await this.checkFileExists(nameId);
                if (!existWasabi) {
                    throw new Error("Wasabi: file does not exists")
                } else {
                    // direct deletion of the file
                    // backupEvent.emit("backup_delete", { name, storage: "s3" })
                    return;
                }
            } 
            // deletion of the file from database info
            const backup = backRes.data;
            if (backup.files?.length > 0) {
                removePromise = backup.files.map(file => this.deleteObject(file.storagePath))
            } 
            await Promise.all(removePromise);
            backupEvent.emit("backup_delete", { backupUid: backup.backupUid, storage: "s3" });
        } catch (error) {
            console.log(error.message);
            process.exit(1);
        }
    }

    copyBackupToS3 = async (metaBackup) => {
        try {
            const fileName = metaBackup.storagePath;
            await this.createBucketIfNotExists();
            const filePath = path.join(config.workingDirectory, fileName);
            const res = await this.uploadFile({ filePath });
            const backupFile = { storagePath: res.Key, size: res.Size / 1024 }
            backupFile.uploadedData = [backupFile];
            if (res) {
                console.log("uploading file done")
                backupEvent.emit("backup_success", { ...metaBackup, storage: "s3" })
            } else {
                console.log("Error when sending file to wasabi");
                backupEvent.emit("backup_failed", { ...metaBackup, storage: "s3" })
            }
        } catch (err) {
            console.log("Error when copying backup to wasabi: ", err.message);
            backupEvent.emit("backup_failed", { ...metaBackup, storage: "s3" })
        }
    }

    encryptedBackupToS3 = async (metaBackup) => {
        try {
            const entries = await fs.readdir(metaBackup.encryptedDirPath, { withFileTypes: true });
            const files = entries.filter(entry => entry.isFile());
            const metaFiles = files.map(file => ({ filePath: path.join(metaBackup.encryptedDirPath, file.name), key: path.basename(metaBackup.encryptedDirPath) + "/" + file.name }));
            const uploadedData = [];
            for (const { key, filePath } of metaFiles) {
                const fileStream = createReadStream(filePath)
                const res = await this.uploadStream(fileStream, key);
                if (!res) 
                    throw new Error("Error uploading file to wasabi.");
                const stat = await fs.stat(filePath);
                const backupFile = { storagePath: res.Key, size: stat.size / 1024 }
                uploadedData.push(backupFile);
            }
            metaBackup.uploadedData = uploadedData;
            backupEvent.emit("backup_success", { ...metaBackup, storage: "s3", encrypted: true })
        } catch (error) {
            console.log("Error sending encrypted backup: ", error.message);
            backupEvent.emit("backup_failed", { ...metaBackup, storage: "s3", encrypted: true })
        }
    }

    testConnection = async () => {
        try {
            await this.listBuckets();
            return true;
        } catch (error) {
            return false;
        }
    }

    removeS3Archives = async (archives) => {
        if (archives.length > 0) {
            console.log("archives: ", archives)        
            for (const archive of archives) { 
                try {
                    const res = await this.deleteObject(archive.storagePath);
                    console.log("should delete the key: ", res)
                    backupEvent.emit("backup_delete", { backupUid: archive.backupUid, storagePath: archive.storagePath, storage: "s3" })
                } catch (err) {
                    console.log("Error when deleting wasabi file: ", err.message)
                }
            }        
        }
    }

    
}


module.exports = S3Provider;