const path = require("path");
const { config } = require("../../config");
const RemoteHost = require("./remoteHost");
const { removeLog } = require("./../backupLog");
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
            await remoteHost.removeFile(file.name);
            const dataLog = { name: file.name, storage: "remote", deletedDate: new Date(), handler: "overflow" };
            removeLog.objLog(dataLog);
        }
        await remoteHost.disconnect();

        // await fs.appendFile(archiveFile, dataArchiveLog);
    } catch (error) {
        console.log("Error when removing old file: ", error.message)
    }
}

exports.sendToRemoteServers = async (backupInfo, { isDir = false } = {}) => {
    let filePath;
    if (isDir) {
        filePath = backupInfo.encryptedDirPath;
    } else {
        filePath = path.join(config.workingDirectory, backupInfo.name);
    }
    const backupInfos = [];
    let info;
    let hasSendingSuccess = false;
    for (const hostConf of config.hosts) {
        try {
            const remoteHost = new RemoteHost(hostConf);
            await remoteHost.connect();
            if (isDir) {
                console.log("path to send: ", filePath)
                info = await remoteHost.uploadDir(filePath, hostConf.destinationFolder);
            } else {
                info = await remoteHost.uploadFile(filePath, hostConf.destinationFolder);
            }
            console.log("send file to a remote server done: ", info)
            backupInfos.push(info);
            await remoteHost.disconnect();
            hasSendingSuccess = true;
        } catch (error) {
            console.log("Host %s. Error: %s", hostConf.host, error.message)
        }
    }
    if (hasSendingSuccess) {
        backupEvent.emit("backup_success", { ...backupInfo, storage: "remote" })
    } else {
        backupEvent.emit("backup_failed", { ...backupInfo, storage: "remote" })
    }
    return backupInfos;
}

exports.sendToRemoteServer = async (backupInfo, hostName, destPath) => {
    try {
        const filePath = path.join(config.workingDirectory, backupInfo.name);
        const hostConf = getHostConfig(hostName);
        const remoteHost = new RemoteHost(hostConf);
        await remoteHost.connect(); 
        const info = await remoteHost.uploadFile(filePath, destPath);
        await remoteHost.disconnect();
        return info;
    } catch (error) {
        console.log(error.message);
        backupEvent.emit("backup_failed", { ...backupInfo, storage: "remote" })
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

exports.hasConnectedServers = async () => {
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
    for (const backupName of archives) {
        const isDir = !backupName.endsWith(".zip");
        const res = await remoteHost.removeEntry(backupName, isDir);
        if (res) {
            const dataLog = { name: backupName, storage: "remote", deletedDate: new Date() };
            console.log("remote - remove - ", backupName);
            removeLog.objLog(dataLog);
        }
    }

}

exports.removeArchive = async (archiveName) => {
    const hostConf = getHostConfig();
    const remoteHost = new RemoteHost(hostConf);
    await remoteHost.connect();
    const isDir = !archiveName.endsWith(".zip");
    const res = await remoteHost.removeEntry(archiveName, isDir);
    const dataLog = { name: archiveName, storage: "remote", deletedDate: new Date() };
    removeLog.objLog(dataLog);
    await remoteHost.disconnect();
    return Boolean(res);
}

exports.hasRemoteDefinedConfig = () => {
    return config.hosts.length > 0
            && config.hosts[0].host
            && config.hosts[0].port
            && config.hosts[0].username
            && (config.hosts[0].password || config.hosts[0].privateKey)
}