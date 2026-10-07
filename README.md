# PickleRuns

PickleRuns is the sideline tool for running pickleball doubles open play. Hosts manage courts, a paddle-stacking queue, and live scores — while players just show up and play.

## What is PickleRuns?

PickleRuns keeps the chaos out of open pickleball play. Hosts create a run and share a 6-character code. Players scan in, join the queue, and wait their turn. The host fills each court with the next four players and scores the game with one tap per point — all from their phone. Everyone sees the same live state without refreshing.

## Core Principles

**Host-first design.** The host is running courts at a facility, not sitting at a desk. Every action should be fast and obvious.

**Real-time by default.** Court, queue, and score changes push to all connected clients instantly. Nobody should be looking at stale state.

**Zero friction for players.** Players join with a name and a code — no account, no download, no friction.

**Scores are events, not edits.** Every point is logged as a `score_events` row (one tap = one point). Undo doesn't delete — it voids. The record stays intact and a trigger keeps `games.score_a` / `score_b` in sync.

**Queue order is explicit and trigger-owned.** Order is an integer `position` column rewritten by a database trigger on game completion. The host never sorts by timestamp and the app never rotates the queue.

**The host scores by tap.** Rally scoring: each tap is exactly one point for the tapped player's side, and the game ends automatically at the goal.

## Who Should Use PickleRuns

**Run organizers.** People who host recurring open-play sessions and want structure without spreadsheets.

**Club and facility managers.** Anyone managing a rotating queue of players across several courts.

**Casual groups.** Friend groups who want a fair, visible paddle stack instead of "who called next?"

## Key Features

**Session codes.** Share a 6-character `session_code` (shown as `ABC-DEF`) to bring players into your run — no accounts needed on their end.

**Multiple courts.** A run has 1–8 courts. Each court holds at most one game at a time, and the host can add or remove idle courts during the run.

**Run modes.** `score_only` (no queue; the host sets matches per court and scores), `queue_only` (paddle-stack queue and court rotation, no points; the host ends each match and picks the winner when needed), or `score_and_queue`.

**Paddle-stacking queue.** One ordered queue per run. Add players, mark them out, reinstate, or remove them, with changes reflected instantly for everyone via Supabase Realtime. A court is filled from the front of the queue, and pairs that just played stay partners.

**Rotation styles.** `rotate_all` sends all four players to the back with winners ahead of losers; `winner_stays` sends only the losing side to the back. The database trigger does the rotation on game completion.

**Live scoreboard.** Tap to score one point at a time, with undo that voids the point without losing the audit trail. Games end automatically at the score goal (11 or 15), with an optional win-by-two. There is no clock or time limit.

**Realtime.** One Supabase Realtime channel per run keeps games, courts, the queue, and the run in sync.

**Court fees.** The host can mark each player paid from the payment view — tracked per queue entry, independent of their queue status.

**Game history.** Every game, lineup, and point event is stored. Past games are always viewable from the lobby.

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript — strict mode |
| Database | Supabase (PostgreSQL) + Supabase Auth + Supabase Realtime |
| Auth | `@supabase/ssr` |
| Email | Resend + React Email — transactional (welcome) |
| ORM | Drizzle ORM |
| Migrations | `node-pg-migrate` (JS builder API) |
| Validation | Zod |
| HTTP envelope | `src/lib/api/` + `src/types/api.ts` |
| Server state | TanStack Query (`src/hooks`) |
| UI-only state | Zustand (`src/stores`) |
| Styling | Tailwind CSS |
| UI primitives | Radix UI |

## Project Structure

The layout reads **frontend in `app/`, infra in `lib/`, persistence in `db/`**. Drizzle is not under `lib/` — it has its own top-level tree. Zod schemas live in `validators/`, never inside services or routes.

```
pickleRUNS/
├── src/
│   ├── app/
│   │   ├── page.tsx                        Landing
│   │   ├── (auth)/                         Login, signup — route group (URLs: /login, /signup)
│   │   │   ├── login/
│   │   │   ├── signup/                     incl. signup/confirm (check-your-email screen)
│   │   │   └── actions.ts                  "use server" — Supabase auth SDK direct (the only exception)
│   │   ├── (protected)/                    Auth-guarded — middleware redirects guests
│   │   │   ├── create-run/
│   │   │   ├── dashboard/                  Host dashboard
│   │   │   ├── history/                    All runs for the signed-in host
│   │   │   └── account/
│   │   ├── runs/[code]/
│   │   │   ├── layout.tsx                  Passthrough — no data fetch
│   │   │   ├── join/                       Guest join flow
│   │   │   ├── courts/[courtId]/assign/    Host picks the four players for a court
│   │   │   ├── (host)/results/            Post-run summary — host, no bottom nav
│   │   │   └── (session)/                  Pages with bottom nav
│   │   │       ├── layout.tsx              BottomNav wrapper
│   │   │       ├── game/                   Live game management (tap to score)
│   │   │       ├── queue/                  Queue view
│   │   │       ├── payment/                Court-fee confirmation (host)
│   │   │       ├── lobby/                  Courts dashboard (court cards, Next up, status banner)
│   │   │       └── lobby/[gameId]/         Single game detail
│   │   └── api/                            All HTTP endpoints — thin: auth + Zod + delegate
│   │       ├── auth/                        callback (PKCE) + confirm (email token-hash verify)
│   │       ├── host-requests/              POST request host access
│   │       ├── invites/[token]/            GET invite lookup
│   │       ├── runs/                       POST create run · (GET list)
│   │       │   └── [code]/                 GET run detail
│   │       │       ├── status/
│   │       │       ├── stats/
│   │       │       ├── courts/             GET overview · POST add court
│   │       │       │   └── [courtId]/      DELETE idle court
│   │       │       │       └── fill-proposal/  GET proposed four players
│   │       │       ├── games/              GET list · POST create (assign) game
│   │       │       │   └── [gameId]/       GET detail · PATCH end game
│   │       │       │       └── score/      POST point · PATCH undo (void)
│   │       │       └── queue/              GET queue · POST guest join
│   │       │           └── [entryId]/      PATCH status or paid toggle
│   │       └── users/
│   │           └── me/
│   ├── components/                         Shared UI components
│   ├── hooks/                              Client-side hooks — TanStack Query + Realtime (use-*.ts), e.g. use-courts, use-run-realtime
│   ├── stores/                             Zustand stores — UI-only state ONLY (never API data), e.g. court-assignment.store.ts
│   ├── lib/                                Helpers + clients + infra config ONLY
│   │   ├── api/                            HTTP envelope (client.ts · response.ts)
│   │   ├── env.ts                          Zod-validated env vars (server only, lazy)
│   │   ├── query/                          QueryClient setup
│   │   ├── supabase/                       Browser, server, and middleware clients
│   │   ├── queue-pairs.ts                  pickNextGroup — keeps recent partners together
│   │   ├── resend/                          Resend client (lazy singleton)
│   │   └── utils.ts                        Pure utility helpers
│   ├── services/                           Business logic + DB access (*.service.ts), incl. court.service.ts
│   ├── emails/                             React Email templates (welcome)
│   ├── validators/                         Zod schemas (*.validator.ts) — input source of truth
│   └── types/
│       ├── api.ts                          ApiResponse<T> envelope
│       └── db.ts                           Drizzle inferred types
│   ├── db/                                 Drizzle ORM (NOT lib/)
│   │   ├── index.ts                        Drizzle client (postgres.js, pooler-safe, lazy)
│   │   └── schema/
│   │       ├── index.ts                    Barrel: tables, enums, relations
│   │       ├── enums.ts                    pgEnum definitions
│   │       ├── users.ts
│   │       ├── runs.ts
│   │       ├── courts.ts
│   │       ├── queue-entries.ts
│   │       ├── games.ts
│   │       ├── game-players.ts
│   │       ├── score-events.ts
│   │       └── relations.ts                ALL relations() declarations
│   └── middleware → src/lib/supabase/proxy.ts  (see Auth Model)
├── db/
│   └── migrations/                         node-pg-migrate JS files (NOT under src/)
├── docs/                                   Product brief, schema reference, design notes
├── tools/
│   └── run-pg-migrate.mjs                  Migration runner (loads DIRECT_URL)
├── tailwind.config.ts
├── next.config.ts
└── proxy.ts                                Next.js 15 instrumentation proxy (not auth)
```

## Data Flow

One direction only — never skip a layer.

```
page / client component
  │  TanStack Query hook (src/hooks/use-<thing>.ts)
  ▼
api wrapper (src/lib/api/client.ts)        ← single source of HTTP from the browser
  │  ApiResponse<T> envelope
  ▼
route handler (src/app/api/**/route.ts)    ← thin: auth + Zod + delegate
  │                                          responds with apiSuccess / apiError
  ▼
service (src/services/<thing>.service.ts)  ← ALL business logic + DB access
  │
  ▼
db (src/db, Drizzle) / Supabase
```

**Strict layer rules — no exceptions for app data:**

- **Client components NEVER import from `src/services`, `src/db`, or `src/lib/supabase/{client,proxy}`.** They reach the backend only through `src/hooks` → the api wrapper.
- **Server Components NEVER import from `src/services` or `src/db`.** They reach the backend only through `fetch('/api/...')` parsed as the `ApiResponse<T>` envelope. There is no Server-Component shortcut.
- **Route handlers stay thin:** authenticate (`createClient()` from `src/lib/supabase/server` + `auth.getUser()`), validate with Zod (`safeParse` — never `parse`), delegate to a service, respond with `apiSuccess` / `apiError` / `handleApiError` from `src/lib/api/response.ts`. No business logic, no DB queries, no direct Drizzle.
- **Services own ALL business logic and DB access.** They never touch `Request` / `Response` / `cookies`. They take plain typed inputs (including the authenticated `userId`) and scope every query to that user. Validation does not live here — services trust their inputs.
- **Auth exception:** `src/app/(auth)/actions.ts` calls the Supabase SDK directly to manage auth cookies. It is the only place outside `lib/supabase/` allowed to do so. **App data never uses the Supabase SDK directly.**

**State boundaries:**

- API data → TanStack Query (`src/hooks`). Invalidate on Realtime events; never mirror into `useState` or Zustand.
- UI-only state → Zustand (`src/stores`). Drafts, toasts, drag previews — never API payloads.
- Auth context for the current session → `useSessionUser` hook (TanStack Query, `staleTime: Infinity`).

## Schema Highlights

These invariants are enforced in the database and must be respected by application code:

- **`games.score_a` and `games.score_b` are trigger-maintained.** Never write them from app code — only `score_events` inserts/voids change them.
- **Queue ordering is the integer `position` column.** Read with `ORDER BY position ASC`. Never sort by `joined_at`.
- **Queue rotation is trigger-maintained.** `trg_rotate_queue_on_game_complete` rewrites `queue_entries.position` on every game → `completed` transition per `runs.rotation_style` (`rotate_all`: all four to the back, winners ahead of losers; `winner_stays`: only the losers). It skips `score_only` runs. Never rotate the queue from app code.
- **`games.court_id` is required.** A court has at most one `pending`/`active` game (`uq_games_court_open`), and a host has at most one open run (`uq_runs_one_open_per_host`).
- **Scoring is rally scoring.** One `score_events` row = one point (`points = 1`); undo sets `voided_at`. `game_winner` is `team_a` | `team_b` | NULL — no tie, no clock.
- **Never hard-delete `queue_entries` with game history.** `game_players` and `score_events` have `ON DELETE RESTRICT`. Set `status = 'removed'` instead.
- **`users.id` mirrors `auth.users.id`.** The row is created by trigger, not by the app.
- **`session_code` is the public identifier for a run.** URLs use `[code]`, not `[id]`.

## Setup

1. Install dependencies
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DIRECT_URL`) and, only if you need transactional email, your Resend credentials (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`) — missing Resend vars no longer break DB routes

3. Apply the database migrations
   ```bash
   npm run db:migrate
   ```

4. Start the dev server
   ```bash
   npm run dev
   ```

App runs at [localhost:3000](http://localhost:3000).

## Migrations

Drizzle Kit is **not used**. Migrations are JS files in `db/migrations/` (project root — not under `src/`), applied via `node-pg-migrate` against `DIRECT_URL`. `src/db/` is the Drizzle source-of-truth only.

```bash
# Scaffold a new migration
npm run db:migrate:create -- <description>

# Apply pending migrations
npm run db:migrate

# Roll back the last migration
npm run db:migrate:down
```

- Never edit a migration file after it has been applied — write a new one.
- Keep `src/db/schema/<table>.ts` in sync with migration changes manually.
- RLS policies and triggers go in migration files using `pgm.sql()`.
- `supabase/migrations/` contains legacy SQL files (already applied) — do not touch.
- Runner script: `tools/run-pg-migrate.mjs` — loads `DIRECT_URL` from `.env`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on `0.0.0.0:3000` |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:migrate:down` | Roll back the last migration |
| `npm run db:migrate:create -- <desc>` | Scaffold a new migration file |

## Auth Model

| Role | Account | Access |
|---|---|---|
| Host | Required | Full control — create run, manage courts and queue, score |
| Player | Guest (optional) | Join queue, view live score |
| Spectator | Guest | Read-only |

- New hosts confirm their email before first sign-in. Signup lands on a check-your-email screen (`/signup/confirm`); the confirmation link is verified by `/api/auth/confirm` (token-hash) or `/api/auth/callback` (PKCE), which then fire a one-time welcome email via Resend (`src/services/email.service.ts`), gated by `users.welcome_sent_at` so it sends exactly once.
- `src/lib/supabase/proxy.ts` is the auth enforcement layer — it refreshes the session on every request and redirects unauthenticated users away from `/create-run`, `/history`, `/account`.
- `(protected)/layout.tsx` is a pure passthrough — do not add auth checks here.
- In API routes, authenticate with `createClient()` from `src/lib/supabase/server` + `auth.getUser()`. Pass the resolved `userId` to the service. The service scopes every query to that `userId` (or to a `runId` that the route has already resolved to be owned by `userId`).
- RLS enforces authorization at the DB level as a second line — do not re-implement access checks in services, but do pass `userId` in so the service can scope its queries.
- Guest mutations (join queue) go through API routes — RLS `WITH CHECK (true)` allows them.

## UI Priorities

This is a **mobile-first web app** — players use it on their phones at the court.

- Always design for mobile first. Tailwind: start with base (mobile) styles, add `md:` / `lg:` breakpoints only for desktop enhancement.
- Touch targets minimum 44px. Tap-friendly spacing.
- Bottom nav is the primary navigation — do not replace with sidebars or top-heavy layouts.
- Avoid hover-only interactions — use tap/press states.
- Desktop layout is a nice-to-have, not a requirement.

## Authoritative Source

For full project rules (data flow, schema invariants, migration rules, what-not-to-do), see [CLAUDE.md](./CLAUDE.md). It is the single source of truth — README points to it for anything that could drift.

## References

> `docs/references/*.html` are legacy basketball-era static design mockups, kept for visual reference only. They do not describe the current product.

- Authoritative project rules: [CLAUDE.md](./CLAUDE.md)
- Agent entry point: [AGENTS.md](./AGENTS.md) (defers to CLAUDE.md)
- Product brief: [`docs/ballruns-product-brief.md`](./docs/ballruns-product-brief.md)
- Schema reference: [`docs/ballruns-schema.md`](./docs/ballruns-schema.md)
