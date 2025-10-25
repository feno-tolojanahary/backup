const path = require("path");
const { config } = require("../../config");
const RemoteHost = require("./remoteHost");

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
        }
        await remoteHost.disconnect();
    } catch (error) {
        console.log("Error when removing old file: ", error.message)
    }
}

exports.sendToRemoteServers = async (fileName) => {
    const filePath = path.join(config.workingDirectory, fileName);
    const backupInfos = [];
    for (const hostConf of config.hosts) {
        try {
            const remoteHost = new RemoteHost(hostConf);
            await remoteHost.connect();
            const info = await remoteHost.uploadFile(filePath, hostConf.destinationFolder);
            console.log("send file to a remote server done: ", info)
            backupInfos.push(info);
            await remoteHost.disconnect();
        } catch (error) {
            console.log("Host %s. Error: %s", hostConf.host, error.message)
        }
    }
    return backupInfos;
}

exports.sendToRemoteServer = async (fileName, hostName, destPath) => {
    try {
        const filePath = path.join(config.workingDirectory, fileName);
        const hostConf = getHostConfig(hostName);
        const remoteHost = new RemoteHost(hostConf);
        await remoteHost.connect(); 
        const info = await remoteHost.uploadFile(filePath, destPath);
        await remoteHost.disconnect();
        return info;
    } catch (error) {
        console.log(error);
    }
}

exports.downloadFileFromServer = async (fileName, hostName) => {
    try {
        const hostConf = getHostConfig(hostName);
        const dstPath = path.join(config.workingDirectory, fileName);
        const remoteHost = new RemoteHost(hostConf);
        await remoteHost.connect();
        await remoteHost.downloadFile(fileName, dstPath);
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