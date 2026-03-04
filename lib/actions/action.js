const fs = require("node:fs/promises");
const { existsSync } = require("node:fs");
const path = require("node:path");
const { config } = require("../../config");
const S3Manager = require("../storages/s3/s3");
const MongodbManager = require('./../sources/mongodb/mongodbManager');
const remoteHandler = require("../storages/remote/remoteHandler");
const { watchLogFile, verifyFolderWritable } = require("../helper/utils");
const { listBeforeDate, getMetadataBackupList } = require("../helper/sync");
const { getNativeList, printBackupList } = require("../helper/sync");
const { getNewPassword, unlockPrompt, printTable, printResTestConfig } = require("../helper/ui-console");
const { sendIpcRequest, ipcServerAlive } = require("../client/ipcClient");
const { mergeByStoragePath } = require('../helper/utils');
const { verifyEncryptedHash, VAULT_FILE_PATH } = require("../encryption/cryptoTools");
const { backupEvent } = require("../helper/event")
const { startDaemon } = require("../../server/daemonHandler");
const backupService = require("../db/backupService");
const S3Provider = require("../storages/s3/s3Provider");
const { searchConfig, resolveS3Config, allSourceConfs, allDestinationConfs, getConfigurationsByTargetName } = require("../helper/mapConfig");
const { testConf, downloadBackup, deleteBackup, listByConf } = require("../storages/storageHelper");
const jobService = require("../db/jobService");

const findNative = async (name) => {
    const syncedList = await getNativeList({ synchronise: false });
    return syncedList.find((meta) => meta.name === name);
}

const printSyncedBackup = async (configNames) => {
    await getNativeList({...configNames});
    await printBackupList();
}

const oneDownloadFromAllStorage = async (name, isFolder, dest) => {
    let downloadPath;
    const s3Conf = resolveS3Config();
    const s3Provider = new S3Provider(s3Conf);
    if (isFolder) {
        downloadPath = await remoteHandler.downloadDirFromServer(name, null, dest);
        if (!existsSync(downloadPath)) {
            await s3Provider.downloadPrefix(name, dest)
        }
        return dest;
    } else {
        downloadPath = await remoteHandler.downloadFileFromServer(name, null, dest);
        if (!existsSync(downloadPath)) {
            await s3Provider.downloadFile(name, dest);
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
    const s3Archives = await listBeforeDate({ storage: "s3" });
    const remoteArchives = await listBeforeDate({ storage: "remote" });
    const config = resolveS3Config(opts.s3Config)
    const s3Provider = new S3Provider(config);
    await s3Provider.removeS3Archives(s3Archives);
    await remoteHandler.removeRemoteArchives(remoteArchives);
}

exports.removeBackup = async (backupId, opts) => {
    try {
        const backupInfo = await backupService.findByNameOrId(backupId);
        if (!backupInfo) {
            console.log(`Backup with id ${backupId} does not exists.`);
            process.exist(0);
        }
        await deleteBackup(backupInfo);
        console.log(`Backup ${backupId} deleted with success.`);
        await printSyncedBackup(opts);
    } catch (error) {
        console.log("Error deleting backup: ", error.message)
        process.exit(1);
    }
}

const formatedListByConf = (conf, list) => {
    if (conf.type === "s3") {
        return list.map(meta => ({
            name: meta.Key,
            modifiedAt: meta.LastModified,
            size: meta.Size,
            encrypted: meta.Key.endsWith(".meta.json") || meta.Key.endsWith(".enc"),
            storage: "s3"
        }))
    } else if (conf.type === "remote" || conf.type === "local-storage") {
        return list.map(meta => ({
            name: meta.name,
            size: meta.size,
            modifiedAt: meta.modifyTime,
            encrypted: !meta.name.endsWith(".zip"),
            storage: conf.type
        }))
    }
    return []
}
exports.backupList = async (opts) => {
    try {
        if (opts.scan && opts.destination) {
            const destination = opts.destination;
            const conf = searchConfig(destination);
            const resTest = await testConf(conf);
            if (!resTest.success)
                throw new Error(`The configuration ${destination} is not connected, reason: `, resTest.errorMsg);
            const list = await listByConf(conf);
            const listToPrint = formatedListByConf(conf, list);
            listToPrint = mergeByStoragePath(listToPrint)
            printTable(listToPrint);
        } else {
            const metadataList = await getMetadataBackupList();
            printTable(metadataList);
        }
        // else {
        //     await printSyncedBackup(opts)
        // }
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
}

const restoreEncryptedBackup = async ({name, opts, downloadPath, sourceConf}) => {
    const res = await sendIpcRequest({ msg: "decrypt", payload: downloadPath });
    const decryptedPath = res.payload;
    const restoreName = opts?.to ?? name.split(".")[0];
    const mongoManager = new MongodbManager(sourceConf);
    await mongoManager.restoreMongoDb(decryptedPath, restoreName);
    await fs.rm(downloadPath, { recursive: true });     
    console.log(`removing ${downloadPath}`)
}

const restorePlainBackup = async ({backupInfo, opts, downloadPath, sourceConf}) => {
    console.log(`${backupInfo.name} downloaded to ${downloadPath}`)
    if (!downloadPath) {        
        console.log("The database doesnt exists on the s3 s3");
        process.exit(0);
    }
    const restoreName = opts?.to ?? backupInfo.name.split(".")[0];        
    const mongoManager = new MongodbManager(sourceConf);
    await mongoManager.restoreMongoDb(downloadPath, restoreName);
    await fs.unlink(downloadPath);     
    console.log(`removing ${downloadPath}`)
}

exports.restoreBackup = async (nameOrId, opts) => {
    try {
        // A backup of the current app/database should be done before the restore
        let backupInfo = await backupService.findByNameOrId(nameOrId)
        if (!backupInfo) {
            throw new Error(`A backup with id or name ${nameOrId} not found.`)
        }
        const job = await jobService.findJob({ id: backupInfo.job_id });
        const { sourceConf } = getConfigurationsByTargetName(job.target);
        const downloadPath = await downloadBackup({ backup: backupInfo });
        if (!backupInfo.encrypted) {
            await restorePlainBackup({nameOrId, opts, downloadPath, sourceConf});
        } else {
            await restoreEncryptedBackup({nameOrId, opts, downloadPath, sourceConf});
        }
        console.log(`Restoring backup ${nameOrId} with success.`);
        process.exit(0);
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
}

exports.watchLogDaemon2 = async () => {
    const lineNbr = 10;
    watchLogFile(config.daemonOut, lineNbr, "LOG");
    watchLogFile(config.daemonErr, lineNbr, "ERROR")
}

// exports.checkHealth = async (name, opts) => {
//     const checkIfRemoteConnected = await remoteHandler.hasConnectedServers();
//     const hasRemoteConfig = await remoteHandler.hasRemoteDefinedConfig();
//     const wasabiConfigExists = s3Handler.wasabiConfigExists();
//     const hasS3Connected = await s3Handler.testConnection();

//     console.log("Remote ssh configuration: ", hasRemoteConfig ? "Ok" : "Incomplete");
    
//     console.log("Remote ssh connection: ", checkIfRemoteConnected ? "OK" : "Not connected")

//     console.log("S3 configuration: ", wasabiConfigExists ? "Ok" : "Incomplete")
    
//     console.log("S3 status connection: ", hasS3Connected ? "OK" : "Not connected");
//     process.exit(0);
// }

exports.resetStorage = async (opts) => {
    if (opts.s3 || opts.all) {
        const config = resolveS3Config(opts.s3Config)
        const s3Provider = new S3Provider(config);
        let fileList = await s3Provider.listBackup(config);
        if (fileList) {
            const archives = fileList.map((file) => ({ storagePath: file.Key }));
            await s3Provider.removeS3Archives(archives);
            await backupService.delete({ storage: "s3" });
        }
    } 
    if (opts.remote || opts.all) {
        let fileList = await remoteHandler.getRemoteBackupList();
        if (fileList) {
            console.log("file remote list: ", fileList)
            fileList = fileList.map((file) => ({ storagePath: file.name, type: file.type }))
            await remoteHandler.removeRemoteArchives(fileList);
            await backupService.delete({ storage: "remote" });
        }
    } 
    if (opts.table || opts.all) {
        // await backupService.delete();
        await backupService.deleteTable();
        console.log("reset backups table done.")
    }
    await printSyncedBackup(opts);
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

exports.download = async (nameId, opts) => {
    try {
        const resBackup = await backupService.findByNameOrId(nameId);
        let backupInfo = resBackup.data;
        if (!backupInfo) {
            console.log("The backup with the specified name doesn't exists");
            process.exist(0);
        }
        const dest = opts.output;
        if (!(await verifyFolderWritable(dest))) {
            throw new Error(`The destination folder ${dest} is not writable.`);
        }
        const downloadPath = await downloadBackup({ backup: backupInfo, destParentPath: dest });
        if (backupInfo.encrypted)
            await checkIntegrity(downloadPath);
        console.log(`The file is successfully download on ${downloadPath}`);
        backupEvent.emit("download", backupInfo);
        process.exit(0);
    } catch (err) {
        console.log(err.message);
        process.exist(1);
    }
}

exports.export = async (backupId, opts) => {
    try {
        if (!await ipcServerAlive())
            console.log("You need to start before doing a manual backup because of the encryption")
        let backupInfo = await backupService.findByNameOrId(backupId)
        if (!backupInfo) {
            console.log(`Backup with id ${backupId} does not exists.`);
            process.exist(0);
        }
        const dest = opts.output;
        if (!(await verifyFolderWritable(dest))) {
            throw new Error(`The destination folder ${dest} is not writable.`);
        }
        let exportPath;
        if (backupInfo.encrypted) {
            const downloadPath = await downloadBackup({ backup: backupInfo, destParentPath: dest });
            await checkIntegrity(downloadPath);
            const res = await sendIpcRequest({ msg: "decrypt", payload: downloadPath });
            exportPath = res.payload;
            backupEvent.emit("download", backupInfo);
        } else {
            exportPath = await downloadBackup({ backup: backupInfo, destParentPath: dest });
            backupEvent.emit("download", backupInfo);
        }
        console.log(`Backup file is successfully exported to ${exportPath}.`);
        process.exit(0);
    } catch (err) {
        console.log(err.message);
        process.exit(1);
    }
}

exports.listConfigs = async () => {
    const sourceConfs = allSourceConfs();
    const destinationConfs = allDestinationConfs();

    const resTests = [...sourceConfs, ...destinationConfs].map(async (config) => {
        const res = await testConf(conf);
        return {
            ...config,
            ...res
        }
    })

    printResTestConfig(resTests);
}