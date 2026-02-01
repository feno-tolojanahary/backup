const fs = require("node:fs/promises");
const path = require("path");
const { config } = require("./../config");
const Log = require("./log");
const s3Wasabi = require("./helper/s3");
const s3Handler = require('./../lib/s3Handler')
const { restoreMongoDb } = require('./dbdriver');
const remoteHandler = require("./remote/remoteHandler");
const { watchLogFile } = require("./utils");
const { getResumeLog, synchroniseLog } = require("./helper/sync");
const logFile = new Log("backup.log")

exports.removeArchives = async () => {
    const lastDateTmp = new Date().getTime() - config.retentionTime*1000;
    const archives = await logFile.getArchiveToRemove(new Date(lastDateTmp));
    await s3Handler.removeS3Archives(archives);
    await remoteHandler.removeRemoteArchives(archives);
}

exports.backupList = async (opts) => {
    if (opts.wasabi) {
        const fileList = await s3Handler.listS3Backup();
        if (fileList) {
            for (const file of fileList) {
                console.log(`Name: ${file.Key}, Size: ${(file.Size / 1024).toFixed(2)} Mb`);
            }
        }
    } else if (opts.remote) {
        const fileList = await remoteHandler.getRemoteBackupList();
        for (const file of fileList) {
            console.log(`Name: ${file.name}, Size: ${(file.size / 1024).toFixed(2)} Mb`);
        }
    } else if (opts.syncAll) {
        await synchroniseLog();
        const logs = await getResumeLog();
        for (const log of logs) {
            console.log(`Name: ${log.name}, Size: ${log.size}, Date: ${log.date}, isOnWasabi: ${Boolean(log.s3Wasabi)}, isOnRemote: ${Boolean(log.remoteHost)}`);
        }
    } else {
        const backupList = await logFile.getBackupList({ limit: 20, skip: 0 });
        for (const backupInfo of backupList) {
            console.log(`Index: ${backupInfo.index}  Name: ${backupInfo.archiveName}  Date: ${backupInfo.dataIso}`);
        }
    }
}

exports.restoreBackup = async (name, opts) => {
    try {
        const backupInfo = await logFile.getByName(name);
        console.log("backupInfo: ", backupInfo)
        if (!backupInfo) {
            console.log(`Index ${name} not found in the backup`);
            process.exit(1);
        }
        let downloadPath = "";
        if (opts.wasabi) {
            downloadPath = await s3Wasabi.downloadFile({ key: backupInfo.archiveName });
        } else if (opts.remote) {
            downloadPath = await remoteHandler.downloadFileFromServer(backupInfo.archiveName, opts.host)
        }
        console.log(`${name} downloaded to ${downloadPath}`)
        if (!downloadPath) {
            console.log("The database doesnt exists on the wasabi s3");
            process.exit(0);
        }
        const restoreName = opts?.to ?? backupInfo.archiveName.split(".")[0];        
        await restoreMongoDb(downloadPath, restoreName);
        await fs.unlink(downloadPath);     
        console.log(`removing ${downloadPath}`)
    } catch (error) {
        console.log("Error when restoring a backup: ", error);
    }
}

exports.watchLogDaemon2 = async () => {
    const lineNbr = 10;
    watchLogFile(config.daemonOut, lineNbr, "LOG");
    watchLogFile(config.daemonErr, lineNbr, "ERROR")
}

exports.checkHealth = async (name, opts) => {
    const checkIfRemoteConnected = await remoteHandler.hasConnectedServers();
    const hasRemoteConfig = await remoteHandler.hasRemoteDefinedConfig();
    const wasabiConfigExists = s3Handler.wasabiConfigExists();
    const hasS3Connected = await s3Handler.testConnection();

    console.log("Remote ssh configuration: ", hasRemoteConfig ? "Ok" : "Incomplete");
    
    console.log("Remote ssh connection: ", checkIfRemoteConnected ? "OK" : "Not connected")

    console.log("S3 configuration: ", wasabiConfigExists ? "Ok" : "Incomplete")
    
    console.log("S3 status connection: ", hasS3Connected ? "OK" : "Not connected");
    process.exit(0);
}