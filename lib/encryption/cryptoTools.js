const fs = require("node:fs");
const path = require("node:path");
const { unlink, readFile, writeFile, mkdir } = require("node:fs/promises");
const argon2 = require("argon2");
const crypto = require("crypto");
const { pipeline } = require("node:stream/promises");
const { Transform } = require("node:stream");
const vaultSession = require("./vaultSession");

const VAULT_FILE_PATH = path.join(__dirname, "../../", "data", ".vault.json");

exports.VAULT_FILE_PATH = VAULT_FILE_PATH;

exports.encryptFile = async (filePath) => {
    const dataIV = crypto.randomBytes(12);
    const masterKey = vaultSession.getMasterKey();
    const hash = crypto.createHash("sha256");
    const dataCipher = crypto.createCipheriv("aes-256-gcm", masterKey, dataIV);
    const filename = path.basename(filePath, ".zip");
    const dir = path.dirname(filePath);
    const parentDir = path.join(dir, filename);
    if (!fs.existsSync(parentDir))
        await mkdir(parentDir);
  
    const encryptedPath = path.join(parentDir, `${filename}.enc`)
  
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(encryptedPath);
    const hashStream = new Transform({
        transform(chunk, _, cb) {
            hash.update(chunk);
            cb(null, chunk);
        }
    })
    await pipeline(input, dataCipher, hashStream, output);
    await unlink(filePath); // delete original file if encryption is success

    const dataTag = dataCipher.getAuthTag();
    const metaHash = {
        dataIV: dataIV.toString("base64"),
        dataTag: dataTag.toString("base64"),
        parallelism: 4,
        memory: 256 * 1024,
        encryptedHash: hash.digest("hex")
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

const verifyEncryptedHash = (encPath, expectedHash) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256");
        const stream = fs.createReadStream(encPath);
        stream.on("data", chunk => hash.update(chunk));
        stream.on("error", reject);
        stream.on("end", () => {
            const actualHash = hash.digest("hex");
            if (actualHash === expectedHash) {
                resolve(true)
            } else {
                reject(new Error("Encrypted backup is corrupted or not complete"))
            }
        })
    })
}

exports.verifyEncryptedHash = verifyEncryptedHash;

exports.decryptDataPath = async (cryptDirPath) => {
    const name = path.basename(cryptDirPath);
    const cryptFilePath = path.join(cryptDirPath, `${name}.enc`);
    const decryptedFilePath = path.join(cryptDirPath, `${name}.zip`);
    const metaContent = await readFile(path.join(cryptDirPath, `${name}.meta.json`), "utf-8");
    const meta = JSON.parse(metaContent);
    const dataKeyIV = Buffer.from(meta.dataIV, "base64");
    const dataTag = Buffer.from(meta.dataTag, "base64");
    const masterKey = vaultSession.getMasterKey();

    if (meta.encryptedHash)
        await verifyEncryptedHash(cryptFilePath, meta.encryptedHash);

    const dataDecipher = crypto.createDecipheriv("aes-256-gcm", masterKey, dataKeyIV);
    dataDecipher.setAuthTag(dataTag);
    const input = fs.createReadStream(cryptFilePath);
    const output = fs.createWriteStream(decryptedFilePath);
    await pipeline(input, dataDecipher, output);
    await unlink(cryptFilePath);
    return decryptedFilePath;
}

exports.deriveMasterKey = async (passwordKey) => {
    const vaultJson = await readFile(VAULT_FILE_PATH);
    const vaultData = JSON.parse(vaultJson);
    const iv = Buffer.from(vaultData.encryptedMK.iv, "base64");
    const tag = Buffer.from(vaultData.encryptedMK.tag, "base64");
    const encrypted = Buffer.from(vaultData.encryptedMK.data, "base64");

    try {
        const decipher = crypto.createDecipheriv("aes-256-gcm", passwordKey, iv);
        decipher.setAuthTag(tag);   
        const masterKey = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return masterKey;
    } catch (error) {
        console.log("Derive master key: ", error.message);
        throw new Error("Password is not valid");
    }
}

exports.derivePasswordKey = async (password) => {
    const vaultJson = await readFile(VAULT_FILE_PATH);
    const vaultData = JSON.parse(vaultJson);
    const salt = Buffer.from(vaultData.salt, "base64");
   
    const passwordKey = await argon2.hash(password, {
        type: argon2.argon2id,
        salt,
        memoryCost: vaultData.memory,
        timeCost: vaultData.iterations,
        parallelism: vaultData.parallelism,
        hashLength: 32,
        raw: true
    })
    return passwordKey;
}

exports.generateVaultFile = async (password) => {
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
        encryptedMK: {
            iv: iv.toString("base64"),
            tag: tag.toString("base64"),
            data: encryptedMK.toString("base64")
        }
    }

    await writeFile(VAULT_FILE_PATH, JSON.stringify(vaultData));
    return passwordKey;
}   