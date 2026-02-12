"use strict";

let masterKey = null;

function unlock(masterKeyBytes) {
    if (!Buffer.isBuffer(masterKeyBytes)) {
        throw new Error("master key must be a buffer");
    }

    if (masterKey) {
        masterKey.fill(0);
    }

    masterKey = Buffer.from(masterKeyBytes);
}

function lock() {
    masterKey.fill(0);
    masterKey = null;
}

function getMasterKey() {
    if (!masterKey) {
        throw new Error("Vault is locked");
    }

    return masterKey;
}

module.exports = {
    unlock,
    lock,
    getMasterKey
}