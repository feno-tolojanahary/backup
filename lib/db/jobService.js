const db = require("./db");

class JobService {
    constructor() {}

    async insert(job) {
        try {
            const {
                name,
                storages,
                status,
                scheduleType,
                scheduleValue,
                createdBy
            } = job;

            const createdAt = Math.floor(Date.now() / 1000);
            const isEnable = 1;
            const storage = JSON.stringify(storages);

            const stmt = db.prepare(`INSERT INTO jobs (
                    name, is_enable, status, storage, schedule_type, schedule_value, created_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

            const res = stmt.run(name, isEnable, status, storage, scheduleType, scheduleValue, createdBy, createdAt, createdAt);
            if (!res.lastInsertRowid)
                throw new Error("Unable to insert job data");
            return {
                success: true,
                lastID: res.lastInsertRowid,
                message: "Job inserted with success"
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    async update(filters, updateData) {
        try {
            const setUpdate = [], paramVals = [];
            
            const mapFields = {
                "isEnabled": "is_enabled",
                "scheduleType": "schedule_type",
                "scheduleValue": "schedule_value",
            }

            for (const [key, value] of Object.entries(updateData)) {
                setUpdate.push(` SET ${mapFields[key] ? mapFields[key] : key} = ? `);
                paramVals.push(value);
            }
            let query = `
                UPDATE jobs
                SET ${setUpdate}
                WHERE 1=1
            `;

            
            if (filters.name) {
                query += " AND name = ?";
                paramVals.push(filters.name);
            }

            if (filters.id) {
                query += " AND id = ?";
                paramVals.push(filters.id);
            }
            
            const updStmt = db.prepare(query)
            
            const res = updStmt.run(...paramVals);
            if (res.changes === 0) 
                throw new Error("Jobs not found.")
            return {
                success: true,
                message: "Job updated with success."
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        } 
    }

    async deleteJob (filters) {
        try {
            if (!filters.jobId || !filters.jobName) {
                throw new Error("the params jobId or jobName is required");
            }
            let query = `DELETE FROM jobs WHERE 1 = 1`
            if (filters.jobId) {
                query += ` AND id = ?`;
            } 
            if (filters.jobName) {
                query += ` AND name = ?`;
            }
            const paramVals = [filters.jobId, filters.jobName].filter(Boolean);
            const stmt = db.prepare(query);
            const res = stmt.run(...paramVals);
            if (res.changes === 0) 
                throw new Error("Job to delete not found");
            return {
                success: true,
                message: "Job deleted with success."
            }
        } catch (error) {
            return {
                success: false,
                message: error.messge
            }    
        }
    }

    async listJob (filters) {
        try {
            const paramVals = [];
            const query = `SELECT * FROM jobs WHERE 1=1`;
            if (filters.status) {
                query += " status = ?"
                paramVals.push(filters.status)
            }
            if (filters.userId) {
                query += " created_by = ?";
                paramVals.push(filters.userId)
            }
            const stmt = db.prepare(query);
            const jobs = stmt.all(...paramVals);
            return {
                success: true,
                count: jobs.length,
                data: jobs.map((j) => ({
                    id: j.id,
                    name: j.name,
                    isEnable: j.is_enable,
                    status: j.status,
                    storage: j.storage,
                    scheduleType: j.schedule_type,
                    scheduleValue: j.schedule_value,
                    createdBy: j.created_by,
                    updatedAt: j.updated_at
                }))
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

}

module.exports = new JobService();