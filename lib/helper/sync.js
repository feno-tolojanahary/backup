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
            const data = { 
                storagePath: meta.Key, 
                size: meta.Size / 1024, 
                storage: "wasabi", 
                status: "completed",
                userId: adminUser.id,
                modifiedAt: Math.floor(new Date(meta.LastModified).getTime() / 1000),
                encrypted:  meta.Key.includes(".zip") ? 0 : 1,
                isArchived: 0,
                lastSynced: Date.now()
            };
            const backupExists = await backupService.existsByStoragePath(meta.Key)
            if (!backupExists) {
                await backupService.insert(data);
                console.log("insert data")
            } else {
                console.log("update data")
                bulkUpdate.push(backupService.updateBackup({ storagePath: meta.Key }, { isSynced: 1, ...data }));
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
            const data = { 
                storagePath: meta.name, 
                size: meta.size / 1024, 
                storage: "remote",
                status: "completed",
                modifiedAt: Math.floor(new Date(meta.modifyTime).getTime() / 1000),
                userId: adminUser.id,
                isArchived: 0,
                encrypted:  meta.name.includes(".zip") ? 0 : 1,
                lastSynced: Date.now()
            };
            const backupExists = await backupService.existsByStoragePath(meta.name)
            if (!backupExists) {
                await backupService.insert(data);
                console.log("insert new remote backup")
            } else {
                console.log("update backup remote data log")
                bulkUpdate.push(backupService.updateBackup({ storagePath: meta.name }, { isSynced: 1, ...data }));
            }
            allList.push(data);
        }
        await Promise.all(bulkUpdate);
    }
}

const mergeBackupList = (listData) => {
    if (!listData)
        return [];
    const remoteList = listData.filter((backup) => backup.storage === "remote")
                            .map((backup) => ({ ...backup, name: backup.storagePath }))
    const s3List = listData.filter((backup) => backup.storage === "wasabi");
    
    // Group S3 backups by prefix (folder structure)
    const defaultPrefixDeph = 1;
    const groupedS3 = {};
    s3List.forEach((backup) => {
        let prefixDepth = defaultPrefixDeph;
        if (backup.prefix) {
            prefixDepth = backup.prefix.split('/').length;
        }
        const parts = backup.storagePath.split('/');
        const prefix = parts.slice(0, prefixDepth).join('/');
        console.log("prefix depth: ", prefixDepth)
        
        if (!groupedS3[prefix]) {
            groupedS3[prefix] = [];
        }
        backup.name = prefix;
        groupedS3[prefix].push(backup);
    });
    const mergedS3 = [];
    for (const [_key, value] of Object.entries(groupedS3)) {
        const backup = value.reduce((meta, backupInfo) => {
            if (!meta) {
                meta = backupInfo;
                meta.s3Keys = [meta.storagePath];
            } else {
                console.log("meta after: ", meta)
                meta.s3Keys.push(backupInfo.storagePath);
                meta.size += backupInfo.size;
            }
            return meta;
        }, null)
        if (backup.prefix) {
            backup.name = backup.name.replace(backup.prefix, '');
        }
        mergedS3.push(backup);
    }
    console.log("wasabi after: ", groupedS3)
    console.log("s3 merged after: ", mergedS3)
    const groupedList = [...remoteList, ...(Object.values(mergedS3))];
    return groupedList;
}

exports.printBackupList = async () => {
    const adminUser = await userService.adminUser();
    let list = await backupService.getAllBackups({ status: "completed", isSynced: 1, userId: adminUser.id });
    console.log("list before: ", list.data)
    const groupedList = mergeBackupList(list.data);
    printTable(groupedList);
}


exports.listBeforeDate = async ({ storage }) => {
    const lastDateTmp = new Date().getTime() - config.retentionTime;
    const params = { ltCreaztedAt: lastDateTmp, storage, status: "completed" };
    const result = await backupService.getAllBackups(params);
    if (result.success) {
        return result.data
    } else {
        return [];
    }
}