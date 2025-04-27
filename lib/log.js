const { config } = require("../config");
const path = require('node:path');
const fs = require('node:fs');

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
        const data = [isoDate, text, "0"];
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
            await once(rl, "close");
        } catch(error) {
            console.log("error reading file line by line: ", error.message);
        }
        return archives;
    }
}

module.exports = Log;