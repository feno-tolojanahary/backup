const { config } = require("./../../config");
const { s3Log, hostLog, failedLog } = require("./../../lib/backupLog");
const EventEmitter = require("node:events");
const backupEvent = new EventEmitter();
const { sendEmailFailedBackup } = require("./../notifications/sendEmail");

const getProvider = (conf) => {
    if (conf.SMTP.host && conf.SMTP.auth && conf.SMTP.from && conf.SMTP.to)
        return { ...conf.SMTP, provider: "smtp" };
    if (conf.SES.from && conf.SES.to && conf.SES.region && conf.SES.accessKeyId && conf.SES.secretAccessKey)
        return { ...conf.SES, provider: "ses" };
}

backupEvent.on("backup_success", async (backupInfo) => {
    const dataLog = {
        name: backupInfo.name,
        size: backupInfo.size,
        storage: backupInfo.storage,
        modifiedAt: new Date(),
        encrypted: Boolean(backupInfo.encrypted)
    }
    if (backupInfo.storage === "remote") {
        await hostLog.objLog(dataLog);
    } else if (backupInfo.storage === "wasabi") {
        await s3Log.objLog(dataLog)
    }
})

backupEvent.on("backup_failed", async (backupInfo) => {
    const dataLog = {
        name: backupInfo.name,
        size: backupInfo.size,
        storage: backupInfo.storage,
        modifiedAt: new Date(),
        encrypted: Boolean(backupInfo.encrypted)
    }
    await failedLog.objLog(dataLog);
    if (config.notification.mail) {
        let provider = getProvider(config);
        if (!provider) {
            console.log("No email provider defined.");
            return;
        }
        await sendEmailFailedBackup({provider, backupInfo})
    }
})

exports.backupEvent = backupEvent;