const { config } = require("../config");
const path = require('node:path');
const fs = require('node:fs');
const { fileExists } = require("./utils");

class BackupLog {
    constructor(fileName) {
        this.fileName = fileName;
        // ensure dir
        fs.mkdirSync(config.backupLog, { recursive: true });
        this.filePath = path.join(config.backupLog, fileName);
    }

    nameLog (backupName, storage) {
        const isoDate = new Date().toISOString();
        const backup = {
            name: backupName,
            date: isoDate,
            s3: false,
            storage
        }
        fs.appendFileSync(this.filePath, JSON.stringify(backup) + "\n", "utf-8");
    }

    objLog(objStruct) {
        fs.appendFileSync(this.filePath, JSON.stringify(objStruct) + "\n", "utf-8");
    }

    deleteFile() {
        fs.unlinkSync(this.filePath);
    }

    async readAll() {
        if (!fileExists(this.filePath))
            return [];
        const fileData = fs.readFileSync(this.filePath, "utf-8");
        if (!fileData)
            return [];
        const lines = fileData.trim().split("\n");
        const dataLogs = [];
        for (const line of lines) {
            try {
                dataLogs.push(JSON.parse(line))
            } catch(err) {}
        }
        return dataLogs;
    }
}

exports.backupLog = new BackupLog("backup.jsonl");
exports.s3Log = new BackupLog("s3Log.jsonl");
exports.hostLog = new BackupLog("hostLog.jsonl");
exports.resumeLog = new BackupLog("resumeLog.jsonl");