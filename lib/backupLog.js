const { config } = require("../config");
const path = require('node:path');
const fs = require('node:fs');

class BackupLog {
    constructor(fileName) {
        this.fileName = fileName;
        // ensure dir
        fs.mkdirSync(config.backupLog, { recursive: true });
        this.filePath = path.join(config.backupLog, fileName);
    }

    log (backupName, zooKeeper) {
        const isoDate = new Date().toISOString();
        const backup = {
            name: backupName,
            date: isoDate,
            s3: false,
            zooKeeper
        }
        fs.appendFileSync(this.filePath, JSON.stringify(backup) + "\n", "utf-8");
    }

    readAll() {
        const fileData = fs.readFileSync(this.filePath);
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

module.export = new BackupLog("backup.jsonl")