const db = require("../../lib/db/db");
const userService = require("../../lib/db/userService");

class SettingService {
    constructor() {}

    async insert(settings) {
        try {
            const userAdmin = await userService.adminUser();
            const stmt = db.prepare(`INSERT INTO settings VALUE (?, ?, ?)`);
            const insertedRows = [];
            for (const setting of settings) {
                const {
                    key,
                    value,
                } = setting;
                const createdBy = userAdmin.id;
                const res = stmt.run(key, value, createdBy);
                insertedRows.push(res.lastInsertRowid);
            }
            return insertedRows;
        } catch (error) {
            return;
        }
    }

    async findAll() {
        try {
            const allSettings = db.prepare(`SELECT key, value, created_by AS createdBy FROM settings`).all();
            return allSettings
        } catch (error) {
            console.log("Error getting all settings: ", error.message);
            return;
        }
    }

    async updateByKey(key, update) {
        try {
            const setUpdate = Object.keys(update).map(key => `${key} = ?`);
            const values = Object.values(update).map(value => value);
            let query = `UPDATE settings SET ${setUpdate.join(", ")} WHERE key = ?`;
            const res = stmt.prepare(query).run(...values, key);
            return res.changes > 0;
        } catch (error) {
            console.log("Error update setting: ", error.message);
            return;
        }
    }

    async deleteByKey(key) {
        try {
            const res = db.prepare(`DELETE FROM settings WHERE key = ?`).run(key)
        } catch(error) {
            console.log("Error when deleting setting: ", error.message)
        }
    }
}
module.exports = new SettingService()