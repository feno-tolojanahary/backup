const fs = require("node:fs");
const path = require("node:path");
const archiver = require("archiver");
const readline = require("node:readline");
const { config } = require("../config");

exports.getFormattedName = (name, date = new Date()) => {
    const year = date.getFullYear(), month = date.getMonth(), day = date.getDay(),
        hour = date.getHours(), minutes = date.getMinutes(), seconds = date.getSeconds();

    return `${name}_${year}-${month}-${day}-${hour}-${minutes}-${seconds}`;
}

const getFileName = (path) => path.split("/").pop();

exports.archivePath = (filePath, outPath) => {
    const archiveName = getFileName(outPath);
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

exports.diffContent = (updatedFile, localFile) => {
    const existingLines = [], newLines = [], diffLine = [];
    
    let leftLineMoved = 0, rightLineMoved = 0;
    const diffPath = path.join(config.dataDirectory, "diff-"+localFile.replaceAll("/", "-"));
    const localReader = fs.createReadStream(localFile);
    const updateReader = fs.createReadStream(updatedFile);

    let localLineNbr = 1, updateLineNbr = 1;
    let lineMove = 0;
    
    const rlLocal = readline.createInterface({
        input: localReader,
        crlfDelay: Infinity
    });
    
    const rlUpdate = readline.createInterface({
        input: updateReader,
        crlfDelay: Infinity
    })

    for await (const line of rlLocal) {
        existingLines.push({ lineNbr: localLineNbr, line });
        localLineNbr++;
    }

    for await (const line of rlUpdate) {
        newLines.push({ lineNbr: updateLineNbr, line });
        updateLineNbr++;
    }

    // eliminate identical lines
    const maxLine = newLines.length > existingLines.length ? newLines + 1 : existingLines + 1;
    let leftLineMove = 0; rightLineMove = 0;

    for (let lineNbr = 1;lineNbr < maxLine; lineNbr++) {
        const leftCurrentLine = lineNbr + leftLineMove;
        const rightCurrentLine = lineNbr + rightLineMoved;
        
        if (newLines[leftCurrentLine] !== existingLines[rightCurrentLine]) {
            
        }
    }
    
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

exports.getFileLists = getFileLists;

