# Contributing

Thanks for wanting to help. This document explains how to get a dev environment running, the
conventions this codebase follows, and how we'd like contributions to land.

## Ground rules

- Be kind. Assume good faith in reviews and in issues.
- File an issue before a big PR so we can agree on scope.
- Security issues: do **not** open a public issue. Email the maintainer listed in
  `package.json` (`author`) or open a private advisory on GitHub.

## Development setup

```bash
git clone https://github.com/<you>/backup.git
cd backup
npm install
cd admin-ui && npm install && cd ..

cp .env.example .env                # create if missing; fill in test values
node index.js configure             # set a throwaway vault password for dev
```

For local end-to-end testing you almost certainly want the bundled S3Mock:

```bash
docker compose up -d s3mock         # exposes http://localhost:9090
```

Configure a destination of type `s3` pointing at `http://localhost:9090`, any access / secret key,
and bucket `mybucket` or `testbucket`.

### Running everything

In three terminals:

```bash
# 1. API + scheduler
node server/daemon.js

# 2. Admin UI
cd admin-ui && npm run dev

# 3. CLI (optional, as you work)
node index.js list
```

The project ships a `nodemon.json` — `npx nodemon` auto-restarts the daemon on changes to
`index.js`, `server/`, `api/`, `lib/`, `config.js`.

## Repository layout

See [ARCHITECTURE.md](./ARCHITECTURE.md). Short version:

- `lib/` — all core backup / restore logic
- `api/` — Express HTTP layer (thin, calls into `lib/`)
- `admin-ui/` — Next.js dashboard
- `server/` — daemon + cron scheduler
- `index.js` — CLI entry point

## Branching and commits

- Branch off `main` with a descriptive name: `feat/sftp-keyfile`, `fix/restore-ns-rewrite`,
  `docs/api-examples`.
- One logical change per PR. Split refactors out of feature work when you can.
- Write commit messages in the imperative mood, subject ≤ 72 chars, with a body when the "why"
  isn't obvious from the diff. Recent repo style (`git log`) is a good reference.

## Code style

### JavaScript / Node (`lib/`, `api/`, `server/`, `index.js`)

- CommonJS (`require` / `module.exports`) — match the rest of the file you are editing.
- Node ≥ 20 features are fine (top-level `await` in ES modules, `node:` imports, `structuredClone`).
- Prefer small, pure functions in `lib/`; keep side effects (filesystem, network, db) at the edges.
- HTTP controllers should do little more than parse input, call into `lib/`, and shape the
  response.
- No silent `catch { }`. If you catch an error, either handle it meaningfully or log with enough
  context to reproduce.

### TypeScript / React (`admin-ui/`)

- TypeScript strict mode, no `any` unless you annotate *why* in a one-line comment.
- React Server Components where possible; mark client components with `"use client"`.
- Forms: React Hook Form + a co-located Zod schema.
- Data fetching: SWR for reads, `apiClient` for mutations; `mutate()` the SWR key after a write.
- Styling: Tailwind utility classes. Extract a component (not a CSS class) when you'd repeat the
  same class soup three times.
- Lint must pass: `cd admin-ui && npm run lint`.

### Comments

Default to writing none. Add a comment only when the **why** is non-obvious (a workaround for a
specific upstream bug, a subtle invariant, a hidden constraint). Don't restate what the code does.

### File size

If a file passes ~400 lines, consider splitting. `backupController.js` and `jobs.js` are near the
top end; new features that would grow them past 600 lines are good candidates for a sub-module.

## Tests

There is no comprehensive test suite yet. We welcome:

- Unit tests for pure functions in `lib/` (encryption helpers, config validation, schedule
  parsing). Any lightweight runner is fine; `node --test` is preferred because it ships with Node.
- Integration tests for storage adapters that run against S3Mock.
- Component tests for the admin UI with Vitest + React Testing Library.

Before sending a PR, at minimum:

```bash
# at the repo root
node -e "require('./config')"                        # loads without throwing
node -e "require('./lib/db/db')"                     # opens / creates the schema
node server/daemon.js &                              # starts the daemon
curl -s http://127.0.0.1:3030/stats/summary          # returns JSON (after login)
kill %1

# in admin-ui
cd admin-ui && npm run lint && npm run build
```

## Opening a pull request

1. Rebase onto latest `main`.
2. Run the checks above.
3. Push your branch and open a PR against `main`.
4. PR description should cover:
   - **What** the change does (one paragraph).
   - **Why** it is needed (link the issue if there is one).
   - **How** to try it — commands, UI steps, API calls, or screenshots for UI work.
   - Anything reviewers should pay attention to (migrations, config changes, new env vars).
5. Keep the PR open for review; push follow-up commits rather than force-pushing unless a
   reviewer asks.

## Reviews

We aim to respond within a few days. Expect feedback on:

- Scope creep — unrelated refactors muddy the diff.
- Missing error context on new failure paths.
- New dependencies — please justify them, especially in `lib/` where we keep the surface small.
- Security: input validation, credential handling, anything that could leak decrypted data to
  disk.

## Releasing (maintainers)

1. Merge everything queued for the release into `main`.
2. Bump `version` in root `package.json` and in `admin-ui/package.json`.
3. Update a `CHANGELOG.md` (not yet present — please start one with the first release).
4. Tag `vX.Y.Z`, push the tag, draft a GitHub release with the changelog section.
5. If the release requires a migration or an env-var change, call it out at the top of the notes.

## Code of conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
By participating you agree to uphold it.
