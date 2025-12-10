const fs = require("fs").promises;
const s3Handler = require("../s3Handler");
const remoteHandler = require("../remote/remoteHandler");
const { s3Log, hostLog, resumeLog, resumeLog } = require("../backupLog");

const syncS3 = async () => {
    const hasConnection = await s3Handler.testConnection();
    if (!hasConnection)
        return;
    let s3Files = await s3Handler.listS3Backup();
    if (!s3Files || s3Files.length === 0)
        return;
    await fs.writeFile(s3Log.filePath, '');
    for (const s3File of s3Files) {
        const backupInfo = {
            name: s3File.Key,
            date: s3File.LastModified,
            size: s3File.Size,
            storage: "wasabi-s3"
        }
        s3Log.objLog(backupInfo);
    }
}

const syncRemote = async () => {
    const hasServerConnection = await remoteHandler.hasConnectedServers();
    if (!hasServerConnection)
        return;
    const files = await remoteHandler.getRemoteBackupList();
    if (!files || files.length === 0)
        return;
    for (const file of files) {
        const backupInfo = {
            name: file.name,
            date: file.modifyTime,
            size: file.size,
            storage: "host1"
        }
        hostLog.objLog(backupInfo);
    }
}

const wrapUpLog = async () => {
    const s3List = await s3Log.readAll();
    const remoteList = await hostLog.readAll();
    const backupList = [...s3List, ...remoteList];
    const combinedList = backupList.reduce((backups, bInfo) => {
        let foundBProperty;
        if (backups.has(bInfo.name)) {
            foundBProperty = backups.get(bInfo.name);
        }
        const s3Wasabi = bInfo.storage === "wasabi-s3" || foundBProperty?.s3Wasabi;
        const remoteHost = bInfo.storage === "host1" || foundBProperty?.remoteHost;
        const newProperty = {
            name: bInfo.name,
            date: bInfo.date,
            size: bInfo.size,
            s3Wasabi,
            remoteHost
        }
        backups.set(bInfo.name, newProperty);
    }, new Map())

    for (const property of combinedList) {
        resumeLog.objLog(property)
    }   
}

exports.getResumeLog = async () => {
    const resumeLog = await resumeLog.readAll();
    return resumeLog();
}

exports.synchroniseLog = async () => {
    await syncS3();
    await syncRemote();
    await wrapUpLog();
}