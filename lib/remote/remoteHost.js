const fs = require("node:fs/promises");
const path = require("path");
// const { config } = require("./../../config");
const Client = require("ssh2-sftp-client");

class RemoteHandler {
    sftp = null;
    sshConfig = {};
    hostConfig = {};

    constructor(localConfig) {
        this.sftp = new Client();
        this.sshConfig = {
            host: localConfig.host,
            port: localConfig.port,
            username: localConfig.username
        };
        if (localConfig.privateKey) {
            this.sshConfig.privateKey = path.join(__dirname, "../../keys", localConfig.privateKey);
            if (localConfig.passphrase) {
                this.sshConfig.passphrase = localConfig.passphrase;
            }
        } else if (localConfig.password) {
            this.sshConfig.password = sshConfig.password;
        }
        this.hostConfig = {...localConfig};
    }
    
    async connect () {
        if (this.sshConfig.privateKey) {
            this.sshConfig.privateKey = await fs.readFile(this.sshConfig.privateKey);
        }
        await this.sftp.connect(this.sshConfig);
        // console.log("connected to remote host")
    }

    async disconnect () {
        await this.sftp.end();
        // console.log("deconnected to remote host")
    }
 
    async remoteDirExists (remoteDir) {
        try {
            await this.sftp.stat(remoteDir);
            return true;
        } catch (err) {
            if (err.code === "ENOENT") {
                return false;
            }
            throw err;
        }
    }

    async ensureRemoteDir(remoteDir) {
        try {   
            await this.sftp.stat(remoteDir);
        } catch (err) {
            if (err.code === "ENOENT") {
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
                console.log(`Destination folder for ${path} doesn't exist`)
            } else if (err.code === "ENOENT") {
                console.log(`The path "${path}" does not exists`)
            } else {
                console.log(err.message);
            }
            return false;
        }
    }

    async getFolderSize(remotePath = null) {
        if (!remotePath) 
            remotePath = this.getWorkingDir();
        const list = await this.sftp.list(remotePath);
        let total = 0;

        for (const item of list) {
            const fullPath = `${remotePath}/${item.name}`;
            if (item.type === 'd') {
                total += await this.getFolderSize(fullPath); // recursive
            } else {
                total += item.size; // accumulate file sizes
            }
        }
        return total;
    }

    async getFileList(remotePath = null) {
        if (!remotePath) 
            remotePath = this.getWorkingDir();
        const fileList = await this.sftp.list(remotePath);
        return fileList;
    }

    getWorkingDir () {
        return this.hostConfig.destinationFolder || `/home/${this.hostConfig.username}/backup-data`;
    }

    async uploadFile(filePath, destFolder) {
        try {
            const remoteWorkingDir = destFolder || this.getWorkingDir();
            const hasPermission = await this.#haveWritePermission(remoteWorkingDir);
            if (!hasPermission) {
                console.log(`Unable to write on the following folder: ${remoteWorkingDir}`);
                return;
            }
            const storagePath = path.basename(filePath);
            const dstPath = path.posix.join(remoteWorkingDir, storagePath);
            await this.sftp.fastPut(filePath, dstPath);
            console.log("Uploaded file to the server");
            return {
                dstPath,
                storagePath,
                type: "file"
            }
        } catch (error) {
            console.log(error);
            return;
        } 
    }

    async uploadDir(dirPath, destFolder) {
        try {
            const remoteFolder = destFolder || this.getWorkingDir();
            if (destFolder !== this.getWorkingDir())
                await this.ensureRemoteDir(remoteFolder);
            const hasPermission = await this.#haveWritePermission(remoteFolder);
            if (!hasPermission) {
                console.log(`Unable to write on the following folder: ${remoteFolder}`);
                return;
            }

            const res = await this.sftp.uploadDir(dirPath, remoteFolder);
            return {
                dstPath: remoteFolder,
                storagePath: path.basename(dirPath),
                type: "folder"
            };
        } catch (error) {   
            console.log("Error, upload dir remote: ", error.message);
            return;
        }
    }

    async removeEntry(entryPath, isDir = false) {
        try {
            const remoteWorkingDir = this;this.getWorkingDir();
            const remotePath = path.posix.join(remoteWorkingDir, path.basename(entryPath));
            const hasPermission = await this.#haveWritePermission(remotePath);
            if (!hasPermission) {
                console.log(`Error: permission denied, unable to deelte: ${remotePath}`);
                return;
            }
            let res;
            if (isDir) {
                console.log("the following remote path should be removed: ", remotePath)
                res = await this.sftp.rmdir(remotePath, true)
            } else {
                res = await this.sftp.delete(remotePath);
            }
            return res;
        } catch (error) {
            console.log(error.message);
            return false;
        } 
    }

    async downloadFile(fileName, localDestPath) {
        try {
            const workingDir = this.getWorkingDir();
            const filePath = path.posix.join(workingDir, fileName);
            await this.sftp.fastGet(filePath, localDestPath);
            return localDestPath;
        } catch (error) {
            console.log(error);
        } 
    }

    async downloadDir(dirName, localDestPath) {
        try {
            const workingDir = this.getWorkingDir();
            const filePath = path.posix.join(workingDir, dirName);
            await this.sftp.downloadDir(filePath, localDestPath);
            return localDestPath;
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = RemoteHandler;