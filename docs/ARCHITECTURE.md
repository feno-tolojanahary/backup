# Architecture

Backup has three runtime components that share one code tree:

```
┌─────────────┐      HTTP       ┌─────────────┐     function calls     ┌─────────────┐
│  admin-ui   │ ──────────────▶ │     api     │ ─────────────────────▶ │     lib     │
│ (Next.js)   │ ◀────────────── │  (Express)  │ ◀───────────────────── │  (core)     │
└─────────────┘                 └─────────────┘                        └─────────────┘
                                      │                                       ▲
                                      │ reads / writes                        │ run / schedule
                                      ▼                                       │
                                ┌─────────────┐                        ┌─────────────┐
                                │   SQLite    │                        │   daemon    │
                                │ better-sqlite3 │ ◀──────────────────│ + node-cron │
                                └─────────────┘                        └─────────────┘
                                                                              │
                                                                              ▼
                                                       ┌────────────────────────────────────┐
                                                       │ sources: mongodb, app files, s3    │
                                                       │ destinations: s3, sftp, local disk │
                                                       └────────────────────────────────────┘
```

## Components

### `lib/` — core library

Pure Node, no web server. Contains everything needed to run a backup or a restore, and is callable
from both the API handlers and the CLI.

- `lib/sources/` — source adapters
  - `mongodb/` — `mongodbManager.js` (dump / restore via `mongodump` / `mongorestore`),
    `mongodbHandler.js` (encrypted + plain restore)
  - `app/AppDataManager.js` — back up arbitrary directories with `archiver`
  - S3-to-S3 object replication lives alongside (see `handlers/`)
- `lib/storages/` — destination adapters
  - `s3/` — AWS SDK v3, supports Wasabi and any S3-compatible endpoint
  - `remote/` — SFTP via `ssh2-sftp-client`
  - `localStorage/` — filesystem, with disk quota enforcement
- `lib/handlers/jobs.js` — the job runner. Given a `jobId`, reads the job record, resolves the
  target, picks the right source and destination adapter, streams data through encryption, records a
  `job_runs` row, and emits notification events.
- `lib/encryption/` — `cryptoTools.js` (AES via `jose`) and `vaultSession.js` (in-memory key vault).
  The vault is unlocked per-process; keys never touch disk.
- `lib/actions/` — CLI action implementations (`action.js`, `jobAction.js`, `targetAction.js`)
- `lib/db/db.js` — `better-sqlite3` connection plus all `CREATE TABLE IF NOT EXISTS` statements
  (see [DATABASE.md](./DATABASE.md))

### `api/` — Express REST API

- `api/index.js` — creates the Express app, configures CORS (`http://localhost:3000` allowed by
  default), parses JSON + cookies, mounts routes.
- `api/routes/` — one file per resource: `auth`, `backups`, `jobs`, `sources`, `destinations`,
  `notification-providers`, `notification-events`, `notification-rules`, `settings`, `stats`, `users`.
- `api/controllers/` — thin handlers that call into `lib/`.
- `api/middlewares/auth.js` — JWT bearer verification via `jose`. Populates `req.userId`.

The API is not a self-contained server — it is started by `server/daemon.js` alongside the cron
scheduler so that UI-initiated actions and scheduled actions share the same process and SQLite
connection.

### `admin-ui/` — Next.js dashboard

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4
- Redux Toolkit (+ `redux-persist`) for auth and UI state
- `axios` for API calls, `SWR` for polled data (job runs, backup lists)
- React Hook Form + Zod for forms, ApexCharts for graphs, FullCalendar for the schedule view
- Pages under `src/app/(admin)/…`: dashboard, backups, jobs, infrastructure (sources +
  destinations), notifications, settings, profile
- Auth pages under `src/app/(full-width-pages)/(auth)/…`

See [FRONTEND.md](./FRONTEND.md) for the full layout.

### Root — CLI + daemon

- `index.js` — Commander-based CLI, binary name `backupdb`. Top-level commands:
  - `configure`, `unlock`, `lock` — vault management
  - `start`, `stop`, `status` — daemon lifecycle
  - `list`, `restore`, `download`, `export`, `delete`, `reset`, `logs` — backup operations
  - `job <sub>` — `list | enable | disable | create | run | history`
  - `target <sub>` — `test-config`
- `server/daemon.js` — long-running process spawned by `backupdb start`. Boots the Express API and
  the cron scheduler (`server/cronJob.js`), which runs jobs on schedule and the retention task
  hourly.
- `server/daemonHandler.js` — spawns / signals / queries the daemon PID.

## Data flow: a scheduled backup

1. `server/cronJob.js` fires on the scheduled tick.
2. It queries `jobs` for enabled jobs whose schedule matches, and calls `runJob(jobId)` from
   `lib/handlers/jobs.js`.
3. `runJob` creates a `job_runs` row with status `running`, resolves the target's source, and
   streams a dump (e.g. `mongodump`) into an encryption pipe derived from the unlocked vault key.
4. The encrypted stream is uploaded to each configured destination via the matching storage adapter.
5. A `backups` row is inserted (with `backup_uid`, `is_encrypted`, `destination_id`, `job_id`).
6. The `job_runs` row is updated to `success` or `failed` with an error message.
7. Notification rules matching the event type (`succeeded` / `failed`) fire via the configured
   provider (SMTP or SES).
8. A separate hourly retention task deletes backups older than the job's `retention_days` and prunes
   destinations that exceed `maxDiskUsage`.

## Data flow: a restore

1. User runs `backupdb unlock` or provides the vault password in the UI; keys enter the in-memory
   vault.
2. `backupdb restore <id>` (or the API `POST /backups/restore/:id`) fetches the backup record,
   opens a stream from the destination, decrypts in memory, and pipes into `mongorestore` with
   `--nsInclude` / `--nsFrom` rewrites for the target database name.
3. Nothing decrypted is written to disk.

## Tech stack

**Backend / core**

| Concern | Library |
| --- | --- |
| Web framework | `express` 5 |
| Database | `better-sqlite3` (synchronous SQLite) |
| Auth | `jose` (JWT), `argon2` (password hashing) |
| CLI | `commander`, `enquirer` |
| Scheduling | `node-cron`, `cron-parser` |
| MongoDB | `mongodb` driver + `mongodump` / `mongorestore` shell tools |
| S3 | `@aws-sdk/client-s3`, `@aws-sdk/lib-storage` (multipart upload) |
| SFTP | `ssh2-sftp-client`, `node-ssh` |
| Email | `nodemailer` (SMTP), `@aws-sdk/client-ses` |
| Archive | `archiver`, `adm-zip` |
| Process mgmt | detached `child_process.spawn` |

**Frontend**

| Concern | Library |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS v4 |
| State | Redux Toolkit, redux-persist |
| HTTP | axios, SWR |
| Forms | React Hook Form, Zod |
| Charts / time | ApexCharts, FullCalendar, moment-timezone |
| Password UX | `zxcvbn` (strength), react-select |

## Design decisions

- **SQLite over a managed DB.** The target deployment is a single host. SQLite via
  `better-sqlite3` is synchronous, fast, and removes a whole operational surface. The cost is that
  the API and the cron worker must run in the same process; that is deliberate.
- **Vault password in memory only.** A user-supplied password feeds a KDF → AES key that lives in
  `vaultSession.js` for the life of the process. Encrypted backups can be produced without
  unlocking, because only the symmetric key's wrapped form is persisted; restore / export require
  an explicit `unlock` step. This keeps an attacker with disk access from reading backups.
- **Streaming encryption.** Data is encrypted on its way out and decrypted on its way in, so large
  databases never need to fit in memory or on local disk.
- **Two control surfaces, one code path.** Both the CLI and the API import from `lib/actions/` so
  they cannot drift. The daemon is the shared owner of the scheduler and the SQLite file.
- **Next.js App Router for the UI.** Chosen for route grouping (`(admin)`, `(auth)`), middleware
  support, and a modern React 19 / Tailwind v4 toolchain.

## What's intentionally _not_ in scope

- Multi-node coordination. Running two daemons against the same SQLite file is unsupported.
- Built-in secrets management beyond the vault. Destination credentials are sealed with
  `DESTINATION_KEY_SECRET` but the operator is responsible for protecting that value.
- A hosted mode. This is self-hosted software; authentication is single-tenant.
