const path = require("path");
const Database = require("better-sqlite3");
const databasePath = path.join(__dirname, "../../data", "backup.db");
const db = new Database(databasePath);

db.pragma("journal_mode = WAL")

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE,
        full_name TEXT,
        password TEXT,
        is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN(0, 1)),
        created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )    
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT
    )    
`)


db.exec(`
    CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT
    )    
`)


db.exec(`
    CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,

        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (permission_id) REFERENCES permissions(id)
    )    
`)


db.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,

        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (role_id) REFERENCES roles(id)
    )    
`)

db.exec (`
    CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY,
        backup_id TEXT NOT NULL UNIQUE,
                
        storage_path TEXT NOT NULL,

        user_id INTEGER NOT NULL,
        
        is_encrypted INTEGER NOT NULL DEFAULT 1
            CHECK (is_encrypted IN(0, 1)),

        is_synced INTEGER NOT NULL DEFAULT 0
            CHECK (is_synced IN(0, 1)),

        type TEXT DEFAULT "file"
            CHECK (type IN("file", "folder")),
    
        total_size INTEGER NOT NULL,

        status TEXT NOT NULL,

        last_synced INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),

        modified_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),

        created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),

        storage TEXT,

        archived_date INTEGER
    )    
`)

const adminTest = {
    email: "admin@mail.com",
    full_name: "Admin",
    password: "admin123",
    created_at: Date.now()
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
    const adminValues = Object.values(adminTest);
    insertAdmin.run(...adminValues, adminTest.email);
});

bootstrap();

module.exports = db;