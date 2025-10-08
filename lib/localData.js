const fs = require("node:fs");
const path = require("node:path");

const folderPath = path.join(__dirname, "..", "data");

class LocalData {
    fileName;
    dataPath = "";

    constructor(filename) {  
        if(!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
        this.fileName = filename;
        this.dataPath = path.join(folderPath, this.fileName);
    }

    save(data) {
        fs.writeFileSync(this.dataPath, data);
    }

    read() {
        const data = fs.readFileSync(this.dataPath);
        return data;
    }

    empty() {
        fs.writeFileSync(this.dataPath, '');
    }
}

class ProcessData extends LocalData {
    constructor() {
        super("backup")
    }
}

class HistoryData extends LocalData {
    constructor() {
        super("history");
    }

    write(data) {
        fs.appendFileSync(this.dataPath, data)
    }
}

exports.HistoryData = HistoryData;
exports.ProcessData = ProcessData;