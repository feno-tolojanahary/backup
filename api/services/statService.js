const db = require("../../lib/db/db");

class StatService {
    constructor() {}

    async getBackupActivity() {
        const backupActivity = db.prepare(`
            WITH RECURSIVE days(day) AS (
                SELECT date('now', '-6 days')
                UNION ALL
                SELECT date(day, '+1 day')
                FROM days
                WHERE day < date('now')
            )
            SELECT 
                d.day,
                COALESCE(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END), 0) AS totalCompleted,
                COALESCE(SUM(CASE WHEN b.status = 'failed' THEN 1 ELSE 0 END), 0) AS totalFailed
            FROM days d
            LEFT JOIN backups b
             ON b.created_at >= strftime('%s', d.day)
             AND b.created_at < strftime('%s', date(d.day, '+1 day'))
             AND b.created_at >= strftime('%s', date(d.day, '-6 days'))
            GROUP BY d.day
            ORDER BY d.day ASC
        `).all();
        return backupActivity;
    }

    getBackupStatus() {
        return db.prepare(`
            SELECT status, COUNT(*) AS total FROM backups
                GROUP BY status
        `).all()
    }

    async getTotalData() {
        const target = db.prepare("SELECT COUNT(*) AS total FROM targets").get();
        const jobs = db.prepare("SELECT COUNT(*) AS total FROM jobs WHERE is_enable=1").get();
        const backups = db.prepare("SELECT COUNT(*) AS total FROM backups").get();
    
        const backupSize = db.get(`SELECT SUM(bf.size) AS totalSize FROM backup_files WHERE status='online'`);
    
        return {
            totalTarget: target?.total ?? 0,
            totalJobs: jobs?.total ?? 0,
            totalBackups: backups?.total ?? 0,
            totalBackupSize: backupSize?.total ?? 0
        }
    }

    async getStorageUsedByDest() {
        const storageUsedByDest = db.preprare(`
            SELECT COUNT(bf.size) AS totalSize, b.storage AS storage FROM backup_files
                LEFT JOIN backups b ON b.id = bf.backup_id
            WHERE b.status = 'completed'
            GROUP BY b.storage
        `).all();
        return storageUsedByDest;
    }
}

module.exports = new StatService();