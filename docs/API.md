# API reference

All endpoints are served by the Express app in `api/index.js`, mounted at the root of the API
origin (default `http://127.0.0.1:3030`). Every route except those under `/auth` requires a Bearer
token.

## Conventions

- **Base URL**: `http://<host>:<PORT>` (default port `3030`, configurable via `PORT`).
- **Content type**: `application/json` for both requests and responses unless noted.
- **Authentication**: `Authorization: Bearer <jwt>` header. Tokens are issued by `POST /auth/login`
  and verified with `jose` (HS256). On expiry the API returns `401` with body
  `{ "code": "TOKEN_EXPIRED" }`; the client should call `POST /auth/refresh`.
- **IDs**: integer primary keys for users / jobs / sources / destinations; ULID string
  `backup_uid` for backups.
- **Errors**: JSON `{ "error": "<message>" }` with standard HTTP status codes.

## Auth — `/auth`

### `POST /auth/login`

Authenticate with email + password, receive a JWT.

Request:
```json
{ "email": "user@example.com", "password": "..." }
```

Response `200`:
```json
{
  "token": "<jwt>",
  "refreshToken": "<jwt>",
  "user": { "id": 1, "email": "user@example.com", "companyName": "…" }
}
```

Errors: `401` invalid credentials.

### `POST /auth/refresh`

Exchange a refresh token for a new access token.

Request: `{ "refreshToken": "<jwt>" }` — body or `refreshToken` cookie.
Response: `{ "token": "<jwt>" }`.

### `POST /auth/logout`

Invalidate the current token server-side. Request body empty. Response `204`.

## Backups — `/backups`

### `GET /backups`

List backups for the authenticated user.

Query params: `?jobId=<id>&destinationId=<id>&status=success|failed&limit=50&offset=0`.

Response `200`:
```json
[
  {
    "id": 12,
    "backup_uid": "01HXYZ...",
    "name": "nightly-2026-04-10",
    "job_id": 3,
    "destination_id": 2,
    "is_encrypted": 1,
    "status": "success",
    "size_bytes": 458721034,
    "created_at": "2026-04-10T02:00:14.000Z"
  }
]
```

### `DELETE /backups/:id`

Delete a backup record and its underlying object from every destination it was written to.

Response `204` on success.

### `POST /backups/restore/:id`

Start an in-memory restore of the given backup. Requires the vault to be unlocked in the daemon.

Request:
```json
{ "restoreName": "restored_copy" }
```

`restoreName` is the target database name for MongoDB restores; pass the literal string
`"default"` to restore over the original database name.

Response `202`:
```json
{ "jobRunId": 87, "status": "running" }
```

Errors: `423 Locked` if the vault is not unlocked, `404` if the backup is missing.

## Jobs — `/jobs`

### `POST /jobs`

Create a backup job. Names must be unique (enforced by middleware).

Request:
```json
{
  "name": "nightly-mongo",
  "target_id": 4,
  "destination_ids": [2, 5],
  "schedule_type": "cron",
  "schedule_value": "0 2 * * *",
  "retention_days": 30,
  "is_enable": 1
}
```

`schedule_type` is `"cron"`, `"interval"` (value like `"1h"`, `"30m"`), or `"manual"`.

Response `201`: the created job record.

### `GET /jobs`

List all jobs. Response: array of job records.

### `GET /jobs/:id`

Fetch a single job with its target, destinations, and last run summary.

### `PUT /jobs/:id`

Update any mutable field. Request body matches `POST /jobs`. Response: the updated record.

### `DELETE /jobs/:id`

Delete the job. Historic `job_runs` and `backups` remain.

### `POST /jobs/:id`

Trigger the job immediately. Response `202` with `{ "jobRunId": … }`.

### `POST /jobs/:id/abort`

Signal a running job to abort. Response `200` with `{ "aborted": true }`. If the job is not
running, returns `409`.

### `GET /jobs/job-runs/:jobId`

List `job_runs` for a job, newest first. Query params: `?status=…&since=YYYY-MM-DD&limit=50`.

Response item:
```json
{
  "id": 87,
  "job_id": 3,
  "status": "success",
  "started_at": "2026-04-10T02:00:00.000Z",
  "finished_at": "2026-04-10T02:04:17.000Z",
  "error_message": null
}
```

## Sources — `/sources`

Sources define *where backup data comes from*.

### `POST /sources`

Create a source. Name must be unique.

Request:
```json
{
  "name": "prod-mongo",
  "type": "mongodb",
  "config": {
    "uri": "mongodb://user:pass@host:27017",
    "database": "app",
    "authSource": "admin"
  }
}
```

Supported `type`: `"mongodb"`, `"s3"` (for object-replication sources), `"app"` (directories).

### `GET /sources`

List all sources the user can see.

### `GET /sources/:id` — `PUT /sources/:id` — `DELETE /sources/:id`

Standard read / update / delete.

### `POST /sources/test-connection`

Dry-run a connection against an unsaved source config.

Request: the same body as `POST /sources`.
Response: `{ "ok": true }` or `{ "ok": false, "error": "…" }`.

## Destinations — `/destinations`

Destinations define *where backup data goes*.

### `POST /destinations`

```json
{
  "name": "wasabi-primary",
  "type": "s3",
  "config": {
    "endpoint": "https://s3.wasabisys.com",
    "region": "us-east-1",
    "bucket": "my-backups",
    "accessKeyId": "…",
    "secretAccessKey": "…"
  }
}
```

Supported `type`:

- `"s3"` — AWS / Wasabi / any S3-compatible endpoint
- `"host"` — SFTP. Config: `host`, `port`, `username`, `privateKey` or `password`, `path`
- `"local-storage"` — filesystem. Config: `path`, `maxDiskUsage`

Credentials are sealed with `DESTINATION_KEY_SECRET` before being written to SQLite.

### `GET /destinations` — `GET /destinations/:id` — `PUT /destinations/:id` — `DELETE /destinations/:id`

Standard CRUD.

### `POST /destinations/test-connection`

Same body as `POST /destinations`. Verifies write access.

## Notifications

Three sibling resources configure email alerts.

### `/notification-providers`

CRUD for SMTP / SES endpoints.

```json
{
  "name": "ops-smtp",
  "type": "SMTP",
  "config": {
    "host": "smtp.example.com",
    "port": 587,
    "secure": false,
    "user": "…",
    "pass": "…",
    "from": "backup@example.com"
  }
}
```

`type` is `"SMTP"` or `"SES"`.

### `/notification-events`

List the event types the system can emit (`succeeded`, `failed`, `partial`). Read-only.

### `/notification-rules`

CRUD for rules that bind an event type to a provider and a set of recipients.

```json
{
  "event_type": "failed",
  "provider_id": 1,
  "recipients": ["ops@example.com"],
  "job_id": null
}
```

Set `job_id` to scope the rule to a single job; `null` applies it globally.

## Settings — `/settings`

Key-value store for global settings (default retention, timezone, vault timeout, etc.).

- `GET /settings` — returns all keys
- `GET /settings/:key` — one key
- `PUT /settings/:key` — request `{ "value": "…" }`

## Stats — `/stats`

- `GET /stats/summary` — totals: jobs, backups, total size, last-7-days success rate
- `GET /stats/timeseries?metric=bytes&range=30d` — data for the dashboard charts

## Users — `/users`

- `GET /users/me` — current user profile
- `PUT /users/me` — update name / email / company
- `PUT /users/me/password` — change password (body `{ "current": "...", "next": "..." }`)
- `POST /users/me/2fa/enable` — enable TOTP (returns provisioning URI)
- `POST /users/me/2fa/verify` — confirm TOTP code

Admin-only: `GET /users`, `POST /users`, `DELETE /users/:id` when multi-user mode is enabled.

## CORS

`api/index.js` configures CORS to allow `http://localhost:3000` by default. Set an explicit origin
in production by editing the CORS config or fronting the API with a reverse proxy that injects the
correct `Access-Control-Allow-Origin` header.

## Rate limiting

Not enforced in code today. If you expose the API to the public internet, put it behind a proxy
(nginx, Caddy, Traefik) with rate limiting on `/auth/*`.
