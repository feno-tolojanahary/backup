const fs = require("node:fs/promises");
const path = require("path");
const config = require("./../../config");
const Client = require("ssh2-sftp-client");

class RemoteHandler {
    sftp = null;
    sshConfig = {};

    constructor() {
        this.sftp = new Client();
        const localConfig = config.host;
        this.sshConfig = {
            host: localConfig.host,
            port: localConfig.port,
            username: localConfig.username
        };
        if (localConfig.privateKey) {
            this.sshConfig.privateKey = localConfig.privateKey;
            if (localConfig.passphrase) {
                this.sshConfig.passphrase = localConfig.passphrase;
            }
        } else if (localConfig.password) {
            this.sshConfig.password = sshConfig.password;
        }
    }
 
    async #ensureRemoteDir(remoteDir) {
        try {
            await this.sftp.stat(remoteDir);
        } catch (err) {
            if (err.code === 2) {
             await this.sftp.mkdir(remoteDir, true); 
            } else {
                throw err; // unknown error
            }
        }
    }

    async #canWriteToDir(dir) {
        try {
            const stats = await this.sftp.stat(dir);
            const mode = stats.mode;
            const permissions = mode & 0o777;
            const ownerWritable = (permissions & 0o200) !== 0;
            const groupWritable = (permissions & 0o020) !== 0;
            const otherWritable = (permissions & 0o002) !== 0;

            return ownerWritable || groupWritable || otherWritable;
        } catch (err) {
            if (err.code === 2) {
                console.log("Destination folder doesn't exist")
            } else {
                console.log("Error checking write permission directory: ", err.message);
            }
        }
    }

    async uploadFile(filePath, destFolder) {
        if (this.sshConfig.privateKey) {
            this.sshConfig.privateKey = await fs.readFile(this.sshConfig.privateKey);
        }
        await this.sftp.connect(this.sshConfig);
        let dstFolder = destFolder || config.host.destinationFolder || `/home/${this.sshConfig.username}`;
        const remoteDir = config.host.parentFolder || "backupDB";
        const parentFolderWritable = await this.#canWriteToDir(dstFolder);
        if (!parentFolderWritable) {
            console.log(`The folder "${dstFolder}" is not writable`);
            return;
        }
        await this.#ensureRemoteDir(remoteDir);
        const dstFileName = path.basename(filePath);
        await this.sftp.fastPut(filePath, dstFileName);
        console.log("Uploaded file to the server");
    }

}

module.exports = RemoteHandler;