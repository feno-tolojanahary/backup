# Troubleshooting

A running list of common problems and how to resolve them. If your issue isn't here, open a GitHub
issue with:

- Your OS and Node version (`node -v`)
- The command / page that failed
- The relevant lines from `log/daemon.log` (or `journalctl -u backup` on systemd)
- Your `config.js` **with all secrets redacted**

## FAQ

### Why SQLite? Can I use Postgres?

SQLite keeps the deployment footprint to one process and one file. There is no Postgres adapter
today. Swapping would require rewriting `lib/db/db.js` and every `better-sqlite3` call site. If
you'd like this, please open an issue to discuss first — it's a large change.

### Are backups encrypted?

Yes, when a backup is written through a job and the vault has been configured. The vault password
derives an AES key (via `jose`). Data is encrypted as it streams to the destination; plaintext
never lands on disk. Restores decrypt in memory.

### What happens if I forget the vault password?

There is **no recovery**. The password verifier is stored, but not the password itself, and the key
material needed to decrypt existing backups can only be derived from the password. Plan for secure
storage of this password (password manager, sealed envelope, etc.) before you start relying on
encrypted backups in production.

### Does Backup support multi-user?

There is a `users` table and auth is user-scoped, but the default deployment is single-tenant.
Admin-only endpoints exist under `/users` for future multi-user expansion.

### Can I run two daemons for HA?

No. SQLite + `better-sqlite3` is not safe across processes on the same file, and the cron
scheduler would double-run jobs. Use a single daemon and back up the SQLite file itself.

### How do I change the API port?

Set `PORT` in `.env`. Also update `NEXT_PUBLIC_API_URL` in `admin-ui/.env.local` and, if you run in
production, the reverse-proxy config.

### Where are my backup files actually stored?

Either in the S3 bucket / SFTP path / local directory you configured on the destination. The
SQLite row in `backups` records `destination_id` and the `backup_uid` — the `backup_uid` is the
object key (plus a `.enc` suffix when encrypted).

## Common errors

### `Error: cannot open database because the file is encrypted or is not a database`

The SQLite file is corrupted or was written by an incompatible `better-sqlite3` major version.

1. Stop the daemon.
2. Restore the most recent copy of `data/backup.db.bak`.
3. If you don't have a backup, run `sqlite3 data/backup.db ".recover" | sqlite3 data/recovered.db`
   and inspect the result.

### `TOKEN_EXPIRED` loops in the UI after login

The UI caches its token in `redux-persist` → localStorage. If the API's JWT secret changed (or
the daemon was reset), old tokens will never validate again.

Fix: open devtools → Application → Local Storage → remove the `persist:auth` key and log in
fresh.

### `ECONNREFUSED 127.0.0.1:3030` in the UI

The API / daemon isn't running. Check:

```bash
node index.js status
# or
sudo systemctl status backup
```

Start it, then reload the UI.

### `MongoServerSelectionError` during a backup or restore

The daemon could not reach the MongoDB source.

- Verify the URI in **Infrastructure → Sources** and run **Test connection**.
- If you use SRV records, confirm DNS works from the host.
- If MongoDB is behind a firewall, whitelist the daemon's egress IP.
- If you are using Atlas, make sure the connection string includes the `?retryWrites=true&w=majority`
  suffix and the user has `backup` role.

### `mongorestore: command not found` during restore

`mongodump` / `mongorestore` are not bundled — install the MongoDB Database Tools package and make
sure they are on the daemon's `PATH`. On systemd, set `Environment=PATH=/usr/local/bin:/usr/bin:/bin`
in the unit if needed.

### `ENOSPC` on the local-storage destination

The destination exceeded its `max_disk_usage`, or the host ran out of real disk. Either:

- Raise `max_disk_usage` on the destination, and let the retention task (hourly) free space.
- Reduce `retention_days` on the affected jobs.
- Free space manually and restart the daemon.

### S3 upload fails with `SignatureDoesNotMatch`

Almost always a credentials / endpoint / region mismatch:

- Wasabi: region must match the bucket's region. `us-east-1` is not a safe default.
- S3-compatible providers: set `endpoint` explicitly. Don't rely on AWS defaults.
- Check that the clock on the host is in sync (`timedatectl status`); more than a few minutes skew
  breaks signing.

### SFTP destination fails with `All authentication methods failed`

- Confirm the username is correct.
- If you pasted a private key, make sure it includes the `-----BEGIN / END-----` lines and the
  newlines survived the form submission.
- Try the same key from the daemon host with the OpenSSH CLI:
  `ssh -i /path/to/key user@host "echo ok"`.
- If the host requires a passphrase, either remove it with `ssh-keygen -p` or use password auth.

### "Vault is locked" when running restore or export

Run `node index.js unlock` on the host where the daemon is running. The vault is an in-memory
unlock on the daemon process. Unlocking from the UI is also available under
**Settings → Vault**; it calls the same code path.

### Scheduled jobs never run

Check in order:

1. The daemon is running: `node index.js status`.
2. The job is enabled: UI → Jobs, or `node index.js job list`.
3. The cron expression is valid: paste it into [crontab.guru](https://crontab.guru).
4. The host clock and timezone are correct. The scheduler uses the host's timezone unless a
   different one is set in **Settings → Timezone**.
5. The previous run is still "running" and blocking: check `job_runs` for an old row without a
   `finished_at`. An orphaned run can be marked aborted via `POST /jobs/:id/abort`.

### Admin UI shows "Failed to fetch" on every page

CORS. The API allows `http://localhost:3000` by default. When you deploy the UI to another origin,
update the CORS config in `api/index.js` (or front both with a reverse proxy so they share an
origin).

### Daemon won't start: `EADDRINUSE 0.0.0.0:3030`

Another process already bound the port. Find it with `lsof -i :3030` (or `netstat -anop tcp` on
Windows), stop it, or set `PORT` to a free port.

### Next.js build fails with `Module not found: Can't resolve …`

Run `npm ci` inside `admin-ui/`. A partial install can leave `node_modules` inconsistent — delete
`admin-ui/node_modules` and `admin-ui/package-lock.json` is **not** needed; just re-run `npm ci`.

### Backup succeeded but size is 0 bytes

Most often the source had no collections matching the filter, or `mongodump` returned an empty
archive. Check `log/daemon.log` for the full `mongodump` invocation and stderr. Re-run the job
with `--verbose` temporarily by setting the `MONGODUMP_EXTRA_ARGS=--verbose` env var before
starting the daemon.

## Getting more logs

- Daemon logs: `log/daemon.log` (path is set in `config.js`).
- Each job run writes a per-run log next to the daemon log.
- The UI surfaces `error_message` from `job_runs`; the daemon log has the full stack trace.
- For one-off debug, start the daemon in the foreground with `node server/daemon.js` and tail
  stderr live.

Still stuck? Open an issue with the log snippet, the steps to reproduce, and the output of
`node -v` and `node index.js status`.
