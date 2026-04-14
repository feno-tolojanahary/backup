# Frontend guide

The admin UI lives in `admin-ui/`. It is a Next.js 16 App Router application using React 19,
TypeScript, and Tailwind CSS v4.

## Running locally

```bash
cd admin-ui
npm install
npm run dev            # http://localhost:3000
```

Available scripts (`admin-ui/package.json`):

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build (`.next/`) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Environment

Create `admin-ui/.env.local`:

```ini
NEXT_PUBLIC_API_URL=http://127.0.0.1:3030
NEXT_PUBLIC_APP_NAME=Backup
```

The API must be reachable from the browser (the UI hits it directly, not through Next.js route
handlers), so CORS on the API side must allow the UI's origin.

## Directory layout

```
admin-ui/
├── public/                static assets, favicons, icons
└── src/
    ├── app/               Next.js App Router
    │   ├── (admin)/                      authenticated app shell
    │   │   ├── page.tsx                  dashboard
    │   │   ├── backups/page.tsx
    │   │   ├── jobs/
    │   │   │   ├── page.tsx              jobs list
    │   │   │   └── new/page.tsx          job creation
    │   │   ├── infrastructure/
    │   │   │   ├── sources/page.tsx
    │   │   │   └── destinations/page.tsx
    │   │   ├── notifications/page.tsx
    │   │   ├── settings/page.tsx
    │   │   └── (others-pages)/profile/page.tsx
    │   ├── (full-width-pages)/(auth)/    login / register / forgot
    │   └── layout.tsx
    ├── components/
    │   ├── auth/                         forms: login, register, password
    │   ├── modals/                       create / edit source, destination, job, notification
    │   ├── tables/                       BackupsTable, JobsTable, JobRunsTable, SettingsTable
    │   ├── sources/ form/                typed input wrappers for driver configs
    │   ├── header/ sidebar/              layout chrome
    │   └── ui/                           buttons, inputs, badges, toasts
    ├── lib/                              api client, auth helpers, format utils
    ├── store/                            Redux Toolkit slices + persist config
    ├── hooks/                            useAuth, useSWRAuthed, usePolling, …
    └── styles/                           Tailwind entry, global CSS
```

## Pages and navigation

| Route | Purpose |
| --- | --- |
| `/` (dashboard) | Summary cards, last runs, size-over-time chart, upcoming schedule |
| `/backups` | List of backups with filters, actions: download, restore, delete |
| `/jobs` | List of jobs with run-now / enable / disable toggles |
| `/jobs/new` | Job creation wizard: target → schedule → destinations → notifications |
| `/infrastructure/sources` | CRUD for sources; "Test connection" inline |
| `/infrastructure/destinations` | CRUD for destinations; quota + test-connection |
| `/notifications` | Providers + rules |
| `/settings` | Global KV settings |
| `/profile` | Password change, 2FA |
| `/login`, `/register`, `/forgot-password` | Auth |

## Auth flow

1. The user submits email + password from `(auth)/login/page.tsx`.
2. The form posts to `POST /auth/login` via `src/lib/apiClient.ts`.
3. The response `{ token, refreshToken, user }` is dispatched into the `auth` Redux slice and
   persisted through `redux-persist` (localStorage).
4. The `(admin)` layout redirects to `/login` when no token is present.
5. Every authed request passes `Authorization: Bearer ${token}` via an axios request interceptor.
6. A response interceptor catches `401` + `code: "TOKEN_EXPIRED"`, calls `POST /auth/refresh`, and
   retries the original request once. If refresh also fails, the slice is cleared and the user is
   sent to `/login`.

## State management

- **Redux Toolkit** for global UI state: `auth`, `ui` (sidebar collapse, theme), `vaultStatus`.
- **SWR** for server data that needs polling or cache sharing across components (backups list,
  job runs, stats). Keys are API URLs; `src/hooks/useSWRAuthed.ts` wraps the default `useSWR` to
  attach the auth header.
- **React Hook Form + Zod** for forms. Every form has a Zod schema co-located with the form
  component; `zodResolver` wires validation into RHF.

## Styling

- Tailwind CSS v4, configured in `admin-ui/tailwind.config.ts`.
- Design primitives (buttons, inputs, badges, cards) live in `src/components/ui/`.
- Dark mode is class-based (`dark:` variants); toggle persisted in the `ui` Redux slice.
- Icons: `lucide-react`.

## Charts and specialised UI

- **ApexCharts** via `react-apexcharts` for dashboard time-series.
- **FullCalendar** (`@fullcalendar/react`, day-grid + time-grid plugins) for the schedule view.
- **react-select** for multi-select inputs (destinations on a job, recipients on a rule).

## Password UX

The register and change-password forms use `zxcvbn` for real-time strength scoring and render a
five-step meter. A show/hide toggle on each password input flips the `type` between `password` and
`text`; it is keyboard-accessible (`aria-label`, `aria-pressed`). Labels are always rendered (not
placeholders), associated via `htmlFor`, and every input receives `aria-invalid` when RHF reports
an error so screen readers announce the state.

## API client

`src/lib/apiClient.ts` exports a preconfigured axios instance:

```ts
import { apiClient } from '@/lib/apiClient';

const { data } = await apiClient.get('/jobs');
```

- Base URL is `NEXT_PUBLIC_API_URL`.
- Request interceptor attaches the access token.
- Response interceptor handles refresh-on-401 and surfaces a normalised `ApiError`.
- For SWR, use the shared `fetcher` (also in `src/lib/apiClient.ts`) rather than raw `fetch`.

## Adding a page

1. Create `src/app/(admin)/<route>/page.tsx`. The `(admin)` layout provides auth gating, the
   sidebar, and the header — new pages inherit all of it.
2. Add a navigation entry in the sidebar component (`src/components/sidebar/…`).
3. For data fetching, use `useSWRAuthed('/your-endpoint')`. For mutations, call
   `apiClient.post(…)` inside an event handler and `mutate()` the SWR key to refresh.
4. Wrap the page body in the standard `PageHeader` + `Card` layout used by existing pages for
   visual consistency.

## Accessibility

- All interactive controls have visible focus rings (Tailwind's `focus-visible` utilities).
- Modal dialogs trap focus and close on `Esc`.
- Form errors use `aria-describedby` to link the message to the input.
- Tables use `scope="col"` on headers and `aria-sort` where sortable.
