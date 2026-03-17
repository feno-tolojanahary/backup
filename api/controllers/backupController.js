const backupService = require("../../lib/db/backupService");
const jobService = require("../../lib/db/job/jobService");
const { getConfigurationsByTargetName } = require("../../lib/helper/mapConfig");
const { deleteBackup } = require("../../lib/storages/storageHelper");
const { restorePlainBackup, restoreEncryptedBackup } = require("../../lib/sources/mongodb/mongodbHandler");
const response = require("../utils/response");

class BackupController {
    constructor() {}

    async getList(req, res, next) {
        try {
            const userId = req.params.userId;
            if (!userId) 
                throw new Error("userId is required on params");
            const result = await backupService.getBackups({userId});
            if (result.success !== true) 
                throw new Error(result.message);
            response.success(res, result);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async deleteBackup(req, res, next) {
        try {
            if (!req.params.id)
                throw new Error("No id provided on params");
            const backupInfo = await backupService.findByNameOrId(req.params.id);
            await deleteBackup(backupInfo);
            response.noContent(res);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }

    async restoreBackup(req, res, next) {
        try {
            if (!req.params.id)
                throw new Error("Backup id on params required.");
            const backupInfo = await backupService.findByNameOrId(req.params.id);
            const restoreName = req.query.restoreName || backupInfo.name.split(".")[0];
            const job = await jobService.findJob({ id: backupInfo.job_id });
            const { sourceConf } = getConfigurationsByTargetName(job.target);
            const downloadPath = await downloadBackup({ backup: backupInfo });
            if (!backupInfo.encrypted) {
                await restorePlainBackup({restoreName, downloadPath, sourceConf});
            } else {
                await restoreEncryptedBackup({restoreName, downloadPath, sourceConf});
            }
            response.success(res, { success: true })            
        } catch (error) {
            console.log(error);
            response.error(res, { success: false, errorMsg: error.message}&&);
            next(error);
        }
    }
}

module.exports = new BackupController();