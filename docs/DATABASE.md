# Database

Backup uses **SQLite** via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3). The
database file lives inside the configured `dataDirectory` (see `config.js`) and is opened
synchronously by the daemon process.

Schema creation happens in `lib/db/db.js` through `CREATE TABLE IF NOT EXISTS` statements that run
on every boot. There is no external migration tool; see [Migrations](#migrations) below.

## Why SQLite?

- The deployment target is a single host that runs both the API and the cron worker.
- `better-sqlite3` is synchronous and fast, and gives atomic transactions out of the box.
- No extra services to operate.

The trade-off: you cannot run multiple daemons against the same database file.

## Tables

All timestamps are stored as ISO-8601 strings (`TEXT`). All booleans are `INTEGER` (`0` / `1`).

### `users`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK AUTOINCREMENT | |
| `email` | TEXT UNIQUE NOT NULL | |
| `password` | TEXT NOT NULL | `argon2` hash |
| `company_name` | TEXT | |
| `token` | TEXT | last issued access-token JTI, for logout invalidation |
| `refresh_token` | TEXT | current refresh token hash |
| `is_2fa_enabled` | INTEGER | `0` / `1` |
| `totp_secret` | TEXT | encrypted, only set when `is_2fa_enabled = 1` |
| `created_at` | TEXT | |
| `updated_at` | TEXT | |

### `sources`

Where backup data *comes from*.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `name` | TEXT UNIQUE NOT NULL | |
| `type` | TEXT NOT NULL | `"mongodb"`, `"s3"`, `"app"` |
| `config` | TEXT NOT NULL | JSON, driver-specific; secrets are sealed with `DESTINATION_KEY_SECRET` |
| `created_by` | INTEGER | → `users.id` |
| `created_at` | TEXT | |
| `updated_at` | TEXT | |

### `destinations`

Where backup data *goes*.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `name` | TEXT UNIQUE NOT NULL | |
| `type` | TEXT NOT NULL | `"s3"`, `"host"` (SFTP), `"local-storage"` |
| `config` | TEXT NOT NULL | JSON; credentials sealed with `DESTINATION_KEY_SECRET` |
| `max_disk_usage` | INTEGER | bytes; used by the retention task |
| `created_by` | INTEGER | → `users.id` |
| `created_at` | TEXT | |
| `updated_at` | TEXT | |

### `targets`

A _target_ binds a source to a backup intent.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `name` | TEXT UNIQUE NOT NULL | |
| `type` | TEXT NOT NULL | `"database"`, `"app"`, `"object-replication"` |
| `source_id` | INTEGER NOT NULL | → `sources.id` |
| `options` | TEXT | JSON, type-specific extras (e.g. database name filter) |

### `jobs`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `name` | TEXT UNIQUE NOT NULL | |
| `target_id` | INTEGER NOT NULL | → `targets.id` |
| `schedule_type` | TEXT NOT NULL | `"cron"`, `"interval"`, `"manual"` |
| `schedule_value` | TEXT | cron string, or `"1h"` / `"30m"` for interval |
| `retention_days` | INTEGER | |
| `is_enable` | INTEGER | `0` / `1` |
| `status` | TEXT | latest run status, denormalised |
| `last_run_at` | TEXT | |
| `next_run_at` | TEXT | computed at save |
| `created_by` | INTEGER | → `users.id` |
| `created_at` | TEXT | |
| `updated_at` | TEXT | |

### `job_destinations`

Many-to-many between `jobs` and `destinations`.

| Column | Type |
| --- | --- |
| `job_id` | INTEGER NOT NULL |
| `destination_id` | INTEGER NOT NULL |
| PK `(job_id, destination_id)` | |

### `job_runs`

One row per job execution.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `job_id` | INTEGER NOT NULL | → `jobs.id` |
| `status` | TEXT NOT NULL | `"running"`, `"success"`, `"failed"`, `"partial"`, `"aborted"` |
| `started_at` | TEXT | |
| `finished_at` | TEXT | |
| `duration_ms` | INTEGER | |
| `bytes_written` | INTEGER | total across destinations |
| `error_message` | TEXT | nullable |

### `backups`

One row per physical backup artifact.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `backup_uid` | TEXT UNIQUE NOT NULL | ULID, also used as object key |
| `name` | TEXT | human label, e.g. `nightly-2026-04-10` |
| `user_id` | INTEGER | → `users.id` |
| `job_id` | INTEGER | → `jobs.id`, nullable for manual backups |
| `destination_id` | INTEGER | → `destinations.id` |
| `is_encrypted` | INTEGER | `0` / `1` |
| `status` | TEXT | `"success"`, `"failed"` |
| `size_bytes` | INTEGER | |
| `checksum` | TEXT | SHA-256 of encrypted payload |
| `created_at` | TEXT | |

### `notification_providers`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `name` | TEXT UNIQUE NOT NULL | |
| `type` | TEXT NOT NULL | `"SMTP"`, `"SES"` |
| `config` | TEXT NOT NULL | JSON |
| `created_at` | TEXT | |

### `notification_events`

Seeded, read-mostly. Rows: `succeeded`, `failed`, `partial`, `started`.

| Column | Type |
| --- | --- |
| `id` | INTEGER PK |
| `event_type` | TEXT UNIQUE |
| `description` | TEXT |

### `notification_rules`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `event_type` | TEXT NOT NULL | matches `notification_events.event_type` |
| `provider_id` | INTEGER NOT NULL | → `notification_providers.id` |
| `job_id` | INTEGER | nullable; `NULL` means global |
| `recipients` | TEXT NOT NULL | JSON array |
| `is_enable` | INTEGER | `0` / `1` |

### `settings`

Key-value bag.

| Column | Type |
| --- | --- |
| `key` | TEXT PK |
| `value` | TEXT |
| `updated_at` | TEXT |

### `vault_meta`

Stores the vault verification blob so the daemon can check the user's password without storing it.

| Column | Type |
| --- | --- |
| `id` | INTEGER PK (always 1) |
| `salt` | TEXT |
| `kdf_params` | TEXT (JSON) |
| `wrapped_key` | TEXT |
| `verifier` | TEXT |

## Indexes

Created in `lib/db/db.js` alongside the tables:

- `backups(job_id)`, `backups(destination_id)`, `backups(created_at)`
- `job_runs(job_id, started_at DESC)`
- `jobs(next_run_at)` — used by the cron loop
- `notification_rules(event_type, is_enable)`

## Migrations

There is no dedicated migration framework. The schema is declared in `lib/db/db.js` using
idempotent `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` statements that run on every
daemon start.

When you need to change the schema:

1. Add or modify the `CREATE TABLE` / `CREATE INDEX` statement in `lib/db/db.js`.
2. For additive changes (new column, new table), add a guarded `ALTER TABLE … ADD COLUMN …`
   wrapped in a `try / catch` or a `PRAGMA table_info()` check so it is safe to run repeatedly.
3. For destructive changes (renames, type changes), write a one-off migration script under
   `lib/db/migrations/YYYYMMDD_description.js` that:
   - opens the DB,
   - runs `BEGIN TRANSACTION`,
   - performs `CREATE TABLE … AS SELECT …` or `ALTER TABLE RENAME`,
   - records its name in a `schema_migrations(name TEXT PK, applied_at TEXT)` table,
   - commits.
4. Invoke pending migrations from `lib/db/db.js` before the schema-ensure step.

Always take a copy of the SQLite file before running destructive migrations. The daemon must be
stopped while migrations run.

## Backing up the database itself

The SQLite file is part of your operational state. Back it up separately from your data backups —
easiest is to `sqlite3 backup.db ".backup /path/to/copy.db"` on a schedule, or stop the daemon and
copy the file. The vault key material lives only in `vault_meta` (verifier) and in memory, so the
DB file without the operator's password is insufficient to decrypt backups.
