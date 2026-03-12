const notificationService = require("../services/notificationService");
const response = require("../utils/response");

class NotificationEventController {
    constructor() {}

    async getNotifications() {
        try {
            const notifications = await notificationService.getList();
            response.success(res, notifications);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }
}   

module.exports = new NotificationEventController();