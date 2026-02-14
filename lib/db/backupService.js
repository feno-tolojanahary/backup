const db = require("./db");
const { randomUUID } = require("crypto");

class BackService {
    constructor() {}

    async insert(backup) {
        try {
            const backup_uuid = randomUUID();
            const {
                name,
                userId,
                encrypted,
                size,
                status,
                modifiedAt,
                storage
            } = backup;
            const isSynced = 1;
            const insert = db.prepare(`
                INSERT INTO backups (backup_uuid, name, user_id, is_encrypted, total_size, status, modified_at, storage, is_synced) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            const result = insert.run(
                backup_uuid, name, userId, encrypted, size, status, modifiedAt, storage, isSynced
            )
            
            return {
                success: true,
                lastID: result.lastInsertRowid,
                message: "Backup metadata inserted"
            }
        } catch (error) {
            console.log("Error inserting backup");
            return {
                success: false,
                message: error.message
            }
        }
    }   

    async getAllBackups(filters = {}) {
        try {
            let query = `
                SELECT 
                    id,
                    backup_uuid,
                    name,
                    user_id,
                    is_encrypted,
                    total_size,
                    status,
                    modified_at,
                    storage,
                    created_at,
                    path,
                    s3_keys
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

            if (filters.isArchived) {
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

            if (filters.isSynced) {
                query += ` AND is_synced = ?`;
                params.push(filters.isSynced);
            }

            if (filters.name) {
                query += ` AND name = ?`;
                params.push(filters.name);
            }

            // Sort by most recent first
            query += ` ORDER BY modified_at DESC`;

            const getAllBackups = db.prepare(query);
            const backups = getAllBackups.all(...params);

            return {
                success: true,
                count: backups.length,
                data: backups.map((bp) => ({
                    name: bp.name,
                    userId: bp.user_id,
                    isEncrypted: bp.is_encrypted,
                    size: bp.total_size,
                    status: bp.status,
                    modifiedAt: bp.modifiedAt,
                    storage: bp.storage,
                    isArchived: bp.is_archived,
                    path: bp.path,
                    s3Keys: bp.s3_keys
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
                WHERE backup_uuid = ?
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

    async updateBackup (filters, updateData) {
        try {
            let params = [];
            const mapFields = {
                "isArchived": "is_archived",
                "isSynced": "is_synced",
                "archivedDate": "archived_date"
            }
            const setUpdate = Object.keys(updateData).map((field) => mapFields[field] ? ` ${mapFields[field]} = ?` : ` ${field} = ?`)
            const values = Object().values(updateData).map((value) => value);

            const query = `
                UPDATE backups
                SET ${setUpdate.join(', ')}
                WHERE 1 = 1
            `

            if (filters.backupUUID) {
                query += " backup_uuid = ?";
                params.push(filters.backupUUID);
            }

            if (filters.storage) {
                query += " storage = ?";
                params.push(filters.storage);
            }

            if (filters.name) {
                query == " name = ?";
                params.push(filters.name);
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

    async deleteMultiple ({ filters }) {
        let query = "DELETE FROM backups WHERE 1 = 1";
        const params = [];
        if (filters.storage) {
            query += " AND storage = ?";
            params.push(storage)
        }
        const deleteStmt = db.prepare(query);
        deleteStmt.run(...params);
    }
}

module.exports = new BackService();