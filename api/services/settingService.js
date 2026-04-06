const db = require("../../lib/db/db");
const userService = require("../../lib/db/userService");

class SettingService {
    constructor() {}

    async insert(setting, createdBy) {
        const stmt = db.prepare(`INSERT INTO settings (key, value, created_by) VALUES (?, ?, ?)`);
        const {
            key,
            value,
        } = setting;
        const res = stmt.run(key, value, createdBy);
        return res.lastInsertRowid;            
    }

    async insertMultiple(settings, createdBy) {
        try {
            const stmt = db.prepare(`INSERT INTO settings (key, value, created_by) VALUES (?, ?, ?)`);
            const insertedRows = [];
            for (const setting of settings) {
                const {
                    key,
                    value,
                } = setting;
                const res = stmt.run(key, value, createdBy);
                insertedRows.push(res.lastInsertRowid);
            }
            return insertedRows;
        } catch (error) {
            console.log("Error inserting setting: ", error.message);
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

    async findByKey(key) {
        try {
            const foundSetting = db.prepare(`SELECT * FROM settings WHERE key = ?`).get(key);
            return foundSetting;
        } catch (error) {
            console.log("Error upsert setting: ", error.message)
            return;
        }
    }

    async updateByKey(key, update = {}) {
        try {
            if (Object.keys(update).length === 0)
                throw new Error("no update field provided.");
            const setUpdate = Object.keys(update).map(key => `${key} = ?`);
            const values = Object.values(update).map(value => value);
            let query = `UPDATE settings SET ${setUpdate.join(", ")} WHERE key = ?`;
            const res = db.prepare(query).run(...values, key);
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