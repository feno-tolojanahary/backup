const vaultSession = require("./vaultSession");
const { deriveMasterKey, derivePasswordKey, generateVaultFile } = require("./cryptoTools")

const unlockVault = async (password) => {
    try {
        const pk = await derivePasswordKey(password);
        const mk = await deriveMasterKey(pk);
        pk?.fill(0);
        await vaultSession.unlock(mk);
        mk?.fill(0);
        return true;
    } catch (error) {
        console.log("unable to unlock vault: ", error);
        return false;
    }
}

const lockVault = async () => {
    await vaultSession.lock();
    return true;
}

const newPassVault = async (password) => {
    try {
        const passwordKey = await generateVaultFile(password);
        // unlock vault
        const masterKey = await deriveMasterKey(passwordKey);
        passwordKey?.fill(0);
        await vaultSession.unlock(masterKey);
        masterKey?.fill(0);
        return true;
    } catch (error) {
        console.log("Error add new password vault session: ", error.message);
        return false;
    }
}

module.exports = {
    unlockVault,
    newPassVault,
    lockVault
}