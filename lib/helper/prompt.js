const { prompt } = require("enquirer");
const zxcvbn = require("zxcvbn");
const { derivePasswordKey, deriveMasterKey } = require("./../../lib/encryption/cryptoTools") 
const vaultSession = require("./../../lib/encryption/vaultSession");
const MAX_ATTEMPT = 5;
const FAILED_TEMEOUT = 2000;

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
        return p1;       
    }
}

exports.unlockVault = async () => {
    let attempt = 0;
    while (attempt < MAX_ATTEMPT) {
        const { password} = await prompt({
            type: "password",
            name: "password",
            message: "Enter password"
        })

        try {
            const pk = await derivePasswordKey(password);
            const mk = await deriveMasterKey(pk);
            pk.fill(0);
            vaultSession.unlock(mk);
            mk.fill(0);
            break;
        } catch (err) { 
            console.log("Invalid password.");
            await new Promise(r => setTimeout(r, FAILED_TEMEOUT));
            continue;
        }
    }   
}

