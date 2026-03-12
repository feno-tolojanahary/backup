const db = require("../../lib/db/db");

class NotificationService {
    constructor() {}

    async getList() {
        try {
            const notifications = db.prepare(`
                SELECT * FROM notifications                 
            `).all();
            return notifications
        } catch (error) {
            return;
        }
    }
}

module.exports = new NotificationService();