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
        for (const meta of s3List) {
            const data = { 
                path: meta.Key, 
                size: meta.Size, 
                storage: "wasabi", 
                status: "completed",
                userId: adminUser.id,
                modifiedAt: Math.floor(new Date(meta.LastModified).getTime() / 1000),
                encrypted:  meta.Key.includes(".zip") ? 0 : 1,
                isArchived: 0
            };
            const backupExists = await backupService.existsByStoragePath(meta.Key)
            if (!backupExists) {
                const childs = s3List.filter((entry) => entry.Key.includes(meta.Key));
                data.s3Keys = childs;
                await backupService.insert(data);
            } else {
                bulkUpdate.push(backupService.updateBackup({ name: meta.Key }, { isSynced: 1, ...data }));
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
                name: meta.name, 
                size: meta.size, 
                storage: "remote",
                status: "completed",
                modifiedAt: Math.floor(new Date(meta.modifyTime).getTime() / 1000),
                userId: adminUser.id,
                isArchived: 0,
                encrypted:  meta.name.includes(".zip") ? 0 : 1
            };
            const backupExists = await backupService.existsByName(meta.name)
            if (!backupExists) {
                await backupService.insert(data);
                console.log("insert new remote backup")
            } else {
                console.log("update backup remote data log")
                bulkUpdate.push(backupService.updateBackup({ name: meta.name }, { isSynced: 1, ...data }));
            }
            allList.push(data);
        }
        await Promise.all(bulkUpdate);
    }
}

exports.printBackupList = async () => {
    const adminUser = await userService.adminUser();
    const list = await backupService.getAllBackups({ isArchived: 0, isSynced: 1, userId: adminUser.id });
    printTable(list.data);
}


exports.listBeforeDate = async ({ storage }) => {
    const lastDateTmp = new Date().getTime() - config.retentionTime;
    const params = { ltCreaztedAt: lastDateTmp, storage, isArchived: 0 };
    const result = await backupService.getAllBackups(params);
    if (result.success) {
        return result.data
    } else {
        return [];
    }
}