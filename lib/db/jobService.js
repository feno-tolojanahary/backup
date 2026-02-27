const { default: CronExpressionParser } = require("cron-parser");
const db = require("./db");

class JobService {
    constructor() {}

    async insert(job) {
        try {
            const {
                name,
                destinations,
                status,
                scheduleType,
                scheduleValue,
                createdBy,
                sourceConfigName
            } = job;

            const createdAt = Math.floor(Date.now() / 1000);
            const isEnable = 1;
            const jsonStorage = JSON.stringify(destinations);

            const stmt = db.prepare(`INSERT INTO jobs (
                    name, is_enable, status, storage, schedule_type, schedule_value, created_by, created_at, updated_at, source
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

            const res = stmt.run(name, isEnable, status, jsonStorage, scheduleType, scheduleValue, createdBy, createdAt, createdAt, sourceConfigName);
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
                "sourceConfigName": "source_config_name",
                "destConfigName": "dest_config_name"
            }

            for (const [key, value] of Object.entries(updateData)) {
                setUpdate.push(` SET ${mapFields[key] ? mapFields[key] : key} = ? `);
                paramVals.push(value);
            }
            let query = `
                UPDATE jobs
                SET ${setUpdate.join(", ")}
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
                    storage: j.storage ? JSON.parse(j.storage) : [],
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

    async getNextRunJob(timeStampSecond) {
        try {
            const query = `
                SELECT * FROM job_schedule_state jbsc
                LEFT JOIN jobs j ON j.id = jbsc.job_id
                WHERE jbsc.next_run_at <= ?
                AND j.is_enable = 1
            `
            const stmt = db.prepare(query);
            const jobs = stmt.all(timeStampSecond);
            return jobs
        } catch (error) {
            return [];
        }
    }

    async pushToNextRun(jobs) {
        const finishedDate = Math.floor(Date.now()/1000);
        for (const job of jobs) {
            try {
                const stmt = db.prepare("UPDATE job_schedule_state SET next_run_at = ?, last_run_at = ? WHERE id = ?");
                let nextRun = job.next_run_at;
                switch(job.schedule_type) {
                    case "interval":
                        nextRun = finishedDate + Number(job.schedule_value);
                        break;
                    case "cron":
                        const interval = CronExpressionParser.parse(job.schedule_value, { currentDate: new Date(finishedDate*1000) });
                        nextRun = Math.floor(interval.next().getTime() / 1000);
                        break;
                    default:
                        break;
                }
                stmt.run(nextRun, finishedDate, job.id);
            } catch (error) {
                console.log("Update next run job: ", error.message);
            }
        }
    }

    async getNextToLaunch() {
        try {
            const currentDate = Date.now() / 1000;
            const stmt = db.prepare(`
                SELECT MIN(jb_s.next_run_at) AS next_run_at FROM job_schedule_state jb_s
                LEFT JOIN jobs j ON j.id = jb_s.job_id
                WHERE j.is_enable = 1 AND jb_s.next_run_at > ? 
            `)
            const nextJob = stmt.get(currentDate);
            return nextJob;
        } catch (error) {
            console.log("Error happen when get next to launch: ", error.message)
        }
    }

    async getRentetionJobs () {
        try {
            const jobs = db.prepare(`SELECT * FROM jobs WHERE retention_days IS NOT NULL AND retention_days > 0`).all();
            return jobs;
        } catch (error) {
            console.log("Error getting expirated jobs: ", error.message);
            return []
        }
    }

    async createJobRun (jobRun) {
        try {
            const {
                jobId,
                status,
                startAt = Date.now() / 1000,
                finishedAt,
                errorCode,
                errorMessage,
                createdAt = Date.now() / 1000,
            } = jobRun;

            const stmt = db.prepare(`INSERT INTO job_runs (
                job_id, status, start_at, finished_at, error_code, error_message, created_at    
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`)
            const res = stmt.run(jobId, status, startAt, finishedAt, errorCode, errorMessage, createdAt);
            return {
                success: true,
                lastId: res.lastInsertRowid                
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    async updateJobRun (jobRunId, update) {
        try {
            const setUpdateQr = Object.keys(update).map((key) => ({ attr: `${key} = ?`, value: update[key] }));
            const setUpdate = setUpdateQr.map(({ attr }) => attr);
            const values = setUpdateQr.map(({ value }) => value);
            const stmt = db.prepare(`UPDATE job_runs SET ${setUpdate.join(', ')} WHERE id = ?`);
            const res = stmt.run(...values, jobRunId);
            if (res.changes === 0)
                throw new Error("No job_runs data to update found.");
            return {
                success: true
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    async getJobRuns (filters) {
        try {
            let whereVals = [];
            let query = `
                SELECT jr.*, j.name AS job_name FROM job_runs jr 
                LEFT JOIN jobs j ON j.id = jr.job_id
                WHERE 1=1 `;
            if (filters.jobId) {
                query += " AND jr.job_id = ?";
                whereVals.push(filters.jobId);
            }

            if (filters.status) {
                query += " AND jr.status = ?";
                whereVals.push(filters.status);
            }
            if (filters.since) {
                query += " AND jr.created_at > ?";
                whereVals.push(filters.since);
            }
            const jobRuns = db.prepare(query).all(...whereVals);
            return jobRuns
        } catch (error) {
            console.log("Eror when getting list of job runs: ", error.message);
            return [];
        }
    }
}

module.exports = new JobService();