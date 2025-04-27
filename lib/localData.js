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
        fs.writeFileSync(this.dataPath, data, "a");
    }

    read() {
        const data = fs.readFileSync(this.dataPath);
        return data;
    }
}

module.exports = LocalData;