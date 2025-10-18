const fs = require("node:fs/promises");
const path = require("path");
const config = require("./../../config");
const Client = require("ssh2-sftp-client");

class RemoteHandler {
    sftp = null;
    sshConfig = {};

    constructor(localConfig) {
        this.sftp = new Client();
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

    async #haveWritePermission(path) {
        try {
            const stats = await this.sftp.stat(path);
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
            return false;
        }
    }

    async #openWorkingDirRemote(destFolder) {
        if (this.sshConfig.privateKey) {
            this.sshConfig.privateKey = await fs.readFile(this.sshConfig.privateKey);
        }
        try {
            await this.sftp.connect(this.sshConfig);
        } catch (error) {
            console.log("Unable to connect to the server: ", error.message);
            return false;
        }
        let dstFolder = destFolder || config.host.destinationFolder || `/home/${this.sshConfig.username}`;
        const subDir = config.host.parentFolder || "backupDB";
        const parentFolderWritable = await this.#haveWritePermission(dstFolder);
        if (!parentFolderWritable) {
            console.log(`The folder "${dstFolder}" is not writable`);
            return;
        }
        const workingDir = path.join(dstFolder, subDir);
        await this.#ensureRemoteDir(workingDir);
        return workingDir
    }

    async uploadFile(filePath, destFolder) {
        try {
            const remoteWorkingDir = await this.#openWorkingDirRemote(destFolder);
            if (!remoteWorkingDir) {
                return;
            }
            const dstPath = path.join(remoteWorkingDir, path.basename(filePath));
            await this.sftp.fastPut(filePath, dstPath);
            console.log("Uploaded file to the server");
            return {
                dstPath
            }
        } catch (error) {
            console.log(error);
        } finally {
            this.sftp.close();
        }
    }

    async removeFile(fileSubPath) {
        try {
            const remoteWorkingDir = await this.#openWorkingDirRemote(destFolder);
            if (!remoteWorkingDir) {
                return;
            }
            const filePath = path.join(remoteWorkingDir, fileSubPath);
            const haveWritePermission = await this.#haveWritePermission(filePath);
            if (!haveWritePermission) {
                console.log("EPERMISSION: Don't have the permission to remote the file");
                return;
            }
            await this.sftp.delete(filePath);
        } catch (error) {
            console.log(error);
        } finally {
            this.sftp.close();
        }
    }
}

module.exports = RemoteHandler;