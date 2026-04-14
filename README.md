# Backup

A self-hosted, end-to-end encrypted backup orchestrator for databases and application files.
Runs scheduled backups from configurable sources (MongoDB, app directories, S3 object replication)
to one or more destinations (S3 / Wasabi, SFTP / SSH hosts, local storage), with retention policies,
in-memory decryption on restore, and a Next.js admin dashboard for managing everything.

## Features

- Multiple sources: MongoDB dumps, arbitrary application directories, S3-to-S3 object replication
- Multiple destinations: S3 / Wasabi, SFTP / SSH, local filesystem
- Encrypted-at-rest backups with a user-controlled vault (AES via `jose`)
- Scheduling via cron expressions or simple intervals, plus manual runs
- Retention policies and disk-quota enforcement
- REST API (Express) and web admin UI (Next.js 16 + React 19 + Tailwind)
- CLI (`backupdb`) for scripting, restore, export, download, and daemon control
- Email notifications on job success / failure (SMTP or AWS SES)

## Documentation

Full documentation lives in [`docs/README.md`](./docs/README.md).

- [Introduction & Getting Started](./docs/README.md)
- [Architecture & Tech Stack](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Frontend Guide](./docs/FRONTEND.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Contributing](./docs/CONTRIBUTING.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## Quick start

```bash
git clone https://github.com/feno-tolojanahary/backup.git
cd backup
npm install
cp .env.example .env            # fill in WS3_* credentials
node index.js configure         # set the vault password
node index.js start             # start the daemon (API on :3030)

cd admin-ui && npm install && npm run dev   # UI on :3000
```

See [`docs/README.md`](./docs/README.md) for the full walkthrough.

## License

ISC. See [LICENSE](./LICENSE) if present, or the `license` field in `package.json`.
