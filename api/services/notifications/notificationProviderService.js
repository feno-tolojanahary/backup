const db = require("../../../lib/db/db");

class NotificationProviderService {
    constructor() {}

    async insert(data) {
        try {
            let {
                name,
                type,
                config,
                isEnable,
                createdBy
            } = data;
            const stmt = db.prepare(`INSERT INTO notification_providers 
                    (name, type, config, is_enable, created_by)
                    VALUES (?, ?, ?, ?, ?)    
                `)
            isEnable = isEnable ? 1 : 0;
            const res = stmt.run(name, type, JSON.stringify(config), isEnable, createdBy)
            return res.lastInsertRowid;
        } catch (error) {
            console.log("Error inserting notificationProvider: ", error.message);
            return;
        }
    }

    async update(id, update) {
        try {
            const mapFields = {
                isEnable: "is_enable"
            }
            if (!id)
                throw new Error("id not provided");
            if (typeof update.isEnable !== "undefined")
                update.isEnable = update.isEnable ? 1 : 0;
            if (update.config) {
                const configNotification = db.prepare("SELECT config FROM notification_providers WHERE id = ?").get(id);
                const existConfig = configNotification.config ? JSON.parse(configNotification.config) : {}
                update.config = JSON.stringify({ ...existConfig, ...update.config });
            }
            const setUpdate = Object.keys(update).map(key => mapFields[key] ? `${mapFields[key]} = ?` : `${key} = ?`);
            const values = Object.values(update);
            let query = `UPDATE notification_providers SET ${setUpdate.join(', ')} WHERE id = ?`;
            const res = db.prepare(query).run(...values, id);
            return res.changes > 0;
        } catch (error) {
            console.log("Error when updating notification provider: ", error.message);
            return;
        }
    }

    async find(filters = {}) {
        try {
            let query = `SELECT * FROM notification_providers WHERE 1=1`;
            let values = [];
            if (filters.id) {
                query += " AND id = ?";
                values.push(filters.id);
            }
            const notifications = db.prepare(query).all(...values);
            return notifications.map(notif => ({
                ...notif,
                isEnable: notif.isEnable === 1 ? true : false,
                config: notif.config ? JSON.parse(notif.config) : {}
            }));
        } catch (error) {
            console.log("error get notif provider: ", error.message)
            return;
        }
    }

    async findById(id) {
        let query = `SELECT name, type, config, is_enable AS isEnable, created_by AS createdBy FROM notification_providers WHERE id=?`;
        const data = db.prepare(query).get(id);
        return { ...data, isEnable: isEnable === 1, config: notif.config ? JSON.parse(config) : {} }
    }

    async deleteById(id) {
        const result = db.prepare(`DELETE FROM notification_providers WHERE id = ?`).run(id);
        return result;
    }
}

module.exports = new NotificationProviderService();