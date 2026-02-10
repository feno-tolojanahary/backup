const moment = require("moment");
const { s3Log, hostLog, resumeLog } = require("../backupLog");

exports.getResumeLog = async () => {
    const resLog = await resumeLog.readAll();
    return resLog;
}

exports.syncLogList = async ({ s3List, remoteList }) => {
    const allList = [];
    if (Array.isArray(s3List) && s3List.length > 0) {
        await s3Log.emptyFile();                
        for (const meta of s3List) {
            const data = { 
                name: meta.Key, 
                size: `${(meta.Size / 1024).toFixed(2)} Mb`, 
                storage: "wasabi", 
                modifiedAt: meta.LastModified,
                encrypted:  meta.Key.includes(".zip") ? false : true
            };
            s3Log.objLog(data);
            allList.push(data);
        }
    }

    if (Array.isArray(remoteList) && remoteList.length > 0) {
        await hostLog.emptyFile();
        for (const meta of remoteList) {
            const data = { 
                name: meta.name, 
                size: `${(meta.size / 1024).toFixed(2)} Mb`, 
                storage: "remote",
                modifiedAt: meta.modifyTime,
                encrypted:  meta.name.includes(".zip") ? false : true
            };
            hostLog.objLog(data);
            allList.push(data);
        }
    }
}

exports.printSyncLog = async () => {
    const wasabiList = await s3Log.readAll();
    const remoteList = await hostLog.readAll();

    const list = [...wasabiList, ...remoteList];
    
    for (const backup of list) {
        console.log(`Name: ${backup.name}, Size: ${backup.size}, Date: ${moment(backup.modifiedAt).format("LLL")}, Storage: ${backup.storage}`);
    }
}

exports.listBeforeDate = async (inputDate, type) => {
    const lists = [];
    let archiveLists = [];
    
    if (type === "wasabi")
        archiveLists = await s3Log.readAll();
    else
        archiveLists = await hostLog.readAll();

    if (!Array.isArray(archiveLists) || archiveLists.length === 0)
        return [];
    for (const metaBcp of archiveLists) {
        try {
            const backupDate = new Date(metaBcp.modifiedAt)
            if (backupDate < new Date(inputDate)) {
                // console.log("remote: ", metaBcp.name)
                lists.push(metaBcp.name);
            }
        } catch(error) {
            console.log(`ERROR on name ${metaBcp.name} --> `, error.message)
        }
    }
    return lists;
}