const fs = require("node:fs");
const path = require("node:path");
const backupService = require("../../lib/db/backupService");
const jobService = require("../../lib/db/job/jobService");
const { getConfigurationsByTargetName } = require("../../lib/helper/mapConfig");
const { deleteBackup, downloadBackup } = require("../../lib/storages/storageHelper");
const { restorePlainBackup, restoreEncryptedBackup } = require("../../lib/sources/mongodb/mongodbHandler");
const response = require("../utils/response");
const targetService = require("../../lib/db/job/targetService");
const destinationService = require("../services/infrastructure/destinationService");
const { decryptDataPath } = require("../../lib/encryption/cryptoTools");

class BackupController {
    constructor() {}

    async getList(req, res, next) {
        try {
            const userId = req.userId;
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
            response.error(res, error);
            next(error);
        }
    }

    async restoreBackup(req, res, next) {
        try {
            if (!req.params.id)
                throw new Error("Backup id on params required.");
            const backupInfo = await backupService.findByNameOrId(req.params.id);
            const restoreName = req.body.restoreName || backupInfo.name.split(".")[0];
            const job = await jobService.findJob({ id: backupInfo.job_id });
            let sourceConfig, destConfig;
            if (backupInfo.destinationId) {
                const destination = await destinationService.findById(backupInfo.destinationId)
                destConfig = { ...destination, ...destination.config };
                delete destConfig.config;
            }
            if (job.target_id) {
                const targetConf = await targetService.getTargetDetailConf(job.target_id);
                sourceConfig = { ...targetConf.source, ...JSON.parse(targetConf.source.config) };
                delete sourceConfig.config;
            } else {
                const { sourceConf } = getConfigurationsByTargetName(job.target);
                sourceConfig = sourceConf;
            }
            const downloadPath = await downloadBackup({ backup: backupInfo, conf: destConfig });
            console.log("download path: ", downloadPath);
            const originalName = sourceConfig.database;
            if (!backupInfo.isEncrypted) {
                await restorePlainBackup({restoreName, downloadPath, sourceConfig, originalName});
            } else {
                await restoreEncryptedBackup({restoreName, downloadPath, sourceConfig, originalName});
            }
            response.success(res, { success: true })            
        } catch (error) {
            console.log(error);
            response.error(res, { success: false, errorMsg: error.message});
            next(error);
        }
    }

    async downloadBackup (req, res, next) {
        try {
            if (!req.params.id)
                throw new Error("Backup id on params required.");
            const backupInfo = await backupService.findByNameOrId(req.params.id);
            const destination = await destinationService.findById(backupInfo.destinationId)
            if (!destination) {
                throw new Error("The destination is no longer available");
            }
            const destConfig = { ...destination, ...destination.config };
            delete destConfig.config;
            const downloadPath = await downloadBackup({ backup: backupInfo, conf: destConfig });
            if (!downloadBackup)
                throw new Error("Error downloading path");
            const decryptedFilePath = await decryptDataPath(downloadPath);
            
            const fileName = path.basename(decryptedFilePath);
            console.log("filename: ", fileName)
            res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
            res.setHeader("Content-Type", "application/zip");
            const stream = fs.createReadStream(decryptedFilePath);
            stream.pipe(res);

            stream.on('error', (error) => {
                if (!res.headerSent) {
                    throw new Error("Error reading file");
                }
            })
        } catch (error) {
            console.log(error);
            response.error(res, { success: false, errorMsg: error.message});
            next(error);
        }
    }
}

module.exports = new BackupController();