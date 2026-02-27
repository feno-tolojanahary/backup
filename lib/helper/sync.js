const backupService = require("./../db/backupService");
const { config } = require("./../../config");
const { resumeLog } = require("../backupLog");
const { printTable } = require("./ui-console");
const remoteHandler = require("./../storages/remote/remoteHandler");
const localHandler = require("./../storages/localStorage/localHandler");
const userService = require("../db/userService");
const S3Provider = require("../storages/s3/s3Provider");
const { resolveLocalConfig, resolveRemoteConfig } = require("./mapConfig");
const LocalStorage = require("../storages/localStorage/localStorages");

const getNativeList = async ({ synchronise = true, s3Config = "", remoteConfig = "", localStorageConfig } = {}) => {
    let s3List = [], remoteList = [], localList = [];
    let allList = [];
    const config = resolveS3Config(s3Config)
    const s3Provider = new S3Provider(config);
    if ((await s3Provider.testConnection())) {
        s3List = await s3Provider.listBackup(config);
    }
    if ((await remoteHandler.hasConnectedServers())) {
        remoteList = await remoteHandler.getRemoteBackupList(remoteConfig);
    } 
    if (localHandler.hasValidConfig()) {
        const localConfig = resolveLocalConfig(localStorageConfig);
        const localStorage = new LocalStorage(localConfig);
        localList = localStorage.getFiles();
    }
    if (synchronise) {
        allList = await syncLogList({ s3List, remoteList, localList }, { s3Config: config, localConfig, remoteConfig: resolveRemoteConfig(remoteConfig)})
    } else {
        allList = [...s3List, ...remoteList, ...localList];
    }
    return allList;
}

exports.getNativeList = getNativeList;

exports.getResumeLog = async () => {
    const resLog = await resumeLog.readAll();
    return resLog;
}

const formatMeta = async (meta, destConfig) => {
    const data = {};
    const adminUser = await userService.adminUser();
    if (meta.type === "s3") {
        data = { 
            name: meta.name,
            storage: "s3", 
            status: "completed",
            userId: adminUser.id,
            modifiedAt: Math.floor(new Date(meta.LastModified).getTime() / 1000),
            encrypted: meta.name.endsWith(".zip") ? 0 : 1,
            lastSynced: Date.now() / 1000
        };
        const uploadedData = {
            storagePath: meta.storagePath,
            storage: "s3",
            status: "online",
            type: "file",
            size: meta.Size / 1024,
            prefix: destConfig.s3Config.backupPrefix
        };
        data.uploadedData = [uploadedData];
    } else if (meta.type === "remote") {
        const name = meta.storagePath.split('/')[0];
        data = { 
            name,
            storage: "remote",
            status: "completed",
            modifiedAt: Math.floor(new Date(meta.modifyTime).getTime() / 1000),
            userId: adminUser.id,
            isArchived: 0,
            encrypted:  name.includes(".zip") ? 0 : 1,
            lastSynced: Date.now() / 1000
        };
        const uploadedData = {
            storagePath: meta.storagePath,
            size: meta.size / 1024, 
            storage: "remote",
            status: "online",
            type: name.includes(".zip") ? "file" : "folder",
            destinationFolder: destConfig.remoteConfig.destinationFolder
        }
        data.uploadedData = [uploadedData];
    } else if (meta.type === "local-storage") {
        data = {
            name: meta.name,
            storage: "local-storage",
            status: "completed",
            modifiedAt: meta.modifyTime / 1000,
            userId: adminUser.id,
            isArchived: 0,
            encrypted: meta.type === "folder",
            lastSynced: Date.now() / 1000
        }
        const uploadedData = {
            storagePath: meta.name,
            size: meta.size,
            storage: "local-storage",
            status: "online",
            destinationFolder: destConfig.localConfig.destinationFolder
        }
        data.uploadedData = [uploadedData];
    }
    return data;
}

const syncLogList = async ({ s3List, remoteList, localList }, destConfig) => {
    const onlineList = [];
    if (Array.isArray(s3List) && s3List.length > 0) {
        const bulkUpdate = [];
        await backupService.updateBackup({ storage: "s3" }, { isSynced: 0 });
        console.log("s3 list: ", s3List)
        for (const meta of s3List) {
            const storagePath = meta.Key.replace(config.wasabi.backupPrefix || "", '');
            const name = storagePath.split('/')[0];
            const data = await formatMeta({...meta, name, storagePath}, destConfig)
            const backupExists = await backupService.existsByStoragePath(meta.Key)
            if (!backupExists) {
                await backupService.insert(data);
                console.log("insert data")
            } else {
                console.log("update data")
                bulkUpdate.push(backupService.markSyncedByStoragePath(storagePath));
            }
            onlineList.push(data)
        }
        await Promise.all(bulkUpdate);
    }
     console.log("remote list: ", remoteList)
    if (Array.isArray(remoteList) && remoteList.length > 0) {
        const bulkUpdate = [];
        await backupService.updateBackup({ storage: "remote" }, { isSynced: 0 });
        for (const meta of remoteList) {
            const storagePath = meta.key.replace(config.hosts[0]?.destinationFolder ?? "", '');
            const data = await formatMeta({...meta, storagePath}, destConfig)            
            const backupExists = await backupService.existsByStoragePath(meta.name)
            if (!backupExists) {
                console.log("insert new remote backup")
                await backupService.insert(data);
            } else {
                console.log("update backup remote data log")
                bulkUpdate.push(backupService.markSyncedByStoragePath(storagePath));
            }
            onlineList.push(data);
        }
        await Promise.all(bulkUpdate);
    }
    if (Array.isArray(localList) && localList.length > 0) {
        await backupService.updateBackup({ storage: "local-storage"},  { isSynced: 0 } );
        for (const meta of localList) {
            const backupFile = await backupService.existsByStoragePath(meta.name);
            const backup = await formatMeta(meta, destConfig)
            if (backupFile) {
                await backupService.updateBackup({ backup_id: backupFile.backup_id }, { isSynced: 1 });
            } else {
                await backupService.insert(backup)
            }
            onlineList.push(backup);
        }
    }
}

const getMergedBackupList = async () => {
    const adminUser = await userService.adminUser();
    let list = await backupService.findBackups({ status: "completed", isSynced: 1, userId: adminUser.id });
    if (!list && !list.data)
        return [];
    const metaBackups = new Map();
    for (const metaFile of list.data) {
        if (!metaBackups.has(metaFile.backupUid)) {
            metaBackups.set(metaFile.backupUid, metaFile)
        } else {
            const curMetaFile = metaBackups.get(metaFile.backupUid);
            curMetaFile.size += metaFile.size;
            metaBackups.set(metaFile.backupUid, curMetaFile);
        }
    }
    return metaBackups.values();
}

exports.printBackupList = async () => {
    const backupList = await getMergedBackupList();
    printTable(backupList);
}


exports.listBeforeDate = async ({ storage }) => {
    const lastDateTmp = new Date().getTime() - config.retentionTime;
    const params = { ltCreaztedAt: lastDateTmp, storage, status: "completed" };
    const result = await backupService.findBackups(params);
    if (result.success) {
        return result.data
    } else {
        return [];
    }
}