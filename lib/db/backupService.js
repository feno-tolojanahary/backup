const db = require("./db");
const { ulid } = require("ulid");

class BackService {
    constructor() {}

    async insert(backup) {
        try {
            const backup_id = ulid();
            const {
                storagePath,
                userId,
                encrypted,
                size,
                status,
                modifiedAt,
                storage,
                type = "file",
                lastSynced = Date.now()
            } = backup;
            const isSynced = 1;
            const insert = db.prepare(`
                INSERT INTO backups (backup_id, storage_path, user_id, is_encrypted, total_size, status, modified_at, storage, is_synced, type, last_synced) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            const result = insert.run(
                backup_id, storagePath, userId, encrypted, size, status, modifiedAt, storage, isSynced, type, lastSynced
            )
            
            return {
                success: true,
                lastID: result.lastInsertRowid,
                message: "Backup metadata inserted"
            }
        } catch (error) {
            console.log("Error inserting backup: ", error.message);
            return {
                success: false,
                message: error.message
            }
        }
    }   

    async getAllBackups(filters = {}) {
        try {
            let query = `
                SELECT *
                FROM backups
                WHERE 1=1
            `;

            const params = [];

            // Optional filters
            if (filters.userId) {
                query += ` AND user_id = ?`;
                params.push(filters.userId);
            }

            if (filters.status) {
                query += ` AND status = ?`;
                params.push(filters.status);
            }

            if (typeof filters.isArchived !== "undefined") {
                query += ` AND is_archived = ?`;
                params.push(filters.isArchived);
            }

            if (filters.storage) {
                query += ` AND storage = ?`;
                params.push(filters.storage);
            }

            if (filters.ltCreatedAt) {
                const createdAt = Math.floor(new Date(filters.ltCreatedAt).getTime() / 1000);
                query += ` AND created_at < ?`;
                params.push(createdAt);
            }

            if (typeof filters.isSynced !== "undefined") {
                query += ` AND is_synced = ?`;
                params.push(filters.isSynced);
            }

            if (filters.storagePath) {
                query += ` AND storage_path = ?`;
                params.push(filters.storagePath);
            }

            // Sort by most recent first
            query += ` ORDER BY modified_at DESC`;
            const getAllBackups = db.prepare(query);
            const backups = getAllBackups.all(...params);

            return {
                success: true,
                count: backups.length,
                data: backups.map((bp) => ({
                    storagePath: bp.storage_path,
                    userId: bp.user_id,
                    isEncrypted: bp.is_encrypted,
                    size: bp.total_size,
                    status: bp.status,
                    modifiedAt: bp.modified_at,
                    storage: bp.storage,
                    path: bp.path,
                    s3Keys: bp.s3_keys,
                    type: bp.type
                }))
            };
        } catch (error) {
            console.error('Error fetching backups:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async archiveBackup (backupUUID) {
        try {
            const query = `
                UPDATE backups
                SET is_archived = 1
                WHERE backup_id = ?
            `
            const update = db.prepare(query);
            const res = update.run(backupUUID);

            if (res.changes === 0) {
                return {
                    success: false,
                    error: "Backup not found"
                }
            }

            return {
                success: true,
                message: "Updating backup with success"
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    async existsByStoragePath (backupstoragePath) {
        try {
            const query = `
                SELECT 1 FROM backups WHERE storage_path = ? LIMIT 1
            `
            const stmt = db.prepare(query);
            const backup = stmt.get(backupstoragePath);
            return backup ? true : false;
        } catch (error) {
            return false
        }
    }

    async updateBackup (filters, updateData) {
        try {
            let params = [];
            const mapFields = {
                "isArchived": "is_archived",
                "isSynced": "is_synced",
                "archivedDate": "archived_date",
                "lastSynced": "last_synced"
            }
            const setUpdate = Object.keys(updateData).map((field) => mapFields[field] ? ` ${mapFields[field]} = ?` : ` ${field} = ?`)
            const values = Object().values(updateData).map((value) => value);

            const query = `
                UPDATE backups
                SET ${setUpdate.join(', ')}
                WHERE 1 = 1
            `

            if (filters.backupID) {
                query += " backup_id = ?";
                params.push(filters.backupID);
            }

            if (filters.storage) {
                query += " storage = ?";
                params.push(filters.storage);
            }

            if (filters.storagePath) {
                query == " storage_path = ?";
                params.push(filters.storagePath);
            }

            const update = db.prepare(query);
            const res = update.run(...values, ...params);
            if (res.changes === 0) {
                return {
                    success: false,
                    error: "Backup not found"
                }
            }

            return {
                success: true,
                message: "Updating backup with success"
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    async deleteMultiple (filters = {}) {
        let query = "DELETE FROM backups WHERE 1 = 1";
        const params = [];
        if (filters.storage) {
            query += " AND storage = ?";
            params.push(filters.storage)
        }
        const deleteStmt = db.prepare(query);
        deleteStmt.run(...params);
    }

}

module.exports = new BackService();