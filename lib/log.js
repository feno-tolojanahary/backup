class Log {

    constructor(fileName) {
        this.fileName = fileName;
    }
    
    async readLogFile() {
        const readLog = util.promisify((callback) => {
            const logPath = path.join(config.backupLog, fileName);
            fs.readFile(logPath, "utf-8", callback);
        })
        const data = await readLog();
        return data;
    }

    async log(text) {
        const logPath = path.join(config.backupLog, "backup.log");
        await fs.appendFile(logPath, text + '\n', err => {
            if (err) throw err;
        });
    }
}

module.exports = Log;