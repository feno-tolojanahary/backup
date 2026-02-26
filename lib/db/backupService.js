const S3Provider = require("../s3/s3Provider");
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
                uploadedData,
                storageConf,
                jobId
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
                    prefix,
                    storage_conf,
                    job_id
                ) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            const result = insert.run(
                backupUid, name, userId, encrypted, status, modifiedAt, storage, isSynced, type, lastSynced, destinationFolder, prefix, storageConf, jobId
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
            const stmt = db.prepare(`
                SELECT
                    b.id AS id,
                    b.name AS name,
                    b.backup_uid AS backupUid,
                    b.user_id AS userId,
                    b.is_encrypted AS isEncrypted,
                    b.is_synced AS isSynced,
                    b.status AS status,
                    b.last_synced AS lastSynced,
                    b.modified_at AS modifiedAt,
                    b.created_at AS createdAt,
                    b.storage AS storage,
                    b.archived_date AS archivedDate,
                    bf.id AS fileId,
                    bf.storage_path AS storagePath,
                    bf.backup_id AS backupId,
                    bf.size AS size,
                    bf.status AS fileStatus,
                    bf.type AS fileType,
                    bf.prefix AS prefix,
                    bf.destination_folder AS destinationFolder,
                    bf.storage AS fileStorage
                FROM backups b
                LEFT JOIN backup_files bf ON b.id = bf.backup_id
                WHERE b.name = ? OR b.backup_uid = ? OR b.id = ?
            `);
            const rows = stmt.all(nameOrId, nameOrId, nameOrId);
            if (!rows || rows.length === 0) 
                throw new Error("Backup not found.")

            const first = rows[0];
            const backup = {
                id: first.id,
                name: first.name,
                backupUid: first.backupUid,
                userId: first.userId,
                isEncrypted: first.isEncrypted === 1,
                isSynced: first.isSynced === 1,
                status: first.status,
                lastSynced: first.lastSynced ? new Date(first.lastSynced) : null,
                modifiedAt: first.modifiedAt ? new Date(first.modifiedAt) : null,
                createdAt: first.createdAt ? new Date(first.createdAt) : null,
                storage: first.storage,
                archivedDate: first.archivedDate ? new Date(first.archivedDate) : null,
                files: []
            };

            for (const row of rows) {
                if (!row.fileId) continue;
                backup.files.push({
                    id: row.fileId,
                    storagePath: row.storagePath,
                    backupId: row.backupId,
                    size: row.size,
                    status: row.fileStatus,
                    type: row.fileType,
                    prefix: row.prefix,
                    destinationFolder: row.destinationFolder,
                    storage: row.fileStorage
                });
            }
            return {
                success: true,
                data: backup
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

    async deleteExpiredBackupByJob(job, remoteInstances) {
        const cutOff = (Date.now() / 1000) - (job * 86400);
        
        const count = db.prepare(`SELECT COUNT(*) FROM backups WHERE job_id = ?`).get(job.id)
        if (count <= 1)
            return;

        const stmt = db.prepare(`
            SELECT * FROM backups 
            WHERE job_id = ? AND created_at < ? AND status = 'completed'
        `);
        const backups = stmt.run(job.id, cutOff);

        // remove multiple file on s3 and remote
        for (const backup of backups) {
            try {
                db.exec("BEGIN IMMEDIATE");
                const backupFiles = await db.prepare(`SELECT * FROM backup_files WHERE backup_id = ?`).all(backup.id);
                if (backup.storage === "remote") {
                    const backupFile = backupFiles[0];
                    const remotehost = remoteInstances.get(backup.storage_conf);
                    if (!remotehost) {
                        throw new Error("No connected host for %", backup.storage_conf);
                    }
                    await remotehost.removeEntry(backupFile.storage_path, backup.is_encrypted, backupFile.destination_folder)
                }
                if (backup.storage === "s3") {
                    for (const backupFile of backupFiles) {
                        const s3Provider = new S3Provider(backup.storage_conf);
                        await s3Provider.deleteObject(backupFile.storage_path);
                    }
                }
                // delete the backup info on database
                db.prepare("DELETE FROM backups WHERE id = ?").run(backup.id)
                db.exec("COMMIT");
            } catch (error) {
                db.exec("ROLLBACK");
                console.log("Error when deleting the backup % ", backup.name)
            }
        }
    }
}

module.exports = new BackService();
