# Deployment

Backup is designed to run as a single long-lived daemon plus a Next.js UI on one host. Typical
deployments are a small VM, a home-lab box, or a container host.

## Prerequisites

- Node.js 20 or 22 LTS
- `mongodump` / `mongorestore` on `PATH` if you back up MongoDB (from the
  `mongodb-database-tools` package)
- Write access to the `dataDirectory` configured in `config.js`
- Outbound network access to every destination (S3 endpoint, SFTP host, SMTP server)

## Environment variables

Defined in `.env` at the project root.

| Variable | Required | Purpose |
| --- | --- | --- |
| `WS3_ACCESS_KEY` | if using the default S3 destination | S3 / Wasabi access key |
| `WS3_SECRET_KEY` | same | S3 / Wasabi secret key |
| `WS3_BUCKET_NAME` | same | Default bucket for backups |
| `WS3_REGION` | same | S3 region |
| `WS3_ENDPOINT` | same | S3 endpoint URL (e.g. `https://s3.wasabisys.com`) |
| `DESTINATION_KEY_SECRET` | **yes** | Secret that seals destination credentials at rest — keep it stable across restarts; losing it means re-entering every destination |
| `PORT` | no (default `3030`) | API port |

For the UI (`admin-ui/.env.local`):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Absolute URL to the API as reachable from the browser |
| `NEXT_PUBLIC_APP_NAME` | Display name in the header |

## Production deployment (bare host)

```bash
# 1. Clone and install
git clone https://github.com/feno-tolojanahary/backup.git /opt/backup
cd /opt/backup
npm ci --omit=dev
cd admin-ui && npm ci && npm run build && cd ..

# 2. Create .env with all required variables above

# 3. Create the vault (interactive, once)
node index.js configure

# 4. Run the daemon under a process supervisor
#    (systemd example below)
```

### systemd unit

`/etc/systemd/system/backup.service`:

```ini
[Unit]
Description=Backup daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=backup
WorkingDirectory=/opt/backup
EnvironmentFile=/opt/backup/.env
ExecStart=/usr/bin/node /opt/backup/server/daemon.js
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/backup/daemon.log
StandardError=append:/var/log/backup/daemon.log

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/backup-ui.service`:

```ini
[Unit]
Description=Backup admin UI
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=backup
WorkingDirectory=/opt/backup/admin-ui
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node /opt/backup/admin-ui/node_modules/next/dist/bin/next start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backup backup-ui
sudo systemctl status backup
```

> Note: the daemon runs `server/daemon.js` directly here, not through `backupdb start`, because
> `start` spawns a detached child that systemd would not supervise.

### Reverse proxy

Put the UI and API behind nginx / Caddy / Traefik. Example Caddyfile:

```caddyfile
backup.example.com {
    encode zstd gzip
    handle /api/* {
        uri strip_prefix /api
        reverse_proxy 127.0.0.1:3030
    }
    handle {
        reverse_proxy 127.0.0.1:3000
    }
}
```

Then set `NEXT_PUBLIC_API_URL=https://backup.example.com/api` and update CORS on the API side to
allow `https://backup.example.com`.

## Docker

The bundled `docker-compose.yaml` at the repo root only runs **S3Mock** for local development:

```yaml
services:
  s3mock:
    image: adobe/s3mock:latest
    ports:
      - "9090:9090"
    environment:
      initialBuckets: "mybucket,testbucket"
    volumes:
      - ./s3mock-data:/data
```

Start it with `docker compose up -d`. Point a `destination` at `http://localhost:9090` with any
access / secret key to exercise the S3 path without real cloud credentials.

### Packaging the app in Docker

A production-ready image is not yet published. To build your own, a workable two-stage Dockerfile:

```dockerfile
# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN cd admin-ui && npm ci && npm run build

FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    mongodb-database-tools && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app /app
ENV NODE_ENV=production
EXPOSE 3030 3000
CMD ["node", "server/daemon.js"]
```

Mount a volume at the `dataDirectory` configured in `config.js`, and pass the `.env` via
`--env-file`. The UI is best served by running a second container with
`CMD ["npm","--prefix","admin-ui","run","start"]`.

## CI / CD

There is no hosted CI configured in-repo today. A minimal GitHub Actions workflow that matches how
contributors are expected to run checks:

`.github/workflows/ci.yml`

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:

jobs:
  api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: node -e "require('./config')"         # smoke-load config
      - run: node -e "require('./lib/db/db')"      # smoke-open DB schema

  ui:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: admin-ui } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: admin-ui/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

Add tests as they are written (`npm test` currently only reports "no test specified") and expand
the matrix across Node 20 / 22.

## Upgrades

1. Stop the daemon: `sudo systemctl stop backup`.
2. Back up the SQLite file (`cp /opt/backup/data/backup.db /opt/backup/data/backup.db.bak`).
3. `git pull && npm ci --omit=dev && (cd admin-ui && npm ci && npm run build)`.
4. Read the release notes for migration steps.
5. Start the daemon again.

## Security notes

- Run the daemon as a dedicated unprivileged user.
- Keep `DESTINATION_KEY_SECRET` out of version control; rotate with care — rotation requires
  re-saving every destination so its credentials get re-sealed with the new key.
- The vault password is never persisted. If you lose it, encrypted backups cannot be restored.
- Put the UI and API behind HTTPS in any deployment that is reachable over the network.
