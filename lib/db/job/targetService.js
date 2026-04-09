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

    async update(id, update) {
        try {
            if (!update.source || !Array.isArray(update.destinations) || update.destinations?.length === 0)
                throw new Error("No source or destinations given.");
            // delete existing target destinations
            const target = db.prepare(`SELECT * FROM targets WHERE id = ?`).get(id);
            if (!target)
                throw new Error("Target not found.");
            db.prepare(`DELETE FROM target_destinations WHERE target_id = ?`).run(id);
            db.prepare(`UPDATE targets SET source_id = ?`).run(update.source);
            for (const destination of update.destinations) {
                db.prepare(`INSERT INTO target_destinations (target_id, destination_id, created_by) VALUES (?, ?, ?)`)
                    .run(target.id, destination, target.created_by);
            }
            return { ok: true }
        } catch (error) {
            console.log("Error update target: ", error.message);
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

    async getTargetDetailConf(targetId) {
        try {
            const query = `
            SELECT 
                t.name,
                json_object(
                    'id', s.id,
                    'name', s.name,
                    'config', s.config
                ) AS source,
                json_group_array(
                    json_object(
                        'id', d.id,
                        'name', d.name,
                        'config', d.config
                    )
                ) AS destinations
            FROM targets t
            LEFT JOIN sources s ON s.id = t.source_id
            LEFT JOIN target_destinations td ON td.target_id = t.id
            LEFT JOIN destinations d ON td.destination_id = d.id
            t WHERE t.id = ?
            GROUP BY t.id
            `;
            const target = db.prepare(query).get(targetId);
            return { 
                ...target,
                source: target.source ? { ...target.source, ...(target.source?.config ? JSON.parse(target.source?.config) : {})  } : null,
                destinations: (target.destinations ?? []).map(dest => ({ ...dest, ...(dest.config ? JSON.parse(dest.config) : {}) }))
             }
        } catch (error) {
            throw Error("Error get target detail: ", error.message);
        }
    }
}

module.exports = new TargetService();