class UserService {
    constructor() {}

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

    async updateById(id, update) {
        const fieldMapName = {
            "fullName": "full_name",
            "companyName": "company_name",
            "expiresAt": "expires_at",
            "isActive": "is_active",
            "createdAt": "created_at",
            "twoFactorEnabled": "two_factor_enabled",
            "lastPasswordChangedAt": "last_password_changed_at"
        }
        const setUpdate = Object.keys(update).map(key => fieldMapName[key] ? `${fieldMapName[key]} = ?` : `${key} = ?`);
        const values = Object.values(update).map(value => value);
        const res = db.prepare(`UPDATE users SET ${setUpdate.join(', ')} WHERE id = ?`).run(...values, id);
        return res;
    }
}

module.exports = new UserService();