const fs = require("node:fs/promises");
const { config } = require("./../config");
const Log = require("./log");
const s3Wasabi = require("./helper/s3");
const s3Handler = require('./../lib/s3Handler')
const { restoreMongoDb } = require('./dbdriver');
const remoteHandler = require("./remote/remoteHandler");
const { watchLogFile, getNewPassword, generateVault } = require("./utils");
const { listBeforeDate } = require("./helper/sync");
const { syncLogList, printSyncLog } = require("./helper/sync");
const logFile = new Log("backup.log")
const { hostLog, s3Log } = require("./backupLog");

const printSyncedBackup = async () => {
    const s3List = await s3Handler.listS3Backup();
    const remoteList = await remoteHandler.getRemoteBackupList();
    await syncLogList({ s3List, remoteList })
    await printSyncLog();
}

exports.removeArchives = async () => {
    if (typeof config.retentionTime !== "number")
        throw new Error("The value of retentionTime should be a valid number")
    const lastDateTmp = new Date().getTime() - config.retentionTime;
    const s3Archives = await listBeforeDate(lastDateTmp, "wasabi");
    const remoteArchives = await listBeforeDate(lastDateTmp, "remote");
    await s3Handler.removeS3Archives(s3Archives);
    await remoteHandler.removeRemoteArchives(remoteArchives);
}

exports.removeBackup = async (name, opts) => {
    let delOkS3 = false, delOkRemote = false;
    if (opts.wasabi) {
        delOkS3 = await s3Handler.removeS3Archive(name);
    } else if (opts.remote) {
        delOkRemote = await remoteHandler.removeArchive(name);
    } else {
        delOkS3 = await s3Handler.removeS3Archive(name);
        delOkRemote = await remoteHandler.removeArchive(name);
    }
    if (delOkS3 || delOkRemote) {
        await printSyncedBackup();
    }
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
    } else {
        await printSyncedBackup()
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

exports.resetStorage = async (opts) => {
    if (opts.wasabi) {
        const fileList = await s3Handler.listS3Backup();
        if (!fileList)
            return;
        const archiveNames = fileList.map((file) => file.Key);
        await s3Handler.removeS3Archives(archiveNames);
        await s3Log.emptyFile();
    } else if (opts.remote) {
        const fileList = await remoteHandler.getRemoteBackupList();
        if (!fileList)
            return;
        const archiveNames = fileList.map(({ name }) => name);
        await remoteHandler.removeRemoteArchives(archiveNames);
        await hostLog.emptyFile();
    }
    await printSyncedBackup();
}

exports.setupPassword = async () => {
    const password = await getNewPassword();
    await generateVault(password);
}