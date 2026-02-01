const { s3Log, hostLog, resumeLog } = require("../backupLog");

exports.getResumeLog = async () => {
    const resLog = await resumeLog.readAll();
    return resLog;
}

exports.syncLogList = async ({ s3List, remoteList }) => {
    if (Array.isArray(s3List) && s3List.length > 0) {
        await s3Log.emptyFile();                
        for (const meta of s3List) {
            const data = { name: meta.Key, size: `${(meta.Size / 1024).toFixed(2)} Mb`, storage: "wasabi" };
            s3Log.objLog(data);
        }
    }

    if (Array.isArray(remoteList) && remoteList.length > 0) {
        await hostLog.emptyFile();
        for (const meta of remoteList) {
            const data = { name: meta.name, size: `${(meta.size / 1024).toFixed(2)} Mb`, storage: "remote" };
            hostLog.objLog(data);
        }
    }
}

exports.printSyncLog = async () => {
    const wasabiList = await s3Log.readAll();
    const remoteList = await hostLog.readAll();

    const list = [...wasabiList, ...remoteList];
    
    for (const backup of list) {
        console.log(`Name: ${backup.name}, Size: ${backup.size}, Storage: ${backup.storage}`);
    }
}