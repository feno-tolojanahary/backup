const fs = require("node:fs/promises");
const { existsSync } = require("node:fs");
const path = require("node:path");
const { config } = require("../../config");
const S3Manager = require("../storages/s3/s3");
const s3Manager = new S3Manager();
const s3Handler = require('../storages/s3/s3Handler')
const MongodbManager = require('./../sources/mongodb/mongodbManager');
const remoteHandler = require("../storages/remote/remoteHandler");
const { watchLogFile } = require("../helper/utils");
const { listBeforeDate } = require("../helper/sync");
const { getNativeList, printBackupList } = require("../helper/sync");
const { getNewPassword, unlockPrompt, printTable, printS3Configs, printHostConfigs, printMongodbConfigs } = require("../helper/ui-console");
const { sendIpcRequest, ipcServerAlive } = require("../client/ipcClient");
const { sendToRemoteServer, /*removeOverFlowFileServers,*/ hasRemoteDefinedConfig } = require("../storages/remote/remoteHandler");
const { getFormattedName, TEMP_DIR, mergeByStoragePath } = require('../helper/utils');
const { verifyEncryptedHash, VAULT_FILE_PATH } = require("../encryption/cryptoTools");
const { backupEvent } = require("../helper/event")
const { startDaemon } = require("../../server/daemonHandler");
const backupService = require("../db/backupService");
const RemoteHost = require("../storages/remote/remoteHost");
const localHandler = require("./../storages/localStorage/localHandler");
const S3Provider = require("../storages/s3/s3Provider");
const { MongoClient } = require("mongodb");
const { resolveMongodbConf, searchConfig, resolveS3Config, resolveLocalConfig, resolveRemoteConfig } = require("../helper/mapConfig");
const LocalStorage = require("../storages/localStorage/localStorages");

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

exports.removeBackup = async (name, opts) => {
    let delOkS3 = false, delOkRemote = false;
    if (opts.s3) {
        const config = resolveS3Config(opts.s3Config)
        const s3Provider = new S3Provider(config);
        delOkS3 = await s3Provider.removeS3Archive(name);
    } else if (opts.remote) {
        delOkRemote = await remoteHandler.removeArchive(name);
    } else {
        const config = resolveS3Config(opts.s3Config)
        const s3Provider = new S3Provider(config);
        delOkS3 = await s3Provider.removeS3Archive(name);
        delOkRemote = await remoteHandler.removeArchive(name);
    }
    if (delOkS3 || delOkRemote) {
        await printSyncedBackup(opts);
    }
}

exports.backupList = async (opts) => {
    if (opts.s3) {
        const config = resolveS3Config(opts.s3Config)
        const s3Provider = new S3Provider(config);
        if (!(await s3Provider.testConnection())) {
            console.log("List empty. Not connected to the s3 server");
            return;
        }
        let fileList = await s3Provider.listBackup(config);
        if (fileList) {
            let listToPrint = fileList.map(meta => ({
                name: meta.Key,
                modifiedAt: meta.LastModified,
                size: meta.Size,
                encrypted: meta.Key.endsWith(".meta.json") || meta.Key.endsWith(".enc"),
                storage: "s3"
            }))
            listToPrint = mergeByStoragePath(listToPrint)
            printTable(listToPrint);
        }
    } else if (opts.remote) {
        if (!(await remoteHandler.hasConnectedServers())) {
            console.log("List empty. Not connected to any SSH server");
            return;
        }
        let fileList = await remoteHandler.getRemoteBackupList(opts.remoteConfig);
        let listToPrint = fileList.map(meta => ({
            name: meta.name,
            size: meta.size,
            modifiedAt: meta.modifyTime,
            encrypted: !meta.name.endsWith(".zip"),
            storage: "remote"
        }))
        listToPrint = mergeByStoragePath(listToPrint)
        printTable(listToPrint);
    } else if (opts.local) {
        const config = resolveLocalConfig(config.localStorageConfig);
        const localStorage = new LocalStorage(config);
        const fileList = localStorage.getFiles();
        let listToPrint = (await fileList).map(meta => ({
            name: meta.name,
            size: meta.size,
            modifiedAt: meta.modifyTime,
            encrypted: !meta.name.endsWith(".zip"),
            storage: "local-storage"
        }))
        listToPrint = mergeByStoragePath(listToPrint)
        printTable(listToPrint);
    } else {
        await printSyncedBackup(opts)
    }
}

const restoreEncryptedBackup = async (name, opts) => {
    let downloadPath = "";
    if (opts.s3) {
        downloadPath = await s3Manager.downloadPrefix(name, TEMP_DIR);
    } else if (opts.remote) {
        downloadPath = await remoteHandler.downloadDirFromServer(name, opts.host, path.join(TEMP_DIR, name));
    }

    const res = await sendIpcRequest({ msg: "decrypt", payload: downloadPath });
    const decryptedPath = res.payload;
    const restoreName = opts?.to ?? name.split(".")[0];
    const mongoManager = new MongodbManager(resolveMongodbConf());
    await mongoManager.restoreMongoDb(decryptedPath, restoreName);
    await fs.rm(downloadPath, { recursive: true });     
    console.log(`removing ${downloadPath}`)
}

const restorePlainBackup = async (backupInfo, opts) => {
    let downloadPath = "";
    if (opts.s3) {
        downloadPath = await s3Manager.downloadFile({ key: backupInfo.name });
    } else if (opts.remote) {
        downloadPath = await remoteHandler.downloadFileFromServer(backupInfo.name, opts.remoteConfig)
    }
    console.log(`${backupInfo.name} downloaded to ${downloadPath}`)
    if (!downloadPath) {
        console.log("The database doesnt exists on the s3 s3");
        process.exit(0);
    }
    const restoreName = opts?.to ?? backupInfo.name.split(".")[0];        
    const mongoManager = new MongodbManager(resolveMongodbConf());
    await mongoManager.restoreMongoDb(downloadPath, restoreName);
    await fs.unlink(downloadPath);     
    console.log(`removing ${downloadPath}`)
}

exports.restoreBackup = async (nameOrId, opts) => {
    try {
        let backupInfo = await backupService.findByNameOrId(nameOrId)
        if (!backupInfo) {
            backupInfo = await findNative(nameOrId);
            if (!backupInfo) {
                console.log(`Index ${nameOrId} not found in the backup`);
                process.exit(1);
            }
        }
        if (!backupInfo.encrypted) {
            await restorePlainBackup(nameOrId, opts);
        } else {
            await restoreEncryptedBackup(nameOrId, opts);
        }
        console.log(`Restoring backup ${nameOrId} with success.`);
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
    if (opts.s3 || opts.all) {
        const config = resolveS3Config(opts.s3Config)
        const s3Provider = new S3Provider(config);
        let fileList = await s3Provider.listBackup(config);
        if (fileList) {
            const archives = fileList.map((file) => ({ storagePath: file.Key }));
            await s3Provider.removeS3Archives(archives);
            await backupService.deleteMultiple({ storage: "s3" });
        }
    } 
    if (opts.remote || opts.all) {
        let fileList = await remoteHandler.getRemoteBackupList();
        if (fileList) {
            console.log("file remote list: ", fileList)
            fileList = fileList.map((file) => ({ storagePath: file.name, type: file.type }))
            await remoteHandler.removeRemoteArchives(fileList);
            await backupService.deleteMultiple({ storage: "remote" });
        }
    } 
    if (opts.table || opts.all) {
        // await backupService.deleteMultiple();
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

const plainManualBackup = async (opts, conf) => {
    let dbName = opts.tag ? opts.tag : getFormattedName(conf.database);
    const mongoManager = new MongodbManager(resolveMongodbConf(conf));
    const backupFile = await mongoManager.plainDumpMongoDb(dbName);
    if (opts.s3 && s3Handler.wasabiConfigExists()) {   
        await s3Manager.createBucketIfNotExists();
        const config = resolveS3Config(opts.s3Config)
        const s3Provider = new S3Provider(config);
        await s3Provider.copyBackupToS3(backupFile);
    }
    if (opts.remote && hasRemoteDefinedConfig()) {
        // await removeOverFlowFileServers({ newUploadSize: backupFile.size });
        const hostConfig = resolveRemoteConfig(opts.remoteConfig);
        await sendToRemoteServer({ metaBackup: backupFile, hostConfig, isDir: false });
    }
    if (opts.localStorage && localHandler.hasValidConfig()) {
        const localConfig = resolveLocalConfig(opts.localStorageConfig);
        const localStorage = new LocalStorage(localConfig);
        await localStorage.copyFile(backupFile.filePath);
    }
}

const encryptedManualBackup = async (opts) => {
    let dbName = opts.tag ? opts.tag : getFormattedName(conf.database);
    const res = await sendIpcRequest({ action: "export", payload: { dbName, source: opts.source } });
    const dumpData = res.payload;
    // if send encrypted data to s3
    if (!dumpData) {
        console.log("Error exporting backup.");
        process.exit(1);
    }
    if (opts.s3 && s3Handler.wasabiConfigExists()) {
        const config = resolveS3Config(opts.s3Config);
        const s3Provider = new S3Provider(config);
        await s3Provider.encryptedBackupToS3(dumpData);
    } 
    if (opts.remote && hasRemoteDefinedConfig()) {
        // await removeOverFlowFileServers({ newUploadSize: dumpData.size });
        const hostConfig = resolveRemoteConfig(opts.remoteConfig);
        await sendToRemoteServer({ metaBackup: dumpData, hostConfig, isDir: true });
    }
    if (opts.localStorage && localHandler.hasValidConfig()) {
        const localConfig = resolveLocalConfig(opts.localStorageConfig);
        const localStorage = new LocalStorage(localConfig);
        await localStorage.copyFolder(dumpData.encryptedDirPath);
    }
}

exports.backupManually = (opts) => {   
    (async () => {
        try {
            const _config = searchConfig(opts.source)
            if (!_config)
                throw new Error("No configuration found for %s ", opts.source);
            if (_config !== "mongodb")
                throw new Error("For now, mongodb is the only supported engine for the backup");
            if (config.useEncryption) {
                await checkStart();
                await encryptedManualBackup(opts, _config);
            } else {
                await plainManualBackup(opts, _config);
            }
            console.log("sending backup to s3 done");
            process.exit(0);
        } catch (error) {
            console.log(error.message);
            process.exit(1)
        }
    })()
}

exports.download = async (nameId, opts) => {
    try {
        const resBackup = await backupService.findByNameOrId(nameId);
        let backupInfo = resBackup.data;
        if (!backupInfo) {
            backupInfo = await findNative(nameId);
            if (!backupInfo) {
                console.log("The backup with the specified name doesn't exists");
                process.exist(0);
            }
            backupInfo.storagePath = nameId;
        }
        const dest = opts.output;
        if (backupInfo.encrypted) {
            if (!await ipcServerAlive())
                console.log("You need to start the server before doing a manual backup for the encryption")
            let downloadPaths = [];
            if (backupInfo.storage === "remote") {
                const downloadPath = await remoteHandler.downloadDirFromServer(backupInfo.files[0]?.storagePath, null, dest);
                downloadPaths.push(downloadPath);
            } else {
                for (const file of backupInfo.files) {
                    await s3Manager.downloadFile(file.storagePath, dest);
                    console.log(`Encrypted file is successfully downloaded to ${dest}`);
                }
            }
            await checkIntegrity(dest);
            backupEvent.emit("download", backupInfo);
        } else {
            const downloadPath = await oneDownloadFromAllStorage(backupInfo.storagePath, backupInfo.encrypted, dest);
            if (existsSync(downloadPath)) {
                console.log(`File is successfully downloaded to ${downloadPath}`);
                backupEvent.emit("download", backupInfo);
            } else {
                console.log(`Unable to download file ${nameId}`)
            }
        }
        process.exit(0);
    } catch (err) {
        console.log(err.message);
        process.exist(1);
    }
}

exports.export = async (nameId, opts) => {
    try {
        let backupInfo = await backupService.findByNameOrId(nameId)
        if (!backupInfo) {
            backupInfo = await findNative(nameId);
            if (!backupInfo) {
                console.log("The backup with the specified name doesn't exists");
                process.exist(0);
            }
        }
        const dest = opts.output;
        let downloadPath;
        if (backupInfo.encrypted) {
            if (backupInfo.storage === "remote") {
                await remoteHandler.downloadDirFromServer(backupInfo.files[0]?.storagePath, null, dest);
            } else {
                for (const file of backupInfo.files) {
                    await s3Manager.downloadFile(file.storagePath, dest);
                    console.log(`Encrypted file is successfully downloaded to ${dest}`);
                }
            }
            if (!await ipcServerAlive())
                console.log("You need to start before doing a manual backup for the encryption")
            await checkIntegrity(dest);
            const res = await sendIpcRequest({ msg: "decrypt", payload: dest });
            downloadPath = res.payload;
            console.log()
            backupEvent.emit("download", backupInfo);
        } else {
            downloadPath = await oneDownloadFromAllStorage(backupInfo.storagePath, backupInfo.encrypted, dest);
            backupEvent.emit("download", backupInfo);
        }
        console.log(`Backup file is successfully exported to ${downloadPath}`);
    } catch (err) {
        console.log(err.message);
    }
}

exports.listConfigs = async () => {
    if (Array.isArray(config.hosts)) {
        let hosts = config.hosts;
        
        hosts = hosts.map(async (conf) => {
            try {
                const remote = new RemoteHost(conf);
                await remote.connect();
                await remote.disconnect();
                return { ...conf, status: "Connected" }
            } catch (error) {
                return {
                    ...conf,
                    status: "Not connected",
                    errorMsg: error.message
                }
            }
        })
        printHostConfigs(hosts);
    }

    if (Array.isArray(config.s3)) {
        let s3 = config.s3;
        s3 = s3.map(async (conf) => {
            try {
                const s3Provider = new S3Provider(conf);
                const res = await s3Provider.testConnection();
                if (res.ok)
                    return { ...conf, status: "Connected" }
                else throw new Error(res.error);
            } catch (error) {
                return {
                    ...conf,
                    status: "Not connected",
                    errorMsg: error.message
                }
            }
        })
    
        printS3Configs(s3);
    }

    if (Array.isArray(config.mongodb)) {
        const mongodbConfs = config.mongodb.map(async (conf) => {
            try {
                const uri = config.mongodb.uri;
                const client = new MongoClient(uri);
                await client.connect();
                await client(conf.database).command({ ping: 1 });
                return {
                    ...conf,
                    status: "Connected"
                }
            } catch (err) {
                return {
                    ...conf,
                    status: "Not connected",
                    errorMsg: err.message
                }
            }
        });

        printMongodbConfigs(mongodbConfs);
    }
}