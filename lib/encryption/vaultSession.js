"use strict";

let masterKey = null;
let autoLockTimer = null;

const TTL_MS_MK = 10 * 60 * 1000;

function unlock(masterKeyBytes, ttlMs = TTL_MS_MK) {
    if (!Buffer.isBuffer(masterKeyBytes)) {
        throw new Error("master key must be a buffer");
    }

    if (masterKey) {
        masterKey.fill(0);
    }

    clearTimeout(autoLockTimer);
    setTimeout(lock, ttlMs);

    masterKey = Buffer.from(masterKeyBytes);
}

function lock() {
    masterKey.fill(0);
    masterKey = null;
    clearTimeout(autoLockTimer);
}

function getMasterKey() {
    if (!masterKey) {
        throw new Error("Vault is locked");
    }

    clearTimeout(autoLockTimer),
    setTimeout(lock, TTL_MS_MK);

    return masterKey;
}

exports.module = {
    unlock,
    lock,
    getMasterKey
}