const fs = require("node:fs");
const { unlink, readFile, writeFile } = require("node:fs/promises");
const chokidar = require("chokidar");
const path = require("node:path");
const archiver = require("archiver");
const readline = require("node:readline");
const argon2 = require("argon2");
const crypto = require("crypto");
const { pipeline } = require("node:stream");
const { prompt } = require("enquirer");
const zxcvbn = require("zxcvbn");

exports.getFormattedName = (name, date = new Date()) => {
    const year = date.getFullYear(), month = date.getMonth(), day = date.getDay(),
        hour = date.getHours(), minutes = date.getMinutes(), seconds = date.getSeconds();

    return `${name}_${year}-${month}-${day}_${hour}-${minutes}-${seconds}`;
}


exports.archivePath = (filePath, outPath) => {
    const archiveName = path.basename(outPath);
    const outName = archiveName.split(".").shift();

    return new Promise((resolve, _reject) => {
        // write backup into archive
        console.log("archive start")
        const output = fs.createWriteStream(outPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.directory(filePath, false);
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

exports.fileExists = async (fileName) => {
    try {
        await fs.access(fileName);
        return true;        
    } catch(err) {
        return false;
    }
}

exports.getDirSize = async (dir) => {
  let total = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isSymbolicLink()) continue;

    if (entry.isDirectory()) {
      total += await getDirSize(fullPath);
    } else if (entry.isFile()) {
      total += (await fs.stat(fullPath)).size;
    }
  }

  return total;
}

exports.encryptFile = async (filePath, masterKey) => {
    const dataIV = crypto.randomBytes(12);
    
    const dataCipher = crypto.createCipheriv("aes-256-gcm", masterKey, dataIV);
    const filename = path.basename(filePah, ".zip");
    const dir = path.dirname(filePah);
    const parentDir = path.join(dir, filename);
    await mkdir(fileDir);
  
    const encryptedPath = path.join(parentDir, `${filename}.enc`)
  
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(encryptedPath);
    pipeline(input, dataCipher, output, async (err) => {
        if (err) throw err;
        await unlink(filePath); // delete original file if encryption is success
    })

    const dataTag = dataCipher.getAuthTag();
    const metaHash = {
        dataIV,
        dataTag,
        parallelism: 4,
        memory: 256 * 1024
    }
    const writeMetaStream = fs.createWriteStream(path.join(parentDir, `${filename}.meta.json`))
    writeMetaStream.write(JSON.stringify(metaHash), null, 2);
    writeMetaStream.end();
    await new Promise((resolve, reject) => {
        writeMetaStream.on("finish", resolve);
        writeMetaStream.on("error", reject);
    })
    return parentDir;
}

exports.decryptFile = async (masterKey, cryptFilePath) => {
    const dir = path.dirname(cryptFilePath);
    const cryptFileName = path.basename(cryptFilePath, ".enc");
    const decryptedFilePath = path.join(dir, `${cryptFileName}.zip`);
    const metaContent = await readFile(path.join(dir, `${cryptFileName}.meta.json`), "utf-8");
    const meta = JSON.parse(metaContent);
    const dataKeyIV = Buffer.from(meta.dataIV, "hex");
    const dataTag = Buffer.from(meta.dataTag, "hex");

    const dataDecipher = crypto.createDecipheriv("aes-256-gcm", masterKey, dataKeyIV);
    dataDecipher.setAuthTag(dataTag);
    const input = fs.createReadStream(cryptFilePath);
    const output = fs.createWriteStream(decryptedFilePath);
    pipeline(input, dataDecipher, output, async (err) => {
        if (err) throw err;
        await unlink(cryptFilePath);
    });
    return decryptedFilePath;
}

exports.getNewPassword = async () => {
    while (true) {
        const { p1 } = await prompt({
            type: "password",
            name: "p1",
            message: "Enter new password"
        })

        const { p2 } = await prompt({
            type: "password",
            name: "p2",
            message: "Confirm password"
        })

        if (pwd.length < 14) {
            console.log("Too short — use at least 14 characters or a passphrase.");
            continue;
        }

        if (zxcvbn(pwd).score < 3) {
            console.log("This looks weak — consider a longer or more random passphrase.");
            continue;
        }

        if (p1 !== p2) {
            console.log("Passwords do not match");
            continue;
        }       
    }
}

exports.unlockVault = async (password) => {
    const vaultJson = await readFile(path.join(__dirname, "data", ".vault.json"));
    const vaultData = JSON.parse(vaultJson);
    const salt = Buffer.from(vaultData.salt, "base64");
    const iv = Buffer.from(vaultData.vault.iv, "base64");
    const tag = Buffer.from(vaultData.vault.tag, "base64");
    const encrypted = Buffer.from(vaultData.vault.data, "base64");

    const masterKey = await argon2.hash(password, {
        type: argon2.argon2id,
        salt,
        memoryCost: vaultData.memory,
        timeCost: vaultData.iterations,
        hashLength: 32,
        raw: true
    })

    try {
        const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, iv);
        decipher.setAuthTag(tag);
        const vaultKey = Buffer.concat([decipher.update(encrypted), decipher.final]);
        return vaultKey;
    } catch (error) {
        throw new Error("Password is not valid");
    }
}

exports.generateVault = async (password) => {
    const salt = crypto.randomBytes(16);
    const masterKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    const passwordKey = await argon2.hash(password, {
        type: argon2.argon2id,
        salt,
        memoryCost: 64 * 1024,
        timeCost: 3,
        parallelism: 1,
        hashLength: 32,
        raw: true
    });

    const cipher = crypto.createCipheriv("aes-256-gcm", passwordKey, iv);
    const encryptedMK = Buffer.concat([ cipher.update(masterKey), cipher.final() ]);
    const tag = cipher.getAuthTag();
    const vaultData = {
        kdf: "argon2id",
        memory: 64 * 1024,
        iterations: 3,
        parallelism: 1,
        salt: salt.toString("base64"),
        vault: {
            iv: iv.toString("base64"),
            tag: tag.toString("base64"),
            data: encryptedMK
        }
    }

    await writeFile(path.join(__dirname, "data", ".vault.json"), JSON.stringify(vaultData));
}

exports.getFileLists = getFileLists;
