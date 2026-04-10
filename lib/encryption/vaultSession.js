"use strict";
const path = require("path");
const fs = require("fs/promises");
const { entryExists } = require("../helper/utils");
const { existsSync } = require("fs");

let masterKey = null;
const masterKeyPath = path.join(__dirname, "../../", "keys", "master-key.enc")

async function unlock(masterKeyBytes) {
    if (!Buffer.isBuffer(masterKeyBytes)) {
        throw new Error("master key must be a buffer");
    }
    console.log("vault is unlocked.")
    if (masterKey) {
        masterKey.fill(0);
    }
    
    await fs.writeFile(masterKeyPath, masterKeyBytes.toString("base64"))
    masterKey = Buffer.from(masterKeyBytes);
}

async function lock() {
    console.log("vault is locked.")
    await fs.unlink(masterKeyPath)
    masterKey.fill(0);
    masterKey = null;
}

async function getMasterKey() {
    if (masterKey) return masterKey;
    if (!(await existsSync(masterKeyPath)))
        throw new Error("Vault is locked.");
    const savedMasterKey = await fs.readFile(masterKeyPath, { encoding: "utf-8" });
    return Buffer.from(savedMasterKey, "base64");
}

module.exports = {
    unlock,
       lock,
    getMasterKey
}