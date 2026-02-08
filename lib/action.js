const fs = require("node:fs/promises");
const { existsSync } = require("node:fs");
const path =requrie("node:path");
const { config } = require("./../config");
const s3Wasabi = require("./helper/s3");
const s3Handler = require('./../lib/s3Handler')
const { restoreMongoDb } = require('./dbdriver');
const remoteHandler = require("./remote/remoteHandler");
const { watchLogFile } = require("./utils");
const { listBeforeDate } = require("./helper/sync");
const { syncLogList, printSyncLog } = require("./helper/sync");
const { hostLog, s3Log } = require("./backupLog");
const { getNewPassword, unlockPrompt } = require("./../lib/helper/prompt");
const { sendIpcRequest, ipcServerAlive } = require("./../client/ipcClient");
const s3Wasabi = require("./../lib/helper/s3");
const { sendToRemoteServers, removeOverFlowFileServers, hasRemoteDefinedConfig } = require("./../lib/remote/remoteHandler");
const { getFormattedName, TEMP_DIR } = require('./../lib/utils');
const dbDriver = require("./../lib/dbdriver");
const { s3Log, hostLog } = require("./../lib/backupLog");
const { verifyEncryptedHash } = require("./../lib/encryption/cryptoTools");

const getSyncedList = async () => {
    const s3List = await s3Handler.listS3Backup();
    const remoteList = await remoteHandler.getRemoteBackupList();
    let syncedList = await syncLogList({ s3List, remoteList })
    return syncedList;
}

const backupMetadata = async (name) => {
    const syncedList = await getSyncedList();
    return syncedList.find((meta) => meta.name === name);
}

const printSyncedBackup = async () => {
    await getSyncedList();
    await printSyncLog();
}

const oneDownloadFromAllStorage = async (name, isFolder, dest) => {
    let downloadPath;
    if (isFolder) {
        downloadPath = await remoteHandler.downloadDirFromServer(name, null, dest);
        if (!existsSync(downloadPath)) {
            await s3Wasabi.downloadPrefix(name, dest)
        }
        return dest;
    } else {
        downloadPath = await remoteHandler.downloadFileFromServer(name, null, dest);
        if (!existsSync(downloadPath)) {
            await s3Wasabi.downloadFile(name, dest);
        }
        return dest;
    }
}

const checkIntegrity = async (dirPath) => {
    const dirName = path.basename(dirPath);
    const metaFile = path.join(dirPath, `${dirName}`, `${dirName}.meta.json`);
    const encryptedFile = path.join(dirPath, `${dirName}`, `${dirName}.enc`);
    const meta = JSON.parse((await fs.readFile(metaFile)));
    await verifyEncryptedHash(encryptedFile, meta.encryptedHas);   
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

const restoreEncryptedBackup = async (name, opts) => {
    let downloadPath = "";
    if (opts.wasabi) {
        downloadPath = await s3Wasabi.downloadPrefix(name, TEMP_DIR);
    } else if (opts.remote) {
        downloadPath = await remoteHandler.downloadDirFromServer(name, opts.host, path.join(TEMP_DIR, name));
    }

    const res = await sendIpcRequest({ msg: "decrypt", payload: downloadPath });
    const decryptedPath = JSON.parse(res).payload;
    const restoreName = opts?.to ?? name.split(".")[0];
    await restoreMongoDb(decryptedPath, restoreName);
    await fs.rmdir(downloadPath);     
    console.log(`removing ${downloadPath}`)
}

const restorePlainBackup = async (name, opts) => {
    let downloadPath = "";
    if (opts.wasabi) {
        downloadPath = await s3Wasabi.downloadFile({ key: backupInfo.name });
    } else if (opts.remote) {
        downloadPath = await remoteHandler.downloadFileFromServer(backupInfo.name, opts.host)
    }
    console.log(`${name} downloaded to ${downloadPath}`)
    if (!downloadPath) {
        console.log("The database doesnt exists on the wasabi s3");
        process.exit(0);
    }
    const restoreName = opts?.to ?? backupInfo.name.split(".")[0];        
    await restoreMongoDb(downloadPath, restoreName);
    await fs.unlink(downloadPath);     
    console.log(`removing ${downloadPath}`)
}

exports.restoreBackup = async (name, opts) => {
    try {
        const backupInfo = await backupMetadata(name);
        if (!backupInfo) {
            console.log(`Index ${name} not found in the backup`);
            process.exit(1);
        }
        if (!backupInfo.encrypted) {
            await restorePlainBackup(name, opts);
        } else {
            await restoreEncryptedBackup(name, opts);
        }
        console.log(`Restoring backup ${name} with success.`);
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
    if (!ipcServerAlive()) {
        console.log("You need to start the deamon first to be able to setup a password")
        process.exit(0);
    }
    const password = await getNewPassword();
    const res = await sendIpcRequest({ action: "newpass_unlock", payload: { password }  })
    if (res.success)
        console.log("Setting new password done.")
    else 
        console.log("Unable to setup the new password.");
}   

exports.unlockVault = async () => {
    try {
        await unlockPrompt(async (password) => {
            const data = {
                action: "unlock",
                payload: { password }
            }
            const response = await sendIpcRequest(data);
            if (response.success) {
                console.log("Vault unlock with success.");
            } else {
                console.log("Server may be down");
            }
        })
    } catch (error) {
        console.log("Server is down");
    }
}

exports.lockVault = async () => {
    await sendIpcRequest({ action: "lock" });
    console.log("Vault is locked.")
}

const plainManualBackup = async (cmd, opts) => {
    let dbName = cmd;
    if (!dbName) {
        dbName = config.dbName;
    }
    dbName = opts.tag || getFormattedName(dbName);
    const backupFile = await dbDriver.plainDumpMongoDb(dbName);
    if (opts.wasabi && s3Handler.wasabiConfigExists()) {   
        await s3Wasabi.createBucketIfNotExists({ bucket: config.wasabi.bucketName });
        const res = await s3Handler.copyBackupToS3(backupFile.name);
        if (res) {
            const dataLog = {
                name: backupFile.name,
                size: backupFile.size,
                storage: "wasabi"
            }
            await s3Log.objLog(dataLog);
        }
    }
    if (opts.remote && hasRemoteDefinedConfig()) {
        await removeOverFlowFileServers({ newUploadSize: backupFile.size });
        const remoteDone = await sendToRemoteServers(backupFile.name);
        if (remoteDone) {
            const dataLog = {
                name: backupFile.name,
                size: backupFile.size,
                storage: "remote"
            }
            await hostLog.objLog(dataLog);
        }
    }
}

const encryptedManualBackup = async (cmd, opts) => {
    let dbName = cmd;
    if (!dbName) {
        dbName = config.dbName;
    }
    dbName = opts.tag || getFormattedName(dbName);
    const res = await sendIpcRequest({ msg: "export", payload: dbName });
    const dumpData = JSON.parse(res).payload;
    // if send encrypted data to wasabi
    if (opts.wasabi && s3Handler.wasabiConfigExists()) {
        const res = await s3Handler.sendDirToS3(dumpData.encryptedDirPath);
        if (res) {
            const dataLog = {
                name: dumpData.name,
                size: dumpData.size,
                storage: "wasabi",
                encrypted: true
            }
            await s3Log.objLog(dataLog);
        }
    } 
    if (opts.remote && hasRemoteDefinedConfig()) {
        await removeOverFlowFileServers({ newUploadSize: backupFile.size });
        const remoteDone = await sendToRemoteServers(dumpData.name, { isDir: true });
        if (remoteDone) {
            const dataLog = {
                name: dumpData.name,
                size: dumpData.size,
                storage: "remote",
                encrypted: true
            }
            await s3Log.objLog(dataLog);
        }
    }
}

exports.backupManually = (cmd, opts) => {   
    (async () => {
        try {
            if (config.useEncryption) {
                if (!await ipcServerAlive())
                    console.log("You need to start before doing a manual backup for the encryption")
                await encryptedManualBackup(cmd, opts);
            } else {
                await plainManualBackup(cmd, opts);
            }
            console.log("sending backup to s3 done");
            process.exit(0);
        } catch (error) {
            console.log(error);
            process.exit(1)
        }
    })()
}

exports.download = async (name, opts) => {
    try {
        const backupInfo = await backupMetadata(name);
        if (!backupInfo) {
            console.log("The backup with the specified name doesn't exists");
            process.exist(0);
        }
        const dest = opts.output;
        const downloadPath = await oneDownloadFromAllStorage(backupInfo.name, backupInfo.encrypted, dest);
        if (backupInfo.encrypted) {
            if (!await ipcServerAlive())
                console.log("You need to start before doing a manual backup for the encryption")
            await checkIntegrity(downloadPath);
            console.log(`Encrypted file is successfully downloaded to ${downloadPath}`);
        } else {
            console.log(`File is successfully downloaded to ${downloadPath}`);
        }
        process.exit(0);
    } catch (err) {
        console.log(err.message);
        process.exist(1);
    }
}

exports.export = async (name, opts) => {
    try {
        const backupInfo = await backupMetadata(name);
        if (!backupInfo) {
            console.log("The backup with the specified name doesn't exists");
            process.exist(0);
        }
        const dest = opts.output;
        const downloadPath = await oneDownloadFromAllStorage(backupInfo.name, backupInfo.encrypted, dest);
        if (backupInfo.encrypted) {
            if (!await ipcServerAlive())
                console.log("You need to start before doing a manual backup for the encryption")
            await checkIntegrity(downloadPath);
            const res = await sendIpcRequest({ msg: "decrypt", payload: downloadPath });
            downloadPath = JSON.parse(res).payload;
        }
        console.log(`Backup file is successfully exported to ${downloadPath}`);
    } catch (err) {
        console.log(err.message);
    }
}