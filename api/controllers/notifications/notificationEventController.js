const notificationEventService = require("./../../services/notifications/notificationEventService");
const response = require("../../utils/response");

class NotificationEventController {
    constructor() {}

    async getNotifications() {
        try {
            const notifications = await notificationEventService.getList();
            response.success(res, notifications);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }
}   

module.exports = new NotificationEventController();