const db = require("./db");
const { ulid } = require("ulid");

class BackService {
    constructor() {}

    async insert(backup) {
        try {
            const backupUid = ulid();
            const {
                name,
                userId,
                encrypted,
                status,
                modifiedAt,
                storage,
                type = "file",
                lastSynced = Date.now(),
                destinationFolder,
                prefix,
                uploadedData
            } = backup;
            

            const isSynced = 1;
            
            const insert = db.prepare(`
                INSERT INTO backups (
                    etag, 
                    name,
                    user_id, 
                    is_encrypted, 
                    status, 
                    modified_at, 
                    storage, 
                    is_synced, 
                    type, 
                    last_synced, 
                    destination_folder,
                    prefix
                ) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            const result = insert.run(
                backupUid, name, userId, encrypted, status, modifiedAt, storage, isSynced, type, lastSynced, destinationFolder, prefix
            )

            if (!result.lastInsertRowid) {
                throw new Error("Error when inserting backups info")
            }

            for (const upFile of uploadedData) {
                const backupFile = {
                    ...upFile,
                    prefix,
                    destinationFolder,
                    backupUid,
                    storage
                }
                const res = await this.insertBackupFile(backupFile);
            }
            
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

    async insertBackupFile (backupFile) {
        try {
            const {
                storagePath,
                size,
                type = "file",
                prefix,
                destinationFolder,
                backupUid,
                storage
            } = backupFile;
            const insertBackupFile = db.prepare(`
                INSERT INTO backup_files (
                    storage_path,
                    backup_uid,
                    user_id
                    size,
                    type,
                    prefix,
                    destination_folder,
                    storage
                )    
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `)
            const resFileInfo = insertBackupFile.run(
                storagePath,
                backupUid,
                size,
                type,
                prefix,
                destinationFolder,
                storage                
            )
            return {
                success: true,
                lastId: resFileInfo.lastInsertRowid,
                message: "BackupFiles inserted"
            }
        } catch (error) {
            console.log("Error inserting backup files: ", error.message);
            return {
                success: false,
                message: error.message
            }
        }
    }

    async findBackups(filters = {}) {
        try {
            let query = `
                SELECT 
                    b.backup_uid as backup_uid,
                    b.name AS name,
                    b.user_id AS user_id,
                    b.is_synced AS is_synced,
                    b.is_encrypted AS is_encrypted,
                    b.total_size AS total_size,
                    b.status AS status,
                    b.last_synced AS last_synced,
                    b.modified_at AS modified_at,
                    b.storage AS storage,
                    b.archived_date AS archived_date,
                    bf.storage_path AS storage_path,
                    bf.size AS size,
                    bf.prefix AS prefix,
                    bf.destination_folder AS destination_folder
                FROM backup_files bf
                INNER JOIN backups b ON b.id = bf.backup_id
                WHERE 1=1
            `;

            const params = [];

            // Optional filters
            if (filters.name) {
                query += ` AND b.name = ?`;
                params.push(filters.name);
            }

            if (filters.userId) {
                query += ` AND b.user_id = ?`;
                params.push(filters.userId);
            }

            if (filters.status) {
                query += ` AND b.status = ?`;
                params.push(filters.status);
            }

            if (filters.storage) {
                query += ` AND b.storage = ?`;
                params.push(filters.storage);
            }

            if (filters.ltCreatedAt) {
                const createdAt = Math.floor(new Date(filters.ltCreatedAt).getTime() / 1000);
                query += ` AND b.created_at < ?`;
                params.push(createdAt);
            }

            if (typeof filters.isSynced !== "undefined") {
                query += ` AND b.is_synced = ?`;
                params.push(filters.isSynced);
            }

            if (filters.storagePath) {
                query += ` AND bf.path = ?`;
                params.push(filters.storagePath);
            }

            // Sort by most recent first
            query += ` ORDER BY b.modified_at DESC`;
            const findBackups = db.prepare(query);
            const backupFiles = findBackups.all(...params);

            return {
                success: true,
                count: backupFiles.length,
                data: backupFiles.map((b) => ({
                    backupUid: b.backup_uid,
                    name: b.name,
                    userId: b.user_id,
                    isSynced: b.is_synced === 1,
                    isEncrypted: b.is_encrypted === 1,
                    totalSize: b.total_size,
                    status: b.status,
                    lastSynced: b.last_synced ? new Date(b.last_synced) : null,
                    modifiedAt: b.modified_at ? new Date(b.modifed_at) : null,
                    storage: b.storage,
                    archivedDate: b.archived_date ? new Date(b.archived_date) : null,
                    storagePath: b.storage_path,
                    size: b.size,
                    prefix: b.prefix,
                    destinationFolder: b.destination_folder
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
                SET status = 'archived'
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
                SELECT 1 FROM backup_files WHERE storage_path = ? LIMIT 1
            `
            const stmt = db.prepare(query);
            const backup = stmt.get(backupstoragePath);

            return backup;
        } catch (error) {
            return false
        }
    }

    mapBackup = (b) => {
        return {
            backupUid: b.backup_uid,
            name: b.name,
            userId: b.user_id,
            isSynced: b.is_synced === 1,
            isEncrypted: b.is_encrypted === 1,
            totalSize: b.total_size,
            status: b.status,
            lastSynced: b.last_synced ? new Date(b.last_synced) : null,
            modifiedAt: b.modified_at ? new Date(b.modifed_at) : null,
            storage: b.storage,
            archivedDate: b.archived_date ? new Date(b.archived_date) : null,
        }
    }

    async findByNameOrId (nameOrId) {
        try {
            const stmt = db.prepare(`SELECT * FROM backups WHERE name = ? OR backup_id = ?`);
            const backup = stmt.get(nameOrId, nameOrId);
            if (!backup) 
                throw new Error("Backup not found.")
            return {
                success: true,
                data: this.mapBackup(backup)
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }

    async markSyncedByStoragePath (storagePath) {
        try {
            const updBackupFile = `
                UPDATE backup_files
                SET is_synced = 1
                WHERE storage_path = ?
            `;
            const updBackup = `
                UPDATE backups b
                JOIN backup_files bf ON b.backup_uid = bf.backup_uid
                SET b.is_synced = 1, b.last_synced = (cast(strftime('%s', 'now') as integer)
                WHERE bf.storage_path = ?
            `
            const updFileStmt = db.prepare(updBackupFile);
            const updFileRes = updFileStmt.exec(storagePath);
            const stmt = db.prepare(updBackup);
            const updBackupRes = stmt.exec(storagePath);
            
            if (updFileRes.changes === 0) {
                throw new Error("BackupFiles not found.")
            }

            if (updBackupRes.changes === 0) {
                throw new Error("Backup not found.");
            }

            return {
                success: true,
                message: "Updating with success."
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
                query += " storage_path = ?";
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

    async updateBackupFile (filters, updateData) {
        try {
            const mapFields = {};
            
            const setUpdate = Object.keys(updateData).map((field) => mapFields[field] ? ` ${mapFields[field]} = ?` : ` ${field} = ?`)
            const values = Object().values(updateData).map((value) => value);
            
            const query = `
                UPDATE backup_files
                SET ${setUpdate.join(', ')}
                WHERE 1=1
            `

            const params = [];
            if (filters.backupId) {
                query += " backup_id = ?"
                params.push(filters.backupId);
            }
            if (filters.userId) {
                query += " user_id = ?";
                params.push(filters.userId)
            }
            if (filters.storage) {
                query += " storage = ?";
                params.push(filters.storage);
            }

            const updStmt = db.prepare(query);
            const res = updStmt.run(...values, ...params);
            
            if (res.changes === 0) {
                return {
                    success: false,
                    error: "BackupFiles not found"
                }
            }

            return {
                success: true,
                message: "Updating backupFiles with success"
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

    async deleteMultipleBackupFiles (filters = {}) {
        let query = "DELETE FROM backup_files WHERE 1 = 1";
        const params = [];
        if (filters.storage) {
            query += " AND storage = ?";
            params.push(filters.storage)
        }
        const deleteStmt = db.prepare(query);
        deleteStmt.run(...params);
    }

    async deleteTable () {
        db.exec('DROP TABLE backups');
    }
}

module.exports = new BackService();
