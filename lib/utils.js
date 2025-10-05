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

