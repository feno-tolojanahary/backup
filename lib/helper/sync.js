const backupService = require("./../db/backupService");
const { config } = require("./../../config");
const { resumeLog } = require("../backupLog");
const { printTable } = require("./ui-console");
const remoteHandler = require("./../remote/remoteHandler");
const s3Handler = require("./../../lib/s3Handler");
const userService = require("../db/userService");

const getSyncedList = async () => {
    let s3List = [], remoteList = [];
    if ((await s3Handler.testConnection())) {
        s3List = await s3Handler.listS3Backup();
    }
    if ((await remoteHandler.hasConnectedServers())) {
        remoteList = await remoteHandler.getRemoteBackupList();
    } 
    let syncedList = await syncLogList({ s3List, remoteList })
    return syncedList;
}

exports.getSyncedList = getSyncedList;

exports.getResumeLog = async () => {
    const resLog = await resumeLog.readAll();
    return resLog;
}

const syncLogList = async ({ s3List, remoteList }) => {
    const allList = [];
    if (Array.isArray(s3List) && s3List.length > 0) {
        const bulkUpdate = [];
        const adminUser = await userService.adminUser();
        await backupService.updateBackup({ storage: "wasabi" }, { isSynced: 0 });
        console.log("s3 list: ", s3List)
        for (const meta of s3List) {
            const backupExists = await backupService.existsByStoragePath(meta.Key)
            const storagePath = meta.Key.replace(config.wasabi.backupPrefix || "", '');
            if (!backupExists) {
                const name = storagePath.split('/')[0];
                const data = { 
                    name,
                    storage: "wasabi", 
                    status: "completed",
                    userId: adminUser.id,
                    modifiedAt: Math.floor(new Date(meta.LastModified).getTime() / 1000),
                    encrypted:  name.endsWith(".zip") ? 0 : 1,
                    lastSynced: Date.now()
                };
                const uploadedData = {
                    storagePath,
                    storage: "wasabi",
                    status: "online",
                    type: "file",
                    size: meta.Size / 1024,
                    prefix: config.wasabi.backupPrefix
                };
                data.uploadedData = uploadedData;
                await backupService.insert(data);
                console.log("insert data")
            } else {
                console.log("update data")
                bulkUpdate.push(backupService.markSyncedByStoragePath(storagePath));
            }
            allList.push(data);
        }
        await Promise.all(bulkUpdate);
    }
     console.log("remote list: ", remoteList)
    if (Array.isArray(remoteList) && remoteList.length > 0) {
        const bulkUpdate = [];
        const adminUser = await userService.adminUser();
        await backupService.updateBackup({ storage: "remote" }, { isSynced: 0 });
        for (const meta of remoteList) {
            const backupExists = await backupService.existsByStoragePath(meta.name)
            const storagePath = meta.key.replace(config.hosts[0]?.destinationFolder ?? "", '');
            if (!backupExists) {
                const name = storagePath.split('/')[0];
                const data = { 
                    name,
                    storage: "remote",
                    status: "completed",
                    modifiedAt: Math.floor(new Date(meta.modifyTime).getTime() / 1000),
                    userId: adminUser.id,
                    isArchived: 0,
                    encrypted:  name.includes(".zip") ? 0 : 1,
                    lastSynced: Date.now()
                };
                const uploadedData = {
                    storagePath,
                    size: meta.size / 1024, 
                    storage: "remote",
                    status: "online",
                    type: name.includes(".zip") ? "file" : "folder",
                    destinationFolder: config.hosts[0]?.destinationFolder
                }
                data.uploadedData = uploadedData;
                await backupService.insert(data);
                console.log("insert new remote backup")
            } else {
                console.log("update backup remote data log")
                bulkUpdate.push(backupService.markSyncedByStoragePath(storagePath));
            }
            allList.push(data);
        }
        await Promise.all(bulkUpdate);
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