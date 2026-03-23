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
}

module.exports = new UserService();