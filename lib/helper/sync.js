const fs = require("fs");
const config = require("../../config");
const s3Handler = require("../s3Handler");
const remoteHandler = require("../remote/remoteHandler");

class BackupLogger {
    constructor() {

    }

    async synchronise () {
        let s3Files = [], remoteFiles = [];
        s3Files = await s3Handler.listS3Backup();
        remoteFiles = await remoteHandler.getRemoteBackupList();
    }
}

module.exports = BackupLogger;