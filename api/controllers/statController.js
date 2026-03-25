const response = require("../utils/response");
const statService = require("./../services/statService");

class StatController {
    constructor() {}

    async getStats(req, res, next) {
        try {
            const totalData = await statService.getTotalData();
            const backupActivity = await statService.getBackupActivity();
            const backupStatus = await statService.getBackupStatus();
            const storageUsedByDest = await statService.getStorageUsedByDest();
          
            response.success(res, {
                totalData,
                backupActivity,
                backupStatus,
                storageUsedByDest
            })
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }
}

module.exports = new StatController();