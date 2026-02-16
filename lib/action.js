const fs = require("node:fs/promises");
const { existsSync } = require("node:fs");
const path = require("node:path");
const { config } = require("./../config");
const s3Wasabi = require("./helper/s3");
const s3Handler = require('./../lib/s3Handler')
const { restoreMongoDb } = require('./dbdriver');
const remoteHandler = require("./remote/remoteHandler");
const { watchLogFile } = require("./utils");
const { listBeforeDate } = require("./helper/sync");
const { getSyncedList, printBackupList } = require("./helper/sync");
const { getNewPassword, unlockPrompt, printTable } = require("./helper/ui-console");
const { sendIpcRequest, ipcServerAlive } = require("./../lib/client/ipcClient");
const { sendToRemoteServers, /*removeOverFlowFileServers,*/ hasRemoteDefinedConfig } = require("./../lib/remote/remoteHandler");
const { getFormattedName, TEMP_DIR, mergeListByName } = require('./../lib/utils');
const dbDriver = require("./../lib/dbdriver");
const { verifyEncryptedHash, VAULT_FILE_PATH } = require("./../lib/encryption/cryptoTools");
const { backupEvent } = require("./helper/event")
const { startDaemon } = require("./../server/daemonHandler");
const backupService = require("./db/backupService");

const backupMetadata = async (name) => {
    const syncedList = await getSyncedList();
    return syncedList.find((meta) => meta.name === name);
}

const printSyncedBackup = async () => {
    await getSyncedList();
    await printBackupList();
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

const checkStart = async () => {
    if (config.useEncryption && !await ipcServerAlive()) {
        console.log("You need to start the service before doing a manual backup with encryption active")
        process.exit(1);
    }
}

exports.removeArchives = async () => {
    if (typeof config.retentionTime !== "number")
        throw new Error("The value of retentionTime should be a valid number")
    const s3Archives = await listBeforeDate({ storage: "wasabi" });
    // const remoteArchives = await listBeforeDate({ storage: "remote" });
    await s3Handler.removeS3Archives(s3Archives);
    // await remoteHandler.removeRemoteArchives(remoteArchives);
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
        if (!(await s3Handler.testConnection())) {
            console.log("List empty. Not connected to the s3 server");
            return;
        }
        let fileList = await s3Handler.listS3Backup();
        if (fileList) {
            let listToPrint = fileList.map(meta => ({
                name: meta.Key,
                modifiedAt: meta.LastModified,
                size: meta.Size,
                encrypted: meta.Key.endsWith(".meta.json") || meta.Key.endsWith(".enc"),
                storage: "wasabi"
            }))
            listToPrint = mergeListByName(listToPrint)
            printTable(listToPrint);
        }
    } else if (opts.remote) {
        if (!(await remoteHandler.hasConnectedServers())) {
            console.log("List empty. Not connected to any SSH server");
            return;
        }
        let fileList = await remoteHandler.getRemoteBackupList();
        let listToPrint = fileList.map(meta => ({
            name: meta.name,
            size: meta.size,
            modifiedAt: meta.modifyTime,
            encrypted: !meta.name.endsWith(".zip"),
            storage: "remote"
        }))
        listToPrint = mergeListByName(listToPrint)
        printTable(listToPrint);
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
    const decryptedPath = res.payload;
    const restoreName = opts?.to ?? name.split(".")[0];
    await restoreMongoDb(decryptedPath, restoreName);
    await fs.rm(downloadPath, { recursive: true });     
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
    if (opts.wasabi || opts.all) {
        const fileList = await s3Handler.listS3Backup();
        if (fileList) {
            const archiveNames = fileList.map((file) => file.Key);
            await s3Handler.removeS3Archives(archiveNames);
            await backupService.deleteMultiple({ storage: "wasabi" });
        }
    } 
    if (opts.remote || opts.all) {
        const fileList = await remoteHandler.getRemoteBackupList();
        if (fileList) {
            console.log("file remote list: ", fileList)
            await remoteHandler.removeRemoteArchives(fileList);
            await backupService.deleteMultiple({ storage: "remote" });
        }
    } 
    if (opts.table || opts.all) {
        await backupService.deleteMultiple();
        console.log("reset backups table done.")
    }
    await printSyncedBackup();
}

exports.configure = async () => {
    if (existsSync(VAULT_FILE_PATH)) {
        console.log("Vault already configured, we don't have a feature to reset the password yet.");
        process.exit(0);
    }
    // start ipc server if it is down
    if (!await ipcServerAlive()) {
        await startDaemon({ exitAfterStart: false }, (error) => {
            if (error) {
                console.log("Could not start the daemon, reason: ", error.message);
                process.exit(1);
            }
        })
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
        if (!await ipcServerAlive()) {
            console.log("Server is not started.");
            process.exit(1);
        }
        await unlockPrompt(async (password) => {
            const data = {
                action: "unlock",
                payload: { password }
            }
            const response = await sendIpcRequest(data);
            if (response.success) {
                console.log("Vault unlock with success.");
                return true;
            } else {
                console.log("Password is not correct.");
                return false
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
        await s3Handler.copyBackupToS3(backupFile);
    }
    if (opts.remote && hasRemoteDefinedConfig()) {
        // await removeOverFlowFileServers({ newUploadSize: backupFile.size });
        await sendToRemoteServers(backupFile);
    }
}

const encryptedManualBackup = async (cmd, opts) => {
    let dbName = cmd;
    if (!dbName) {
        dbName = config.dbName;
    }
    dbName = opts.tag || getFormattedName(dbName);
    const res = await sendIpcRequest({ action: "export", payload: dbName });
    const dumpData = res.payload;
    // if send encrypted data to wasabi
    if (!dumpData) {
        console.log("Error exporting backup.");
        process.exit(1);
    }
    if (!opts.remote && s3Handler.wasabiConfigExists()) {
        await s3Handler.encryptedBackupToS3(dumpData);
    } 
    if (!opts.wasabi && hasRemoteDefinedConfig()) {
        // await removeOverFlowFileServers({ newUploadSize: dumpData.size });
        await sendToRemoteServers(dumpData, { isDir: true });
    }
}

exports.backupManually = (cmd, opts) => {   
    (async () => {
        try {
            if (config.useEncryption) {
                await checkStart();
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
            backupEvent.emit("download", backupInfo);
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
            downloadPath = res.payload;
            backupEvent.emit("download", backupInfo);
        }
        console.log(`Backup file is successfully exported to ${downloadPath}`);
    } catch (err) {
        console.log(err.message);
    }
}