const Database = require("better-sqlite3");
const db = new Database("backup-db");
db.pragma("journal_mode = WAL")

db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE,
        full_name TEXT,
        password TEXT,
        is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN(0, 1)),
        created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )    
`)


db.run(`
    CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY,
        createdBy INTEGER NOT NULL,
        backup_uuid TEXT NOT NULL UNIQUE,
        key_version DEFAULT 1,
        size INTEGER NOT NULL,
        encrypted_size INTEGER NOT NULL,
        is_encrypted INTGER NOT NULL
            CHECK (is_encrypted IN (0, 1)),
        created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
        FOREIGN KEY(user_id) REFERENCES users(id)
    )    
`)


db.run(`
    CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
    )    
`)


db.run(`
    CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT
    )    
`)


db.run(`
    CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER NOT NULL,
        permission INTEGER NOT NULL,

        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (permission_id) REFERENCES permissions(id)
    )    
`)


db.run(`
    CREATE TABLE IF NOT EXSITS user_roles (
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,

        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (role_id) REFERENCES roles(id)
    )    
`)

db.run(`
    CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY,
        backup_uuid TEXT NOT NULL UNIQUE,
        
        name TEXT NOT NULL,

        user_id INTEGER NOT NULL,

        is_encrypted INTEGER NOT NULL DEFAULT 1
            CHECK (is_encrypted IN(0, 1)),

        total_size INTEGER NOT NULL,

        status TEXT NOT NULL,

        modified_at INTEGER NOT NULL,

        created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))

        storage TEXT,

        is_archived INTEGER NOT NULL DEFAULT 1
            CHECK (is_archived IN(0, 1)),
    )    
`)

const adminTest = {
    // user_uuid: "02fc47dc-939c-44ce-8899-429f5980ae13",
    email: "admin@mail.com",
    full_name: "Admin",
    password: "admin123",
    created_at: new Date()
}

const bootstrap = db.transaction(() => {
    console.log("launch database seed.")
    db.exec(`
        INSERT OR IGNORE INTO roles (name) VALUES
        ('owner'),
        ('admin'),
        ('operator'),
        ('read_only');
    `);
    const insertAdmin = db.prepare(`
        INSERT INTO users (email, full_name, password, created_at)
        SELECT ?, ?, ?, ?
        WHERE NOT EXISTS (
            SELECT 1 FROM users WHERE email = ?
        );
    `);

    insertAdmin.run(...adminTest, adminTest.email);
});

bootstrap();

module.exports = db;