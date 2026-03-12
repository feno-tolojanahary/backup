const db = require("../../lib/db/db");

class NotificationEventService {
    constructor() {}

    async getList() {
        try {
            const notifications = db.prepare(`
                SELECT 
                    notif.id AS id,
                    notif.name AS name,
                    notif.event_type AS eventType,
                    notif.message AS message,
                    notif.payload AS payload,
                    notif.created_at AS createdAt,
                    jobs.name AS jobName,
                    backups.name AS backupName
                FROM notification_events notif
                LEFT JOIN jobs ON jobs.id = notif.job_id
                LEFT JOIN backups ON backups.id = notif.backup_id
                WHERE 1=1   
            `).all();
            return notifications
        } catch (error) {
            return;
        }
    }
}

module.exports = new NotificationEventService();