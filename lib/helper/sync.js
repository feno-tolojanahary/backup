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

// const getList = async ({ wasabi = true, remote = true} = {}, filters = {}) => {
//     let s3List = [], remoteList = [];
//     if (wasabi) {
//         if ((await s3Handler.testConnection())) {
//             s3List = await s3Handler.listS3Backup();
//         } else {
//             s3List = await s3Log.readAll();
//         }
//     }
//     if (remote) {                
//         if ((await remoteHandler.hasConnectedServers())) {
//             remoteList = await remoteHandler.getRemoteBackupList();
//         } else {
//             remoteList = await hostLog.readAll();
//         }
//     } 
//     return [...s3List, ...remoteList];
// }

exports.getSyncedList = getSyncedList;

exports.getResumeLog = async () => {
    const resLog = await resumeLog.readAll();
    return resLog;
}

const syncLogList = async ({ s3List, remoteList }) => {
    const allList = [];
    if (Array.isArray(s3List) && s3List.length > 0) {
        const bulkUpdate = [];
        await backupService.updateBackup({ storage: "wasabi" }, { is_synced: 0 });
        for (const meta of s3List) {
            const data = { 
                name: meta.Key, 
                size: `${(meta.Size / 1024).toFixed(2)} Mb`, 
                storage: "wasabi", 
                modifiedAt: meta.LastModified,
                encrypted:  meta.Key.includes(".zip") ? false : true
            };
            bulkUpdate.push(backupService.updateBackup({ name: meta.Key }, { is_synced: 1, ...data }));
            allList.push(data);
        }
        await Promise.all(bulkUpdate);
    }

    if (Array.isArray(remoteList) && remoteList.length > 0) {
        const bulkUpdate = [];
        const adminUser = await userService.adminUser();
        await backupService.updateBackup({ storage: "remote" }, { is_synced: 0 });
        for (const meta of remoteList) {
            const data = { 
                name: meta.name, 
                size: `${(meta.size / 1024).toFixed(2)} Mb`, 
                storage: "remote",
                modifiedAt: meta.modifyTime,
                userId: adminUser.id,
                encrypted:  meta.name.includes(".zip") ? false : true
            };
            bulkUpdate.push(backupService.updateBackup({ name: meta.name }, { is_synced: 1, ...data }));
            allList.push(data);
        }
        await Promise.all(bulkUpdate);
    }
}

exports.printBackupList = async () => {
    const adminUser = await userService.adminUser();
    const list = await backupService.getAllBackups({ isArchived: 0, isSynced: 1, userId: adminUser.id });
    printTable(list);
}


exports.listBeforeDate = async ({ storage }) => {
    const lastDateTmp = new Date().getTime() - config.retentionTime;
    const params = { ltCreaztedAt: lastDateTmp, storage };
    const result = await backupService.getAllBackups(params);
    console.log("result: ", result)
    if (result.success) {
        console.log("before date data: ", result.data)
        return result.data
    } else {
        return [];
    }
}