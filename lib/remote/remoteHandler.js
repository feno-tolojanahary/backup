const path = require("path");
const { ulid } = require("ulid");
const { config } = require("../../config");
const RemoteHost = require("./remoteHost");
const { backupEvent } = require("./../helper/event");

function getHostConfig(hostName) {
    let hostConf = {};
    if (hostName) {
        const foundConf = config.hosts.find((conf) => conf.host === hostName);
        if (!foundConf) {
            console.log(`The host ${hostName} is not found on the configuration file`);
            return;
        }
        hostConf = foundConf;
    } else {
        hostConf = config.hosts[0];
    }
    return hostConf;
}

async function removeOverFlowFiles({hostConf, rmNumber = 3, newUploadSize = 0} = {}) {
    try {
        const remoteHost = new RemoteHost(hostConf);
        await remoteHost.connect();
        const workingDir = remoteHost.getWorkingDir();
        const existWorkingDir = await remoteHost.remoteDirExists(workingDir);
        if (!existWorkingDir) 
            return;
        
        const folderSize = await remoteHost.getFolderSize();
        const previewTotalSize = (folderSize / 1024 / 1024) + newUploadSize
        if (previewTotalSize < hostConf.maxDiskUsage) {
            return;
        } 

        const listFile = await remoteHost.getFileList()
        // remove 3 old files
        const toRemoveFiles = listFile.sort((a, b) => a.modifyTime - b.modifyTime)
                                    .slice(0, rmNumber);
        for (const file of toRemoveFiles) {
            await remoteHost.removeFile(file.storagePath);
            backupEvent("backup_delete", { storagePath: file.storagePath, storage: "remote" })
        }
        await remoteHost.disconnect();

        // await fs.appendFile(archiveFile, dataArchiveLog);
    } catch (error) {
        console.log("Error when removing old file: ", error.message)
    }
}

exports.sendToRemoteServers = async (metaBackup, { isDir = false } = {}) => {
    let filePath;
    if (isDir) {
        filePath = metaBackup.encryptedDirPath;
    } else {
        filePath = path.join(config.workingDirectory, metaBackup.storagePath);
    }
    const metaBackups = [];
    let info;
    let hasSendingSuccess = false;
    for (const hostConf of config.hosts) {
        try {
            const remoteHost = new RemoteHost(hostConf);
            await remoteHost.connect();
            if (isDir) {
                console.log("path to send: ", filePath)
                const destFolder = path.join(hostConf.destinationFolder, path.basename(filePath));
                info = await remoteHost.uploadDir(filePath, destFolder);
                console.log("file is uploaded: ", info)
            } else {
                info = await remoteHost.uploadFile(filePath, hostConf.destinationFolder);
            }
            metaBackup.path = info.dstPath;
            info.backupId = ulid()
            info.destinationFolder = hostConf.destinationFolder;
            metaBackups.push(info);
            await remoteHost.disconnect();
            hasSendingSuccess = true;
        } catch (error) {
            console.log("Host %s. Error: %s", hostConf.host, error.message)
        }
    }
    if (hasSendingSuccess) {
        backupEvent.emit("backup_success", { ...metaBackup, storage: "remote", ...info })
    } else {
        backupEvent.emit("backup_failed", { ...metaBackup, storage: "remote", ...info })
    }
    return metaBackups;
}

exports.sendToRemoteServer = async (metaBackup, hostName, destPath) => {
    try {
        const filePath = path.join(config.workingDirectory, metaBackup.storagePath);
        const hostConf = getHostConfig(hostName);
        const remoteHost = new RemoteHost(hostConf);
        await remoteHost.connect(); 
        const info = await remoteHost.uploadFile(filePath, destPath);
        await remoteHost.disconnect();
        backupEvent.emit("backup_success", { ...metaBackup, storage: "remote", ...info })
        return info;
    } catch (error) {
        console.log(error.message);
        backupEvent.emit("backup_failed", { ...metaBackup, storage: "remote" })
    }
}

exports.downloadFileFromServer = async (fileName, hostName, dstPath = null) => {
    try {
        const hostConf = getHostConfig(hostName);
        
        if (!dstPath)
            dstPath = path.join(config.workingDirectory, fileName);
        const remoteHost = new RemoteHost(hostConf);
        await remoteHost.connect();
        await remoteHost.downloadFile(fileName, dstPath);
        await remoteHost.disconnect();
        return dstPath;
    } catch (error) {
        console.log(error);
    }
}

exports.downloadDirFromServer = async (dirName, hostName, dstPath) => {
    try {
        const hostConf = getHostConfig(hostName);
        
        if (!dstPath)
            dstPath = path.join(config.workingDirectory, dirName);
        const remoteHost = new RemoteHost(hostConf);
        await remoteHost.connect();
        await remoteHost.downloadDir(filename, dstPath);
        await remoteHost.disconnect();
        return dstPath;
    } catch (error) {
        console.log(error);
    }
}

const hasConnectedServers = async () => {
    try {
        const hosts = config.hosts;
        for (const hostConf of hosts) {
            try {
                const remoteHost = new RemoteHost(hostConf);
                await remoteHost.connect();
                await remoteHost.disconnect();
                return true;
            } catch (_e) {}
        }
        return false;
    } catch (error) {
        console.log(error);
    }
}

const confConnectedServers = async () => {
    try {
        const configs = [];
        const hosts = config.hosts;
        for (const hostConf of hosts) {
            try {
                const remoteHost = new RemoteHost(hostConf);
                await remoteHost.connect();
                await remoteHost.disconnect();
                configs.push(hostConf);
            } catch (_e) {}
        }
        return configs;
    } catch (error) {
        console.log(error);
        return []
    }
}

exports.hasConnectedServers = hasConnectedServers;


exports.removeOverFlowFileServer = async ({ hostName, rmNumber, newUploadSize = 0 }) => {
    try {
        const hostConf = getHostConfig(hostName);
        await removeOverFlowFiles({ hostConf, rmNumber, newUploadSize });
    } catch (error) {
        console.log("Error when removing old file: ", error.message)
    }
}

exports.removeOverFlowFileServers = async ({rmNumber = 3, newUploadSize = 0} = {}) => {
    try {
        for (const hostConf of config.hosts) {
            try {
                await removeOverFlowFiles({ hostConf, rmNumber, newUploadSize });
            } catch(err) {}
        }
    } catch (error) {
        console.log("Error when removing old file: ", error.message)
    }
}

exports.getRemoteBackupList = async (hostName = null) => {
    try {
        const hostConf = getHostConfig(hostName);
        const remoteHost = new RemoteHost(hostConf);
        await remoteHost.connect();
        const fileList = await remoteHost.getFileList();
        await remoteHost.disconnect();
        return fileList;
    } catch(_err) {
        return [];
    }
}


exports.removeRemoteArchives = async (archives, hostName = null) => {
    if (!Array.isArray(archives) || archives.length === 0)
        return;

    console.log("removing remote archive");
    const hostConf = getHostConfig(hostName);
    const remoteHost = new RemoteHost(hostConf);
    await remoteHost.connect();
    for (const backup of archives) {
        const isDir = backup.isEncrypted || backup.type === "d";
        const res = await remoteHost.removeEntry(backup.storagePath, isDir);
        if (res) {
            backupEvent.emit("backup_delete", { storagePath: backup.storagePath, storage: "remote" })
        }
    }

}

exports.removeArchive = async (storagePath) => {
    const hostConf = getHostConfig();
    const remoteHost = new RemoteHost(hostConf);
    await remoteHost.connect();
    const isDir = !storagePath.endsWith(".zip");
    const res = await remoteHost.removeEntry(storagePath, isDir);
    await remoteHost.disconnect();
    backupEvent.emit("backup_delete", { storagePath: storagePath, storage: "remote" });
    return Boolean(res);
}

const hasRemoteDefinedConfig = () => {
    return config.hosts.length > 0
            && config.hosts[0].host
            && config.hosts[0].port
            && config.hosts[0].username
            && (config.hosts[0].password || config.hosts[0].privateKey)
}

exports.hasRemoteDefinedConfig = hasRemoteDefinedConfig;

exports.ensureDestFolder = async () => {
    if (!hasRemoteDefinedConfig)
        return;
    try {
        if ((await hasConnectedServers())) {
            const confServers = await confConnectedServers();
            for (const conf of confServers) {
                try {
                    const remoteHost = new RemoteHost(conf);
                    await remoteHost.connect();
                    await remoteHost.ensureRemoteDir(conf.destinationFolder);
                    await remoteHost.disconnect();
                } catch (err) {
                    console.log(`Host: ${conf.host}. Unable to create directory ${conf.destinationFolder}. `, err.message);
                }
            }
        }
    } catch (err) {
        // console.log("Error ensuring remote dir: ", err.message);
    }
}