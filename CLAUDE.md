# PickleRuns — Claude Instructions

This file governs every AI session in this repo. Read it fully before touching any file.

---

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript — strict mode |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| Migrations | `node-pg-migrate` — JS builder API (`db/migrations/`) |
| Auth | Supabase Auth + `@supabase/ssr` |
| Validation | Zod |
| HTTP envelope | `src/lib/api/` + `src/types/api.ts` |
| Server state | TanStack Query (`src/hooks`) |
| UI-only state | Zustand (`src/stores`) |
| Styling | Tailwind CSS |
| UI primitives | Radix UI |

---

## UI / Design Priorities

This is a **mobile-first web app**. Players use it on their phones at the court.

- **Always design for mobile first.** Tailwind: start with base (mobile) styles, add `md:`/`lg:` breakpoints only for desktop enhancement.
- Touch targets minimum 44px. Tap-friendly spacing.
- Bottom nav is the primary navigation — do not replace with sidebars or top-heavy layouts.
- Avoid hover-only interactions — use tap/press states.
- Desktop layout is a nice-to-have, not a requirement.

---

## Project Structure

All paths below live under `src/`. The Drizzle client and schema live under `src/db/` — **not** under `src/lib/`. `src/lib/` is for "helpers + clients + infra config" (`lib/supabase/`, `lib/api/`, `lib/env.ts`, `lib/utils.ts`, `lib/query/`); persistence gets its own top-level tree so the layout reads as "frontend in `app/`, infra in `lib/`, persistence in `db/`."

```
app/
├── page.tsx                        Landing
├── (auth)/                         Login, signup — route group (URLs: /login, /signup)
│   ├── login/
│   ├── signup/
│   └── actions.ts                  "use server" — Supabase auth SDK direct (the only exception)
├── (protected)/                    Auth-guarded — middleware redirects guests
│   ├── create-run/
│   ├── dashboard/                  Host dashboard
│   ├── history/                    All runs for the signed-in host
│   └── account/
├── runs/[code]/
│   ├── layout.tsx                  Passthrough — no data fetch
│   ├── join/                       Guest join flow
│   ├── courts/[courtId]/assign/    Host picks the four players for a court (fill proposal + manual swap)
│   ├── (host)/results/             Post-run summary — host, no bottom nav
│   └── (session)/                  Pages with bottom nav
│       ├── layout.tsx              BottomNav wrapper
│       ├── game/                   Live game management (tap-to-score)
│       ├── queue/                  Queue view
│       ├── payment/                Court-fee confirmation (host)
│       ├── lobby/                  Courts dashboard (court cards, Next up, player status banner)
│       └── lobby/[gameId]/         Single game detail
└── api/                            All HTTP endpoints — thin: auth + Zod + delegate
    ├── auth/                       callback (PKCE) + confirm (token-hash)
    ├── host-requests/
    ├── invites/[token]/
    ├── runs/
    │   └── [code]/
    │       ├── status/
    │       ├── stats/
    │       ├── courts/                  GET overview · POST add court
    │       │   └── [courtId]/           DELETE idle court
    │       │       └── fill-proposal/   GET proposed four players
    │       ├── games/
    │       │   └── [gameId]/            GET detail · PATCH end game
    │       │       └── score/           POST point · PATCH undo (void)
    │       └── queue/
    │           └── [entryId]/
    └── users/
        └── me/

components/
└── ui/                             Generic primitives + app-specific composed pieces

hooks/                              Client-side React hooks (use-*.ts)
                                    use-courts (courts overview, fill proposal, add/remove court)
                                    use-run-realtime (single per-run Realtime channel)
stores/                             Zustand stores — UI-only state ONLY (never API data)
                                    Naming: <thing>.store.ts
                                    court-assignment.store.ts (draft for the court assign screen)
lib/
├── api/
│   ├── client.ts                   apiGet/apiPost/apiPatch/apiDelete — ApiResponse unwrap
│   └── response.ts                 apiSuccess · apiError · handleApiError
├── env.ts                          Zod-validated env vars (server only, lazy)
├── queue-pairs.ts                  pickNextGroup — pure; keeps pairs that just played together as partners
├── query/                          QueryClient setup (wired in app/layout.tsx)
├── supabase/
│   ├── client.ts                   Browser client
│   ├── server.ts                   Server client
│   └── proxy.ts                    Middleware session refresh
└── utils.ts                        Pure utility functions (cn, etc.)

services/                           Business logic + DB access (*.service.ts)
                                    run · game · queue · court (courts overview, add/remove, fill proposal) · host-request · invite · email
validators/                         Zod schemas (*.validator.ts) — input source of truth
types/
├── api.ts                          ApiResponse<T> envelope
└── db.ts                           Drizzle inferred types ($inferSelect)

db/
├── index.ts                        Drizzle client (postgres.js, pooler-safe, lazy)
└── schema/
    ├── index.ts                    Barrel: exports tables, enums, relations
    ├── enums.ts                    pgEnum definitions
    ├── users.ts                    users table
    ├── runs.ts                     runs table
    ├── courts.ts                   courts table
    ├── queue-entries.ts            queueEntries table
    ├── games.ts                    games table
    ├── game-players.ts             gamePlayers table
    ├── score-events.ts             scoreEvents table
    └── relations.ts                ALL relations() declarations (avoids cross-table cycles)
```

---

## Data Flow — One Direction Only

```
page / client component
  │  TanStack Query hook (src/hooks/use-<thing>.ts)
  ▼
api wrapper (src/lib/api/client.ts)        ← single source of HTTP from the browser
  │  ApiResponse<T> envelope
  ▼
route handler (src/app/api/**/route.ts)   ← thin: auth + Zod + delegate, responds with apiSuccess/apiError
  │
  ▼
service (src/services/<thing>.service.ts) ← ALL business logic + DB access
  │
  ▼
db (src/db, Drizzle) / Supabase
```

**Never skip a layer.** Every layer only talks to the layer below it.

- **Client components NEVER import from `src/services`, `src/db`, or `src/lib/supabase/{client,proxy}`.** They reach the backend only through `src/hooks` → the api wrapper. No exceptions for app data.
- **Server Components NEVER import from `src/services` or `src/db`.** They reach the backend only through `fetch('/api/...')` parsed as the `ApiResponse<T>` envelope. (There is no Server-Component shortcut. The auth bootstrap is the only Supabase-SDK-direct call, in `app/(auth)/actions.ts`.)
- **Route handlers stay thin:** authenticate (`createClient()` from `src/lib/supabase/server` + `getUser()`), validate with Zod (`safeParse` — never `parse`), delegate to a service, respond with `apiSuccess` / `apiError` / `handleApiError` from `src/lib/api/response.ts`. No business logic, no DB queries, no direct Drizzle.
- **Services own ALL business logic and DB access.** They never touch `Request` / `Response` / `cookies`. They take plain typed inputs (including the authenticated `userId`) and must scope every query to the authenticated user. Validation does not live here — services trust their inputs.
- **Auth exception:** `src/app/(auth)/actions.ts` calls the Supabase SDK directly. It manages its own cookies and is the only place outside `lib/supabase/` allowed to do so. **App data never does this.**

---

## What Goes Where

### API routes (`app/api/<things>/route.ts`)
- Authenticate via `createClient()` from `src/lib/supabase/server` + `auth.getUser()`. Pass the resolved `userId` into the service.
- Validate request body and query params with Zod — `safeParse` only, never `parse`.
- Call a service function with the validated input plus `userId`.
- Return `apiSuccess(data, status?)` on success or `apiError(code, message, status?)` / `handleApiError(err)` on failure.
- Every route returns the `ApiResponse<T>` envelope defined in `src/types/api.ts`.
- No DB queries, no Drizzle, no business logic in route handlers.

### Services (`src/services/<thing>.service.ts`)
- All DB queries live here (Drizzle only — no raw SQL unless wrapped in a migration).
- No `NextRequest`, `NextResponse`, `cookies()`, or any HTTP concept.
- No Zod — validation happens in API routes before services are called. Services trust their inputs.
- Throw typed errors (`GameNotFoundError`, `GameCompletedError`, `DuplicateScoreError`, `InvalidEntryIdsError`, `PlayerNotInGameError`, `PlayerUnavailableError`, `InvalidRosterError`, `WinnerRequiredError`, `CourtNotFoundError`, `CourtOccupiedError`, `LastCourtError`, `CourtLimitError`, `CourtHasHistoryError`, `HostAlreadyHasActiveRunError`, `RunModeNotSupportedError`, `RunCompletedError`, etc.) for cases the route should map to specific HTTP statuses. `handleApiError` does the mapping.
- Pure functions: take typed inputs, return typed outputs. Scope every query to the authenticated `userId` passed in.
- One file per resource: `run.service.ts`, `queue.service.ts`, `game.service.ts`, etc.

### API client + response helpers (`src/lib/api/`)
- `client.ts` exports `apiGet<T>` / `apiPost<T>` / `apiPatch<T>` / `apiDelete<T>`. Each calls `fetch`, unwraps the `ApiResponse<T>` envelope, and throws on `!ok` or `{ error }`. The `ApiResponse<T>` shape is the only wire contract between the route and the hook.
- `response.ts` exports `apiSuccess(data, status?)`, `apiError(code, message, status?)`, and `handleApiError(err)`. `handleApiError` maps the service error classes above to status codes + error codes; it is the single place a route catches.

### Validators (`src/validators/<thing>.validator.ts`)
- Zod is the source of truth. Export the schema and the inferred type: `export type CreateRunInput = z.infer<typeof createRunSchema>`.
- Enum values in Zod schemas must match the Drizzle enum values exactly.
- One file per resource.

### Hooks (`src/hooks/use-<thing>.ts`)
- Client-side only (`"use client"` context). Use TanStack Query (`useQuery` / `useMutation`) wrapping the api client from `src/lib/api/client.ts`.
- Supabase Realtime subscriptions live here. `useEffect` cleanup must `removeChannel`.
- Cache key convention: `["<entity>", code, ...entityId]`. `code` is the public run identifier used in URLs.
- One file per resource. Multiple `useXxx` hooks in the same file are fine when they share types (e.g. `useRun` + `useRunMutation`).

### Zustand stores (`src/stores/<thing>.store.ts`)
- **UI-only state ONLY.** Never mirror API data into a store. The state may cross component trees, but it must not come from a route handler.
- Draft / ephemeral state (court-assignment draft, undo toasts, drag previews) belongs here.

### Server state vs client state
- API data → TanStack Query (`src/hooks`). Invalidate on Realtime events; never set `useState` to hold a server payload.
- UI-only state → Zustand (`src/stores`).
- Auth context for the current session → `useSessionUser` hook (TanStack Query, `staleTime: Infinity`).

### DB (`src/db/`)
- `src/db/index.ts` — Drizzle client only. `prepare: false` for Supabase pgBouncer (transaction mode).
- `src/db/schema/index.ts` — barrel re-exporting tables, enums, and relations.
- `src/db/schema/enums.ts` — `pgEnum` definitions.
- `src/db/schema/<table>.ts` — one file per table. **No `relations()` calls in table files.**
- `src/db/schema/relations.ts` — all `relations()` declarations live here, importing from the table files. This avoids circular imports between table files that would otherwise arise when each table's `relations()` references its peers.
- `lib/db/schema.ts` is the historical single-file home. It has been split — do not reintroduce it.

### Types (`src/types/`)
- `types/api.ts` — `ApiResponse<T>` envelope. Single source of truth for the wire shape.
- `types/db.ts` — only `$inferSelect` and `$inferInsert` from Drizzle tables. No manually written interfaces that duplicate the schema.

### Lib (`src/lib/`)
- `lib/api/` — HTTP envelope (above).
- `lib/env.ts` — Zod-validated env vars. Replaces `process.env.X!` non-null assertions. Lazy, server-only.
- `lib/query/` — `QueryClient` setup. Imported by `app/layout.tsx`.
- `lib/supabase/` — browser client, server client, middleware session refresh. Used by routes, middleware, and the auth actions.
- `lib/utils.ts` — pure utility functions (`cn`, `generateRunCode`, `deriveInitials`).

---

## Auth Model

| Role | Account | Access |
|---|---|---|
| Host | Required | Full control — create run, manage courts and queue, score |
| Player | Guest (optional) | Join queue, view live score |
| Spectator | Guest | Read-only |

- Middleware (`src/lib/supabase/proxy.ts`) is the auth enforcement layer — redirects unauthenticated users away from `/create-run`, `/history`, `/account`.
- `(protected)/layout.tsx` is a pure passthrough — do not add auth checks here.
- In API routes, authenticate with `createClient()` from `src/lib/supabase/server` + `auth.getUser()`. Pass the resolved `userId` to the service. The service scopes every query to that `userId` (or to a `runId` that the route has already resolved to be owned by `userId`).
- RLS enforces authorization at the DB level as a second line — do not re-implement access checks in services, but do pass `userId` in so the service can scope its queries.
- Guest mutations (join queue) go through API routes, which write as a role that bypasses RLS. RLS has no client INSERT policy on `queue_entries` and no write policies on `courts`, so run-mode, status and court-cap rules cannot be bypassed from a client.

---

## Schema Rules

These are non-negotiable — violations break the app silently.

- **`games.score_a` and `games.score_b` are trigger-maintained.** Never write them from application code. Only `score_events` inserts/voids affect them.
- **Queue ordering is the integer `position` column.** Lower `position` = front of queue; read order with `ORDER BY position ASC`. Never use `ORDER BY joined_at` to determine queue order. (The old `after_entry_id` linked list was dropped in migration `1781020049924`.)
- **Queue rotation is trigger-maintained.** `trg_rotate_queue_on_game_complete` (function `rotate_queue_on_game_complete`) rewrites `queue_entries.position` on every game → `completed` transition, per `runs.rotation_style`. It skips `score_only` runs and takes `pg_advisory_xact_lock(hashtext(run_id::text), 2)` — the same key `joinQueue` uses. `rotate_all`: all four players go to the back, winners ahead of losers (old relative order within each group; a NULL winner keeps the old order). `winner_stays`: only the losing side goes to the back; winners keep their positions. `removed` entries never move. Never rotate the queue from application code — game completion is the only path that may reorder it.
- **A game starts when it is assigned.** There is no pending-then-start step in the flow: assigning four players to a court creates the game as `active`. Pairs that just played stay partners when drawn into the next game (partner derived from the most recent game; `pickNextGroup` in `src/lib/queue-pairs.ts`).
- **`runs.run_mode`** (`score_only` | `queue_only` | `score_and_queue`) decides behavior. `score_only` has no queue (host sets the matches per court and scores). `queue_only` has the queue and court rotation but no points — the host ends each match and picks the winner when needed. `score_and_queue` does both. Other run settings: `rotation_style` (`rotate_all` (UI label: Stacking) | `winner_stays`), `court_count`, `score_goal` (11 or 15, default 11), `win_by_two`.
- **Courts.** Each run has `court_count` rows in `courts` (unique `(run_id, number)`). `games.court_id` is NOT NULL, and the partial unique index `uq_games_court_open` allows at most one `pending`/`active` game per court. The host can add courts (max 8) and remove idle courts (courts with history cannot be removed).
- **One open run per host.** `uq_runs_one_open_per_host` (partial unique on `host_id` where status is `lobby`/`active`); a second create surfaces as `HostAlreadyHasActiveRunError`.
- **Scoring is rally scoring.** Each tap is exactly one `score_events` row with `points = 1` for the tapped player's side. Undo sets `voided_at` — never delete. The game ends automatically at `score_goal` (and a lead of 2 when `win_by_two`). `games.winner` is `team_a` | `team_b` | NULL (no tie value). DB values stay `team_a`/`team_b`; the UI says Side A / Side B.
- **Names are required** for every player (`queue_entries.display_name` is NOT NULL).
- **Host requests.** `host_requests.display_name` is required; `decided_at` is stamped by trigger `trg_stamp_host_request_decision` when status moves from `pending` to `approved`/`denied`. Do not set it from app code.
- **Never hard-delete `queue_entries` with game history.** `game_players` and `score_events` have `ON DELETE RESTRICT` on `queue_entry_id`. Always set `status = 'removed'` instead.
- **`users.id` mirrors `auth.users.id`.** The row is created by trigger, not by the app. Never insert into `users` manually.
- **`session_code` is the public identifier for a run.** URLs use `[code]` not `[id]`.

---

## Migration Rules

Drizzle Kit is **not used**. Migrations are JS files managed by `node-pg-migrate`, applied directly via `DIRECT_URL`. Migrations live at `db/migrations/` (project root) — they are **not** under `src/db/`. `src/db/` is the Drizzle source-of-truth only; `db/migrations/` is the actual schema-changes-applied history.

```bash
# Any schema change (table, column, index, RLS, trigger):
# 1. Scaffold:
npm run db:migrate:create -- <description>
# 2. Edit the generated file in db/migrations/
# 3. Apply:
npm run db:migrate
# Roll back last migration:
npm run db:migrate:down
```

**Naming:** `node-pg-migrate` prefixes files with a timestamp automatically — do not rename them.

- **Never edit a migration file after it has been applied** — write a new one.
- `src/db/schema/<table>.ts` is the Drizzle ORM definition — keep it in sync with migrations manually.
- RLS policies and triggers go in migration files using `pgm.sql()`.
- `supabase/migrations/` contains legacy SQL files (already applied) — do not touch them.
- Runner script: `tools/run-pg-migrate.mjs` — loads `DIRECT_URL` from `.env`.
- Fresh (empty) databases: `npm run db:baseline:apply` then `npm run db:migrate`; the legacy chain cannot replay from scratch.
- Regenerate the baseline (`npm run db:baseline:generate`) after applying new migrations to the source-of-truth DB; applied migrations are still never edited.

---

## Zod Usage

```ts
// In API routes — always use safeParse, never parse
const result = createRunSchema.safeParse(await req.json());
if (!result.success) {
  return apiError("VALIDATION", result.error.flatten().fieldErrors.toString(), 400);
}
// result.data is now typed and safe to pass to a service
```

- One file per resource in `src/validators/<thing>.validator.ts`.
- Export both the schema and the inferred type: `export type CreateRunInput = z.infer<typeof createRunSchema>`.
- Enum values in Zod schemas must match the Drizzle enum values exactly.
- Services do not import from `validators/` — they trust their inputs.

---

## Supabase Realtime

- Realtime subscriptions belong in `src/hooks/` — never in Server Components or API routes.
- One channel per run (`use-run-realtime`) subscribes to `games`, `courts`, `queue_entries`, and `runs`. Do not add per-screen channels for these tables.
- Those four tables are in the `supabase_realtime` publication (migration `enable-realtime-tables`); `courts` has `REPLICA IDENTITY FULL` so DELETE events carry `run_id`. A new table needs its own migration adding it to the publication before it can be subscribed to.
- `games` events cover live scores (the trigger keeps `score_a`/`score_b` in sync); `queue_entries` events cover live queue updates.
- Always unsubscribe on component unmount — use the `useEffect` cleanup return to call `supabase.removeChannel`.

---

## Next.js 15 — Dynamic Rendering

Next.js 15 requires explicit opt-in for any layout or page that accesses request-time data. Without it, the route throws a "blocking route" error.

**Rule: any layout or page that accesses `params`, `searchParams`, `cookies()`, or `headers()` must declare:**

```ts
export const dynamic = "force-dynamic";
```

This applies to:
- Layouts that read `params` to fetch data (e.g. `runs/[code]/layout.tsx`)
- API routes do NOT need it — they are always dynamic
- Client components (`"use client"`) do NOT need it — they run in the browser
- Pure passthrough layouts with no data access do NOT need it

Auth is enforced by middleware, not layouts. Do not add auth checks to layouts — this was the original cause of the `(protected)/layout.tsx` error.

Note: Next.js 16 replaces `middleware.ts` with `proxy.ts`. The project is on Next 15 — the rename is deferred until the Next 16 upgrade.

---

## What NOT To Do

- Do not use `drizzle-kit` — it is removed
- Do not use `supabase db push` — migrations now go through `node-pg-migrate`
- Do not write to `games.score_a` or `games.score_b` from app code
- Do not hard-delete queue entries — set `status = 'removed'`
- Do not import from `src/services`, `src/db`, or `src/lib/supabase/{client,proxy}` in `app/` pages or components — go through `src/hooks` → `src/lib/api/client.ts`
- Do not put business logic in API route handlers — put it in `src/services/<thing>.service.ts`
- Do not import Drizzle, run queries, or touch `src/db` from a route handler — delegate to a service
- Do not put `relations()` declarations in `src/db/schema/<table>.ts` — they live in `src/db/schema/relations.ts` to avoid cross-table circular imports
- Do not use `z.parse()` in API routes — always `z.safeParse()`
- Do not add Zod validation inside services — services trust their inputs
- Do not return `NextResponse.json(...)` from a route — use `apiSuccess` / `apiError` / `handleApiError`
- Do not call `fetch('/api/...')` directly from a component — use the hook, which uses the api wrapper
- Do not mirror API data into a Zustand store — use TanStack Query
- Do not use `ORDER BY joined_at` for queue ordering — the integer `position` column is the order
- Do not rotate the queue from app code — the game-completion trigger owns `queue_entries.position`
- Do not reintroduce a game clock, time limit, `run_format`, point systems (1s/2s/3s), serving team, or a `tie` winner — scoring is rally scoring, one point per tap
- Do not reintroduce the team-assignment screen or `team-draft.store.ts` — court assignment is `courts/[courtId]/assign` with `court-assignment.store.ts`
- Do not add comments explaining what code does — only add comments explaining why when the reason is non-obvious
- Do not create new files unless the task requires it (a restructuring task is the one exception)
