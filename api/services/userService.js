const db = require("../../lib/db/db");  
const fs = require("fs/promises");

class UserService {
    constructor() {}

    stmt = {
        userCount: db.prepare("SELECT COUNT(*) AS total FROM users")
    }

    async getUserProfile(filters) {
        const params = [];
        let query = `
                    SELECT 
                        u.id AS id,
                        u.email AS email,
                        u.full_name AS fullName,
                        u.token AS token,
                        u.company_name AS companyName,
                        u.expires_at AS exipresAt,
                        u.created_at AS createdAt,
                        u.two_factor_enable AS twoFactorEnable,
                        u.password_changed_at AS passwordChangedAt,
                        (
                            SELECT 
                                ufs.filename AS avatarUrl 
                            FROM user_files ufs WHERE type = 'profile' AND user_id = u.id
                        ) AS file
                    FROM users u 
            
                    WHERE 1=1`
        if (filters.id) {
            query += ` AND u.id = ?`;
            params.push(filters.id);
        }
        if (filters.token) {
            query += ` AND u.token = ?`;
            params.push(filters.token)
        }
        const stmt = db.prepare(query);
        const userData = stmt.get(...params);
        if (userData?.file?.avatarUrl)
            userData.avatar = userData.file.avatarUrl;
        return userData;
    }

    async insert(userData) {
        try {
            const {
                email,
                fullName,
                token,
                companyName,
                expiresAt,
                password
            } = userData;
            console.log(userData)
            const res = db.prepare(`INSERT INTO users 
                    (email, full_name, password, token, company_name, expires_at, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`)
                    .run(email, fullName, password, token, companyName, expiresAt, 1)
            if (res.changes === 0) 
                throw new Error("Error insert users, changes is 0");
            return {
                ok: true,
                changes: res.changes
            }
        } catch (error) {
            return {
                ok: false,
                message: error.message
            }
        }
    }

    async upsertUserFile(userFile) {
        const {
            type = "profile",
            filename,
            userId,
            metadata
        } = userFile;
        const existingFile = db.prepare(`SELECT * FROM user_files WHERE user_id = ?`).get(userId);
        const res = db.prepare(`INSERT INTO user_files (type, filename, user_id, metadata) VALUES (?, ?, ?, ?)`)
                            .run(type, filename, userId, JSON.stringify(metadata))
        // remove old file
        if (res.changes > 0 && existingFile) {
            const existMetadata = JSON.parse(existMetadata.metadata);
            db.prepare(`DELETE FROM user_files WHERE id = ?`).run(existingFile.id);
            await fs.unlink(existMetadata.metadata.path)
        }
        return res;
    }

    async updateById(id, update) {
        const fieldMapName = {
            "fullName": "full_name",
            "companyName": "company_name",
            "expiresAt": "expires_at",
            "isActive": "is_active",
            "createdAt": "created_at",
            "twoFactorEnable": "two_factor_enable",
            "lastPasswordChangedAt": "last_password_changed_at"
        }
        const setUpdate = Object.keys(update).map(key => fieldMapName[key] ? `${fieldMapName[key]} = ?` : `${key} = ?`);
        const values = Object.values(update).map(value => value);
        const res = db.prepare(`UPDATE users SET ${setUpdate.join(', ')} WHERE id = ?`).run(...values, id);
        return res;
    }
}

module.exports = new UserService();