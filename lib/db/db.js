const path = require("path");
const Database = require("better-sqlite3");
const databasePath = path.join(__dirname, "../../data", "backup.db");
const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function hasUniqueIndexOnName(tableName) {
    const indexes = db.prepare(`PRAGMA index_list('${tableName}')`).all();
    for (const index of indexes) {
        if (!index.unique) continue;
        const columns = db.prepare(`PRAGMA index_info('${index.name}')`).all();
        if (columns.length === 1 && columns[0].name === "name") {
            return true;
        }
    }
    return false;
}

function rebuildTableWithoutNameUnique(tableName, createTableSql) {
    db.exec("PRAGMA foreign_keys = OFF");
    db.exec("BEGIN");
    try {
        const tempTable = `${tableName}_new`;
        db.exec(createTableSql.replace(`CREATE TABLE IF NOT EXISTS ${tableName}`, `CREATE TABLE IF NOT EXISTS ${tempTable}`));
        db.exec(`INSERT INTO ${tempTable} SELECT * FROM ${tableName}`);
        db.exec(`DROP TABLE ${tableName}`);
        db.exec(`ALTER TABLE ${tempTable} RENAME TO ${tableName}`);
        db.exec("COMMIT");
    } catch (error) {
        db.exec("ROLLBACK");
        throw error;
    } finally {
        db.exec("PRAGMA foreign_keys = ON");
    }
}

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        password TEXT NOT NULL,
        token TEXT,
        company_name TEXT,
        expires_at INTEGER,
        is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN(0, 1)),
        created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
        two_factor_enable INTEGER DEFAULT 0,
        password_changed_at INTEGER
    )    
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS user_files (
        id INTEGER PRIMARY KEY,
        type INTEGER, -- profile
        user_id INTEGER NOT NULL,
        filename TEXT,
        metadata TEXT,

        FOREIGN KEY(user_id) REFERENCES users(id)
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

db.exec(`
    CREATE TABLE IF NOT EXISTS backup_files (
        id INTEGER PRIMARY KEY,
        
        storage_path TEXT NOT NULL,

        backup_id INTEGER NOT NULL,

        size INTEGER NOT NULL,

        status TEXT NOT NULL, -- online | archived

        type TEXT DEFAULT 'file'
            CHECK (type IN('file', 'folder')),
            
        prefix TEXT,
        
        destination_folder TEXT,

        FOREIGN KEY (backup_id) REFERENCES backups(id) ON DELETE CASCADE
    )    
`)

db.exec (`
    CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY,

        name TEXT NOT NULL,

        backup_uid TEXT NOT NULL,

        user_id INTEGER NOT NULL,
        
        is_encrypted INTEGER NOT NULL DEFAULT 1
            CHECK (is_encrypted IN(0, 1)),

        is_synced INTEGER NOT NULL DEFAULT 0
            CHECK (is_synced IN(0, 1)),
    
        status TEXT NOT NULL,  -- completed | failed | archived

        last_synced INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),

        modified_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),

        created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),

        storage TEXT,
    
        storage_conf TEXT,

        job_id INTEGER,

        archived_date INTEGER,

        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (job_id) REFERENCES jobs(id)
    )    
`)

db.exec("CREATE INDEX IF NOT EXISTS idx_backup_user ON backups(user_id)");

db.exec (`
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY,

        name TEXT NOT NULL,

        is_enable INTEGER NOT NULL DEFAULT 1,

        status TEXT NOT NULL, -- pending | running | success | failed | canceled

        target TEXT,

        target_id INTEGER,
        
        schedule_type TEXT NOT NULL, -- interval | cron | manual

        schedule_value TEXT, -- 3600 or cron job schema

        created_by INTEGER NOT NULL,

        created_at INTEGER NOT NULL,

        updated_at INTEGER NOT NULL,

        use_encryption INTEGER  DEFAULT 1,

        retention_days INTEGER,

        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (target_id) REFERENCES targets(id)
    )
`)
db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_name_global
    ON jobs(LOWER(name))
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS job_schedule_state (
        job_id INTEGER PRIMARY KEY,
        next_run_at INTEGER NOT NULL,
        last_run_at INTEGER,

        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )    
`)
db.exec(`
    CREATE TABLE IF NOT EXISTS job_runs (
        id            INTEGER PRIMARY KEY,
        job_id        INTEGER NOT NULL,

        status        TEXT NOT NULL,    -- 'pending' | 'running' | 'success' | 'failed' | 'canceled'
        started_at    INTEGER,
        finished_at   INTEGER,

        error_code    TEXT, 
        error_message TEXT,

        created_at    INTEGER NOT NULL,

        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );    
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS target_destinations (
        target_id INTEGER NOT NULL,
        destination_id INTEGER NOT NULL,
        created_by INTEGER,

        PRIMARY KEY (target_id, destination_id),
        FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE CASCADE,
        FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,

        FOREIGN KEY (created_by) REFERENCES users(id)
    )
`)

const sourcesTableSql = `
    CREATE TABLE IF NOT EXISTS sources (
        id  INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- mongodb | s3
        status TEXT, -- connected | desconnected | failed
        config TEXT,    -- JSON information
        created_by INTEGER,
        created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),

        FOREIGN KEY (created_by) REFERENCES users(id)
    )
`;
db.exec(sourcesTableSql);
if (hasUniqueIndexOnName("sources")) {
    rebuildTableWithoutNameUnique("sources", sourcesTableSql);
}
db.exec(`
    DROP INDEX IF EXISTS idx_sources_name_by_user
`)
db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sources_name_global
    ON sources(LOWER(name))
`)

const destinationsTableSql = `
    CREATE TABLE IF NOT EXISTS destinations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,  -- s3 | host | local-storage
        status TEXT, -- connected | disconnected | failed
        config TEXT,    -- JSON 
        created_by INTEGER,
        created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),

        FOREIGN KEY (created_by) REFERENCES users(id)
    )
`;
db.exec(destinationsTableSql);
if (hasUniqueIndexOnName("destinations")) {
    rebuildTableWithoutNameUnique("destinations", destinationsTableSql);
}
db.exec(`
    DROP INDEX IF EXISTS idx_destinations_name_by_user
`)
db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_destinations_name_global
    ON destinations(LOWER(name))
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS targets(
        id INTEGER PRIMARY KEY,
        type TEXT NOT NULL, -- app | database | object-replication
        source_id INTEGER,
        created_by INTEGER,

        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
    )
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS notification_providers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK(type IN ('smtp', 'ses')),
        config TEXT NOT NULL,
        is_enable INTEGER NOT NULL DEFAULT 1,
        status TEXT, -- connected | disconnected
        created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
        created_by INTEGER,

        FOREIGN KEY (created_by) REFERENCES users(id)
    )    
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
        created_by INTEGER,
        type TEXT DEFAULT 'app',

        FOREIGN KEY (created_by) REFERENCES users(id)
    )    
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS notification_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,  -- succeeded | failed
        job_id INTEGER,
        backup_id INTEGER,
        message TEXT,
        category TEXT, -- backup | destination_storage
        payload TEXT,
        created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )    
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS notification_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        event_type TEXT NOT NULL,
        provider_id INTEGER,
        is_enable INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),

        FOREIGN KEY (provider_id) REFERENCES notification_providers(id) ON DELETE CASCADE
    )    
`)

// const adminTest = {
//     email: "admin@mail.com",
//     full_name: "Admin",
//     password: "admin123",
//     created_at: Date.now() / 1000
// }

// const bootstrap = db.transaction(() => {
//     console.log("launch database seed.")
//     db.exec(`
//         INSERT OR IGNORE INTO roles (name) VALUES
//         ('owner'),
//         ('admin'),
//         ('operator'),
//         ('read_only');
//     `);
//     const insertAdmin = db.prepare(`
//         INSERT INTO users (email, full_name, password, created_at)
//         SELECT ?, ?, ?, ?
//         WHERE NOT EXISTS (
//             SELECT 1 FROM users WHERE email = ?
//         );
//     `);
//     const adminValues = Object.values(adminTest);
//     insertAdmin.run(...adminValues, adminTest.email);
// });

// bootstrap();

module.exports = db;
