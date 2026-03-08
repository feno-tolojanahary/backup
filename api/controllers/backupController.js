const backupService = require("../../lib/db/backupService");
const { deleteBackup } = require("../../lib/storages/storageHelper");
const response = require("../utils/response");

class BackupController {
    constructor() {}

    async getList(req, res, next) {
        try {
            const userId = req.params.userId;
            if (!userId) 
                throw new Error("userId is required on params");
            const result = await backupService.findBackups({userId});
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
}

module.exports = new BackupController();