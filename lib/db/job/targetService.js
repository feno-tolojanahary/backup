const db = require("../db");

class TargetService {
    constructor() {}

    async insert(target) {
        try {
            const {
                name,
                source_id,
                type,
                created_by
            } = target;
            const stmt = db.prepare(`INSERT INTO targets (name, source_id, type, created_by) VALUES (?, ?, ?, ?)`);
            const res = stmt.run(name, source_id, type, created_by);
            return {
                ok: true,
                lastId: res.lastInsertRowid
            }
        } catch (error) {
            return {
                ok: false,
                errorMsg: error.message
            }
        }
    }

    async insertTargetDestinations(targetDestinations = []) {
        try {
            const stmt = db.prepare(`INSERT INTO target_destinations (target_id, destination_id, created_by) VALUES(?, ?, ?)`);
            const lastIds = [];
            for (const targetDest of targetDestinations) {
                const { target_id, destination_id, created_by } = targetDest;
                const res = stmt.run(target_id, destination_id, created_by);
                lastIds.push(res.lastInsertRowid);
            }
            return {
                ok: true,
                lastIds
            }
        } catch (error) {
            return {
                ok: false,
                errorMsg: error.message
            }
        }
    }
}

module.exports = new TargetService();