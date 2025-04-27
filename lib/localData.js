const fs = require("node:fs");
const path = require("node:path");

const folderPath = path.join(__dirname, "..", "data");

class LocalData {
    fileName = "backup";
    dataPath = "";

    constructor() {  
        if(!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
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

module.exports = LocalData;