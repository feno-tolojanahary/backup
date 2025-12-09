const fs = require("fs").promises;
const s3Handler = require("../s3Handler");
const remoteHandler = require("../remote/remoteHandler");
const { s3Log, hostLog } = require("../backupLog");

exports.syncS3 = async () => {
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

exports.syncRemote = async () => {
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

// exports.wrapUpLog = async () => {
// }