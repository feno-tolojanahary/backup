const backupService = require("./../db/backupService");
const { s3Log, hostLog, resumeLog } = require("../backupLog");
const { mergeListByName } = require("./../utils");
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

const getList = async ({ wasabi = true, remote = true} = {}) => {
    let s3List = [], remoteList = [];
    if (wasabi) {
        if ((await s3Handler.testConnection())) {
            s3List = await s3Handler.listS3Backup();
        } else {
            s3List = await s3Log.readAll();
        }
    }
    if (remote) {                
        if ((await remoteHandler.hasConnectedServers())) {
            remoteList = await remoteHandler.getRemoteBackupList();
        } else {
            remoteList = await hostLog.readAll();
        }
    } 
    return [...s3List, ...remoteList];
}

exports.getSyncedList = getSyncedList;

exports.getResumeLog = async () => {
    const resLog = await resumeLog.readAll();
    return resLog;
}

const syncLogList = async ({ s3List, remoteList }) => {
    const allList = [];
    if (Array.isArray(s3List) && s3List.length > 0) {
        const bulkInsert = [];
        const adminUser = await userService.adminUser();
        await backupService.deleteMultiple({ storage: "wasabi" });
        for (const meta of s3List) {
            const data = { 
                name: meta.Key, 
                size: `${(meta.Size / 1024).toFixed(2)} Mb`, 
                storage: "wasabi", 
                modifiedAt: meta.LastModified,
                encrypted:  meta.Key.includes(".zip") ? false : true,
                userId: adminUser.id
            };
            bulkInsert.push(backupService.insert(data));
            allList.push(data);
        }
        await Promise.all(bulkInsert);
    }

    if (Array.isArray(remoteList) && remoteList.length > 0) {
        const bulkInsert = [];
        const adminUser = await userService.adminUser();
        await backupService.deleteMultiple({ storage: "remote" });
        for (const meta of remoteList) {
            const data = { 
                name: meta.name, 
                size: `${(meta.size / 1024).toFixed(2)} Mb`, 
                storage: "remote",
                modifiedAt: meta.modifyTime,
                userId: adminUser.id,
                encrypted:  meta.name.includes(".zip") ? false : true
            };
            bulkInsert.push(backupService.insert(data));
            allList.push(data);
        }
        await Promise.all(bulkInsert);
    }
}

exports.printBackupList = async () => {
    const adminUser = await userService.adminUser();
    const list = await backupService.getAllBackups({ isArchived: 0, userId: adminUser.id });
    printTable(list);
}


exports.listBeforeDate = async ({ storage }) => {
    const lastDateTmp = new Date().getTime() - config.retentionTime;
    const params = { ltCreaztedAt: lastDateTmp, storage };
    const result = await backupService.getAllBackups(params);
    if (result.success) {
        return result.data
    } else {
        return [];
    }
}