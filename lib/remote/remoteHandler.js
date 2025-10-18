const path = require("path");
const config = require("../../config");
const RemoteHost = require("./remoteHost");

exports.sendToRemoteServers = async (fileName) => {
    const filePath = path.join(config.workingDirectory, fileName);
    const backupInfos = [];
    for (const hostConf of config.hosts) {
        try {
            const remoteHost = new RemoteHost(hostConf);
            const info = await remoteHost.uploadFile(filePath, hostConf.destinationFolder);
            backupInfos.push(info);
        } catch (error) {
            console.log("Host %s. Error: %s", hostConf.host, error.message)
        }
    }
    return backupInfos;
}

exports.sendToRemoteServer = async (fileName, hostName, destPath) => {
    try {
        let hostConf = {};
        const filePath = path.join(config.workingDirectory, fileName);
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
        const remoteHost = new RemoteHost(hostConf);
        const info = await remoteHost.uploadFile(filePath, destPath);
        return info;
    } catch (error) {
        console.log(error);
    }
}