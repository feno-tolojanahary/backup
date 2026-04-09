const db = require("../../../lib/db/db");

class SourceService {
    constructor() {}

    async insert(data) {
        try {
            const {
                name,
                type,
                config,
                status,
                createdBy
            } = data;

            const res = db.prepare(`INSERT INTO sources (name, type, config, status, created_by)
                                    VALUES (?, ?, ?, ?, ?)`)
                        .run(name, type, JSON.stringify(config), status, createdBy);

            return res.lastInsertRowid;
        } catch (error) {
            console.log("error insert source: ", error.message);
            return;
        }
    }

    async update(filters, update = {}) {
        try {
            if (!filters || Object.keys(filters).length === 0)
                return;
            let params = []
            if (update.config) 
                update.config = JSON.stringify(update.config);
            const setUpdate = Object.keys(update).map(key => `${key}=?`);
            const values = Object.values(update);
            let query = `UPDATE sources SET ${setUpdate.join(', ')}`
            if (filters.id) {
                query += " WHERE id = ?";
                params.push(filters.id)
            }
            const res = db.prepare(query).run(...values, ...params);
            return res.changes > 0;
        } catch (error) {
            console.log("Error update source: ", error.message);
            return;
        }
    }

    async find(filters = {}) {
        try {
            let query = `SELECT id, name, type, config, status, created_by AS createdBy FROM sources WHERE 1=1`;
            let values = [];
            if (filters.id) {
                query += " AND id = ?";
                values.push(filters.id);
            }
            const data = db.prepare(query).all(...values);
            return data.map(source => ({
                ...source,
                config: source.config ? JSON.parse(source.config) : {}
            }));
        } catch (error) {
            console.log("Error find source: ", error.message);
            return;
        }
    }

    async findById(id) {
        try {
            let query = `SELECT name, type, config, created_by AS createdBy FROM sources WHERE id=?`;
            const data = db.prepare(query).get(id);
            data.config = data.config ? JSON.parse(data.config) : {};
            return data;
        } catch (error) {
            console.log("Error find by id source: ", error.message);
            return;
        }
    }

    async deleteById(id) {
        try {
            const res = db.prepare(`DELETE FROM sources WHERE id = ?`).run(id);
            console.log("source deletion result: ", res);
            return res.changes;
        } catch (error) {
            console.log("error delete by id source: ", error.message);
            return false;
        }
    }
}

module.exports = new SourceService();
