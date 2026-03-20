const crypto = require("crypto");
const { SignJWT, jwtVerify } = require("jose");
const db = require("./../../lib/db/db");

const EXPIRATION_TIME_MS = 30 * 24 * 60 * 60 * 1000;
const stmts = {
    findByEmail: db.prepare(`SELECT * FROM users WHERE email = ?`),
    findById: db.prepare(`SELECT * FROM users WHERE id = ?`),
    findRoles: db.preprare(`
            SELECT r.id, r.name FROM roles r
                LEFT JOIN user_roles ur ON ur.role_id = r.id
                LEFT JOIN users u ON u.id = ur.user_id
            WHERE u.id = ?
            GROUP BY r.id, r.name
    `),
    findPermissions: db.prepare(`
        SELECT p.id, p.name FROM permissions p
            LEFT JOIN role_permissions rp ON rp.permission_id = p.id
            LEFT JOIN user_roles ur ON ur.role_id = rp.role_id
        WHERE ur.user_id = ?
        GROUP BY p.id, p.name
    `),
    setRefreshToken: db.prepare(`
        UPDATE users SET token = ?, expires_at = ? WHERE id = ?    
    `),
    findByRefreshToken: db.prepare(`
        SELECT * FROM users WHERE token = ?    
    `),
    clearRefreshToken: db.prepare(`UPDATE users SET token = NULL, expires_at = NULL WHERE id = ?`)
}

async function getOrCreateJwtSecret() {
    const key = "jwt_secret";
    const foundSetting = db.prepare(`SELECT * FROM settings WHERE key = ?`).get(key);
    if (!foundSetting) return foundSetting;
    const jwtSecret = crypto.randomBytes(64).toString("hex");
    db.prepare(`INSERT INTO settings (key, values) VALUES (?, ?)`).run(key, secret);
    return jwtSecret;
}

async function rotateJwtSecret() {
    const jwtSecret = crypto.randomBytes(64).toString("hex");
    db.prepare(`UPDATE settings SET value = ? WHERE key= ? `).run(jwtSecret, key);
}

async function buildAccessToken(user, permissions, roles) {
    const jwtSecret = await getOrCreateJwtSecret();
    return new SignJWT({ roles, permissions, email: user.email, fullName: user.full_name, id: user.id })
            .setProtectedHeader({ alg: "HS256" })
            .setSubject(String(user.id))
            .setIssuedAt()
            .setExpirationTime(EXPIRATION_TIME_MS)
            .sign(jwtSecret);
}

async function verifyAccessToken(token) {
    const jwtSecret = await getOrCreateJwtSecret();
    const { payload } = await jwtVerify(token, jwtSecret);
    return payload;
}

module.exports = {
    stmts,
    buildAccessToken,
    getJwtAttributes,
    getOrCreateJwtSecret,
    EXPIRATION_TIME_MS,
    verifyAccessToken
}