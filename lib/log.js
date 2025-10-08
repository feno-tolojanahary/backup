const { config } = require("../config");
const path = require('node:path');
const fs = require('node:fs');
const util = require("node:util")
const { createInterface } = require("readline");
const { readFile, writeFile } = require('node:fs/promises');

const SEPARATOR = ";";
class Log {

    constructor(fileName) {
        this.fileName = fileName;
    }
    
    async readLogFile() {
        const readLog = util.promisify((callback) => {
            const logPath = path.join(config.backupLog, this.fileName);
            fs.readFile(logPath, "utf-8", callback);
        })
        const data = await readLog();
        return data;
    }

    async log(text) {
        const isoDate = new Date().toISOString();
        const logPath = path.join(config.backupLog, this.fileName);
        const lastIndex = await readFile(".lastIndex", { encoding: "utf8" });
        const index = parseInt(lastIndex ?? 0) + 1;
        const data = [isoDate, text, index];
        await writeFile(".lastIndex", index);
        await fs.appendFile(logPath, data.join(SEPARATOR) + '\n', err => {
            if (err) throw err;
        });
    }

    logSync (text) {
        const isoDate = new Date().toDateString();
        const logPath = path.join(config.backupLog, this.fileName);
        const data = [isoDate, text, "0"];
        fs.writeFileSync(logPath, data, "as");
    }

    getFullPath () {
        return path.join(config.backupLog, this.fileName);
    }

    async getArchiveToRemove(date) {
        const archives = [];
        try {
            const logPath = path.join(config.backupLog, this.fileName);
            const rl = createInterface({
                input: fs.createReadStream(logPath),
                crlfDelay: Infinity
            })
            rl.on("line", (line) => {
                if (line) {
                    const [dateISO, archiveName] = line.split(SEPARATOR);
                    const archiveDate = new Date(dateISO).getTime();
                    if (archiveDate < date.getTime())
                        archives.push(archiveName)
                }
            })
        } catch(error) {
            console.log("error reading file line by line: ", error.message);
        }
        return archives;
    }

    async getBackupList ({limit, skip}) {
        const backup = [];
        let position = 0;
        try {
            const logPath = path.join(config.backupLog, this.fileName);
            const rl = createInterface({
                input: fs.createReadStream(logPath),
                crlfDelay: Infinity
            });
            rl.on("line", (line) => {
                if (line) {
                    if (position >= skip && backup.length < limit) {
                        const [dataIso, archiveName, index] = line.split(SEPARATOR);
                        backup.push({
                            dataIso,
                            archiveName,
                            index
                        })
                    } 
                }
                position++;
            })
        } catch (error) {
            console.log("error when trying to fetch backup list: ", error.message);
        }
        return backup;
    }

    async getByIndex(index) {
        let backupInfo;
        try {
            const logPath = path.join(config.backupLog, this.fileName);
            const rl = createInterface({
                input: fs.createReadStream(logPath),
                crlfDelay: Infinity
            })
            rl.on("line", (line) => {
                if (line) {
                    const [dateIso, archiveName, indexData] = line.split(SEPARATOR);
                    if (parseInt(index) === parseInt(indexData)) {
                        backupInfo = {
                            dateIso,
                            archiveName,
                            index: indexData
                        }
                    }
                }
            })
        } catch (error) {
            console.log("error when getting content by index: ", error.message);
        }
        return backupInfo;
    }
}

module.exports = Log;