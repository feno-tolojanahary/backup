const { config } = require("./../../config");
const userService = require("./../db/userService");
const backupService = require("./../db/backupService");
const EventEmitter = require("node:events");
const backupEvent = new EventEmitter();
const { sendEmailFailedBackup } = require("./../notifications/sendEmail");
const { removeLog } = require("./../backupLog");

const getProvider = (conf) => {
    if (conf.SMTP.host && conf.SMTP.auth && conf.SMTP.from && conf.SMTP.to)
        return { ...conf.SMTP, provider: "smtp" };
    if (conf.SES.from && conf.SES.to && conf.SES.region && conf.SES.accessKeyId && conf.SES.secretAccessKey)
        return { ...conf.SES, provider: "ses" };
}

backupEvent.on("backup_success", async (metaBackup) => {
    const adminUser = await userService.adminUser();
    const dataLog = {
        ...metaBackup,
        status: "completed",
        userId: adminUser.id,
        encrypted: Boolean(metaBackup.encrypted) ? 1 : 0,
        modifiedAt: Date.now()
    }
    if (dataLog.storage === "wasabi") {
        dataLog.prefix = config.wasabi.backupPrefix;
    } 
    console.log("data log to insert: ", dataLog)
    const res = await backupService.insert(dataLog);
    if (res.success) {
        console.log("backup info inserted with sucecss");
    } else {
        console.log("error when inserting backup info: ", res.message);
    }
})

backupEvent.on("backup_failed", async (metaBackup) => {
    const adminUser = await userService.adminUser();
    const dataLog = {
        ...metaBackup,
        status: "failed",
        userId: adminUser.id,
        encrypted: Boolean(metaBackup.encrypted) ? 1 : 0
    }
    try {
        const res = await backupService.insert(dataLog);
        console.log("failed insertion res: ", res)
        if (res.success) {
            console.log("backup info inserted with sucecss");
        } else {
            console.log("error when inserting backup info: ", res.message);
        }
    } catch (error) {
        console.log("Error: ", error.message)
    }
    if (config.notification.mail) {
        let provider = getProvider(config);
        if (!provider) {
            console.log("No email provider defined.");
            return;
        }
        await sendEmailFailedBackup({provider, metaBackup})
    }
})

backupEvent.on("backup_delete", async ({ storagePath, storage }) => {
    const dataLog = { storagePath, storage, deletedDate: new Date() };
    console.log(`Storage ${storage}, remove backup: ${storagePath}`);
    removeLog.objLog(dataLog);
    await backupService.updateBackup({ storagePath, storage }, { status: "archived", archivedDate: Date.now() })
    await backupService.updateBackupFile({ storagePath, storage }, { status: "archived", archivedDate: Date.now() })
})

exports.backupEvent = backupEvent;