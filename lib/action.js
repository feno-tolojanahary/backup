const fs = require("node:fs/promises");
const { config } = require("./../config");
const Log = require("./log");
const { Tail } = require("tail");
const s3Wasabi = require("./helper/s3");
const s3Handler = require('./../lib/s3Handler')
const { restoreMongoDb } = require('./dbdriver');
const { downloadFileFromServer } = require("./remote/remoteHandler");
const { watchLogFile } = require("./utils");
const logFile = new Log("backup.log")

exports.removeArchives = async () => {
    const lastDateTmp = new Date().getTime() - config.retentionTime*1000;
    const archives = await logFile.getArchiveToRemove(new Date(lastDateTmp));
    const deleteArchiveFunc = archives.map(archive => s3Handler.removeBackupOnS3(archive));
    await Promise.all(deleteArchiveFunc);
}

exports.backupList = async () => {
    const backupList = await logFille.getBackupList({ limit: 20, skip: 0 });
    for (const backupInfo of backupList) {
        console.log(`Index: ${backupInfo.index}  Name: ${backupInfo.archiveName}  Date: ${backupInfo.dataIso}`);
    }
}

exports.restoreBackup = async (name, opts) => {
    try {
        const backupInfo = await logFile.getByName(name);
        if (backupInfo) {
            console.log(`Index ${name} not found in the backup`);
            process.exit(1);
        }
        console.log(`Download ${name} from wasabi`);
        let downloadPath = "";
        if (opts.wasabi) {
            downloadPath = await s3Wasabi.downloadFile({ key: backupInfo.fileName });
        } else if (opts.remote) {
            downloadPath = await downloadFileFromServer(fileName, opts.host)
        }
        console.log(`${name} downloaded to ${downloadPath}`)
        if (!downloadPath) {
            console.log("The database doesnt exists on the wasabi s3");
            process.exit(0);
        }
        const restoreName = opts?.to ?? backupInfo.fileName.split(".")[0];        
        await restoreMongoDb(downloadPath, restoreName);
        await fs.unlink(downloadPath);     
        console.log(`removing ${downloadPath}`)
    } catch (error) {
        console.log("Error when restoring a backup: ", error.message);
    }
}

exports.watchLogDaemon = () => {
    const lineNbr = 10;
    const tailLog = new Tail(config.daemonOut, {
        nLines: lineNbr,
        fromBeginning: false
    })
    const tailError = new Tail(config.daemonErr, {
        nLines: lineNbr,
        fromBeginning: false
    })

    tailLog.on("line", (data) => {
        console.log("LOG: ", data);
    })

    tailError.on("line", (data) => {
        console.log("ERROR: ", data);
    })
}

exports.watchLogDaemon2 = async () => {
    const lineNbr = 10;
    watchLogFile(config.daemonOut, lineNbr, "LOG");
    watchLogFile(config.daemonErr, lineNbr, "ERROR")
}