const notificationEventService = require("./../../services/notifications/notificationEventService");
const response = require("../../utils/response");

class NotificationEventController {
    constructor() {}

    async getNotifications(req, res, next) {
        try {
            console.log("get notifications")
            const notifications = await notificationEventService.getList();
            console.log("notification list: ", notifications)
            response.success(res, notifications);
        } catch (error) {
            console.log(error);
            response.error(res, error.message);
            next(error);
        }
    }
}   

module.exports = new NotificationEventController();