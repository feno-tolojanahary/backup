const db = require("../../../lib/db/db");

class DestinationService {
    constructor() {}

    async insert(data) {
        try {
            const {
                name,
                type,
                config,
                created_by
            } = data;

            const res = db.prepare(`INSERT INTO destinations (name, type, config, created_by)
                                    VALUES (?, ?, ?, ?)`)
                        .run(name, type, JSON.stringify(config), created_by);

            return res.lastInsertRowid;
        } catch (error) {
            return;
        }
    }

    async update(filters, update) {
        try {
            if (!filters || Object.keys(filters).length === 0)
                return;
            let params = []
            const setUpdate = Object.keys(update).map(key => `${key} = ?`);
            const values = Object.values();
            let query = `INSERT INTO destinations SET ${setUpdate}`
            if (filters.id) {
                query += " AND id = ?";
                params.push(filters.id)
            }
            const res = db.prepare(query).run(...values, ...params);
            return res.changes > 0;
        } catch (error) {
            return;
        }
    }

    async find(filters) {
        try {
            let query = `SELECT * FROM destinations WHERE 1=1`;
            let values = [];
            if (filters.id) {
                query += " AND id = ?";
                values.push(filters.id);
            }
            const data = db.prepare(query).all(...values);
            return data.map(dest => ({
                ...dest,
                config: dest.config ? JSON.parse(dest.config) : {}
            }));
        } catch (error) {
            return;
        }
    }

    async findById(id) {
        try {
            let query = `SELECT * FROM destinations WHERE id=?`;
            const data = db.prepare(query).get(id);
            return data;
        } catch (error) {
            return;
        }
    }

    async deleteById(id) {
        try {
            const res = db.prepare(`DELETE FROM destinations WHERE id = ?`).run(id);
            return res.changes;
        } catch (error) {
            return false;
        }
    }
}

module.exports = new DestinationService();