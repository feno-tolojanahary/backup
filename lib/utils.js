const fs = require("node:fs");
const chokidar = require("chokidar");
const path = require("node:path");
const archiver = require("archiver");
const readline = require("node:readline");
const { config } = require("../config");

exports.getFormattedName = (name, date = new Date()) => {
    const year = date.getFullYear(), month = date.getMonth(), day = date.getDay(),
        hour = date.getHours(), minutes = date.getMinutes(), seconds = date.getSeconds();

    return `${name}_${year}-${month}-${day}-${hour}-${minutes}-${seconds}`;
}

exports.archivePath = (filePath, outPath) => {
    const archiveName = path.basename(outPath);
    const outName = archiveName.split(".").shift();

    return new Promise((resolve, _reject) => {
        // write backup into archive
        console.log("archive start")
        const output = fs.createWriteStream(outPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.directory(filePath);
        output.on("close", () => {
            console.log("archiving file done: " + archiveName)
            resolve(archiveName);
        })
        archive.pipe(output);
        archive.on("error", function (err) {
            console.log("error archiving: ", err.message);
            reject(err);
        });
        archive.on("warning", function (err) {
            if (err.code === "ENOENT") {
                console.log("warning archiving file: ", err.message)
            } else {
                // throw error
                console.log("error archiving: ", err.message);
                reject(err);
            }
        });
        archive.finalize();
    })
}

exports.copyFile = (filePath, cpPath) => {
    const reader = fs.createReadStream(filePath);
    const writer = fs.createWriteStream(cpPath);    
    // reader.on('data', (chunk) => {
    // })
    reader.pipe(writer)
}

function getFileLists(folderPath) {
    let fileLists = [];
    const list = fs.readdirSync(folderPath, (fileName) => path.join(folderPath, fileName));
    
    for (const filePah of list) {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
            fileLists.push({ path: filePah, type: "file" });
        } else if (stats.isDirectory()) {
            const childrens = getFileLists(filePath);
            fileLists.push({ path: filePah, type: "folder" });
            fileLists = fileLists.concat(childrens);    
        }
    }

    return fileLists;
}

exports.watchLogFile = (filePath, numLines = 10, startText) => {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    let bufferSize = 1024;
    let filePos = fileSize;
    let lines = [];
    let buffer;
    const fd = fs.openSync(filePath, "r");

    while(lines.length <= numLines && filePos > 0) {
        filePos = Math.max(0, filePos - bufferSize);
        const chunkSize = Math.min(bufferSize, fileSize - filePos);
        buffer = Buffer.alloc(chunkSize);

        fs.readSync(fd, buffer, 0, chunkSize, filePos);

        const chunkLines = buffer.toString("utf-8").split("\n");
        lines = [...chunkLines, ...lines];

    }
    
    lines = lines.slice(-numLines)
                .map(text => `${startText}: ${text}`);
    
    console.log(lines.join("\n"));

    let lastSize = fileSize;

    const watcher = chokidar.watch(filePath, {
        usePolling: true,
        interval: 1000,
        awaitWriteFinish: false
    })

    watcher.on("change", async (path) => {
        const newFileStat = fs.statSync(filePath);
        if (newFileStat.size > lastSize) {
            const rl = readline.createInterface({
                input: fs.createReadStream(filePath, { start: lastSize })
            })
            rl.on("line", (line) => {
                console.log(`${startText}: ${line}`)
            })
            rl.on("close", () => {
                lastSize = newFileStat.size;
            })
        } else if (newFileStat.size < lastSize) {
            lastSize = 0;
        }
    })
}

exports.getFileLists = getFileLists;

