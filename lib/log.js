const { config } = require("../config");
const path = require('node:path');
const fs = require('node:fs');
const util = require("node:util")
    const s3Handler = require("./s3Handler");
const { createInterface } = require("readline");
const { readFile, writeFile, appendFile } = require('node:fs/promises');

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

    async log(text, trackInfo = {}) {
        const isoDate = new Date().toISOString();
        const logPath = path.join(config.backupLog, this.fileName);
        let lastIndex = 0;
        try {
            lastIndex = await readFile(".lastIndex", { encoding: "utf8" });
        } catch (_error) { }
        const index = parseInt(lastIndex ?? 0) + 1;
        const isRemovedWasabi = 0, isRemovedHost = 0;
        const trackInfoArr = [+trackInfo.wasabi, +trackInfo.remote, isRemovedWasabi, isRemovedHost]
        const data = [isoDate, text, index, ...trackInfoArr];    
        await writeFile(".lastIndex", `${index}`, { encoding: "utf8" });
        await appendFile(logPath, data.join(SEPARATOR) + '\n', err => {
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
            for await (const line of rl) {
                if (line) {
                    const [dateISO, archiveName] = line.split(SEPARATOR);
                    const archiveDate = new Date(dateISO).getTime();
                    if (archiveDate < date.getTime())
                        archives.push(archiveName)
                }  
            }
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
            for await (const line of rl)  {
                if (line) {
                    if (position >= skip) {
                        const [dataIso, archiveName, index] = line.split(SEPARATOR);
                        backup.push({
                            dataIso,
                            archiveName,
                            index
                        })
                    } 
                }
                if (backup.length === limit) 
                    break;
                position++;
            }
        } catch (error) {
            console.log("error when trying to fetch backup list: ", error.message);
        }
        return backup;
    }

    async getByName(backupName) {
        let backupInfo;
        try {
            const logPath = path.join(config.backupLog, this.fileName);
            const rl = createInterface({
                input: fs.createReadStream(logPath),
                crlfDelay: Infinity
            })
            for await (const line of rl) {
                if (line) {
                    const [dateIso, archiveName, indexData] = line.split(SEPARATOR);
                    if (backupName === archiveName) {
                        backupInfo = {
                            dateIso,
                            archiveName,
                            index: indexData
                        }
                    }
                }
            }
        } catch (error) {
            console.log("error when getting content by index: ", error.message);
        }
        return backupInfo;
    }

    async syncForWasabi() {
        const fileContents = await s3Handler.listS3Backup();
        const existFileNames = fileContents.map((file) => file.Key);
        
    }
}

module.exports = Log;