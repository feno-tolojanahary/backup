# Backup — Documentation

Welcome. Backup is a self-hosted orchestrator that runs scheduled, encrypted backups from databases
and application files to S3-compatible object stores, SFTP hosts, or local disk — and restores them
safely in-memory so decrypted data never has to touch disk.

This directory is the full documentation set. Start here, then jump to the topic you need.

## Table of contents

| Document | What it covers |
| --- | --- |
| [README.md](./README.md) | Introduction, install, first run (this file) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Components, data flow, tech stack, design decisions |
| [API.md](./API.md) | Every REST endpoint, request / response shapes, auth |
| [FRONTEND.md](./FRONTEND.md) | Admin UI layout, pages, auth flow, state |
| [DATABASE.md](./DATABASE.md) | SQLite schema, tables, columns, migrations |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment, Docker, CI/CD, env vars |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Dev setup, code style, branching, PR process |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | FAQ and common issues |

## What is Backup?

Backup is composed of three cooperating parts:

- **`lib/`** — the core library. Source adapters (MongoDB, app files, S3 replication), destination
  adapters (S3, SFTP, local), the job runner, cron scheduler, retention cleaner, and the encryption
  vault.
- **`api/`** — an Express REST API that exposes CRUD + action endpoints for jobs, sources,
  destinations, backups, notifications, users, and settings.
- **`admin-ui/`** — a Next.js 16 dashboard for humans to configure and monitor everything.

A root `index.js` exposes a `backupdb` CLI (via Commander) that wraps the same library functions for
scripting and scheduled-host use. `server/daemon.js` is the long-running worker: it boots the API
and the cron scheduler, which runs jobs in the background.

## Prerequisites

- Node.js ≥ 20 (tested with 20 and 22)
- npm ≥ 10
- `mongodump` / `mongorestore` on `PATH` if you back up MongoDB
- For SFTP destinations: reachable SSH host with the configured key
- For S3 destinations: credentials (AWS, Wasabi, or any S3-compatible provider)
- Optional: Docker + Docker Compose if you want the bundled S3Mock for local dev

## Installation

```bash
git clone https://github.com/feno-tolojanahary/backup.git
cd backup
npm install
cd admin-ui && npm install && cd ..
```

## Configure

### 1. Environment variables

Create a `.env` at the project root:

```ini
WS3_ACCESS_KEY=...           # S3 / Wasabi access key
WS3_SECRET_KEY=...           # S3 / Wasabi secret key
WS3_BUCKET_NAME=my-backups
WS3_REGION=us-east-1
WS3_ENDPOINT=https://s3.wasabisys.com
DESTINATION_KEY_SECRET=...   # secret used to seal destination credentials at rest
PORT=3030                    # optional; API port
```

The CLI's `configure` step will create a stub `.env` on first run if one does not exist.

### 2. Vault password

Backups are encrypted with a key derived from a vault password you set once:

```bash
node index.js configure
```

You will be prompted for the password. It is never written to disk — only a verification blob is
persisted. The vault must be **unlocked** for operations that touch plaintext (restore, export):

```bash
node index.js unlock     # prompts for the password; unlocks for this process
node index.js lock       # clears keys from memory
```

### 3. `config.js`

`config.js` at the project root defines working directories, retention, SMTP / SES defaults, and the
default cron schedule. Adjust if the defaults do not match your setup. Most users configure sources
and destinations through the UI or API instead of editing this file.

## First run

### Start the daemon + API

```bash
node index.js start     # spawns server/daemon.js as a detached process
node index.js status    # shows whether the daemon is running
node index.js stop
```

The API listens on `http://127.0.0.1:3030` by default.

### Start the admin UI

```bash
cd admin-ui
npm run dev             # http://localhost:3000
```

The UI expects the API at `http://127.0.0.1:3030`; override with `NEXT_PUBLIC_API_URL` in
`admin-ui/.env.local` if you change the port.

### Create your first backup

From the UI:

1. **Infrastructure → Sources** → add a MongoDB source (URI + optional auth).
2. **Infrastructure → Destinations** → add an S3 or SFTP destination.
3. **Jobs → New** → pick the source as target, the destination, a schedule (cron or interval), save.
4. Click **Run now**. Watch it in **Jobs → history**, and the resulting backup in **Backups**.

Or from the CLI:

```bash
node index.js job create --name nightly --target mydb --cron "0 2 * * *"
node index.js job run <job-id>
node index.js list
```

### Restore

```bash
node index.js unlock
node index.js restore <backup-id> --target mydb --to-db restored_copy
```

Restore decrypts in memory and streams into `mongorestore`; no plaintext is written to disk.

## Where to next

- Understand the moving parts: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Script against the API: [API.md](./API.md)
- Deploy to a server: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Something broke: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
