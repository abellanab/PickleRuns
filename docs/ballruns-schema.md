# PickleRuns — Database Behavior

> **Tables, columns, types, defaults, FKs, indexes, and enum values: see the
> Drizzle schema under [`src/db/schema/`](../src/db/schema/) — that is the source
> of truth.** One file per table (`runs.ts`, `queue-entries.ts`, `games.ts`,
> `game-players.ts`, `score-events.ts`, `courts.ts`, `users.ts`,
> `host-requests.ts`, `invites.ts`), plus `enums.ts` for enum values and
> `relations.ts` for all `relations()` declarations.
>
> This document covers only what the schema files *can't* encode: triggers, the
> Realtime publication, RLS policy shape, how scores are derived, and the design
> decisions behind them. If you're looking for "what columns does table X
> have," read the schema files, not this one.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Enum Semantics](#enum-semantics)
3. [Scoring — Event Sourced](#scoring--event-sourced)
4. [Triggers](#triggers)
5. [Courts and Open Games](#courts-and-open-games)
6. [Queue Ordering](#queue-ordering)
7. [Realtime Publication](#realtime-publication)
8. [Row Level Security](#row-level-security)
9. [Key Design Decisions](#key-design-decisions)

---

## Architecture Overview

PickleRuns (pickleball doubles court management) has three roles — **Host**, **Player**, **Spectator**. The host is the
only authenticated user; players and spectators are guests who join via session
code. URLs use the public `session_code` (`runs/[code]`), never the run UUID.

All live updates flow through Supabase Realtime. No client holds local score
state — every client derives its view from the database. When the host scores, a
row is inserted into `score_events`; a trigger recomputes `games.score_a` /
`score_b` in the same transaction; Realtime broadcasts the updated `games` row.

### Relationships

```
users ──< runs ──< courts ──< games >── game_players >── queue_entries
            │                     │                            │
            └──< queue_entries    └──< score_events >──────────┘
```

- `runs.host_id → users.id` (RESTRICT)
- `courts.run_id → runs.id` (CASCADE); `(run_id, number)` is unique
- `games.court_id → courts.id` (RESTRICT, **NOT NULL**) — a court with game history cannot be deleted
- `queue_entries.run_id → runs.id` (CASCADE), `queue_entries.user_id → users.id` (SET NULL, null for guests)
- `game_players` / `score_events` → `queue_entries.id` is **RESTRICT** — an entry with game history can never be hard-deleted. Removal is always `status = 'removed'`, never a DELETE.

---

## Enum Semantics

Values live in schema.ts. What each value *means* / *drives*:

### `run_mode` — what the run does

| Value | Behavior |
|---|---|
| `score_only` | No queue. The host sets the matches per court and scores them. The rotation trigger does nothing. |
| `queue_only` | Paddle-stack queue plus court rotation, no points. The host ends each match and picks the winner when needed. |
| `score_and_queue` | Both (default). |

### `rotation_style` — drives queue rotation on game completion

| Value | Behavior |
|---|---|
| `rotate_all` | All four players go to the back, winners ahead of losers (default) |
| `winner_stays` | Only the losing side goes to the back; winners keep their positions |

A game with a NULL winner rotates all four players in either style, keeping
their old relative order. See [Triggers](#triggers).

### Other run settings

`runs.court_count` (>= 1), `runs.score_goal` (default 11; the app offers 11 or
15), `runs.win_by_two` (default false). Each game copies `score_goal` at creation.

### `game_winner`

`team_a` · `team_b`. NULL until the game ends, and it stays NULL when a
`queue_only` match is ended without a winner. There is no `tie` value. The DB
values stay `team_a` / `team_b`; the UI labels them Side A / Side B.

### Status enums

- `run_status`: `lobby → active → completed` (runs are created as `lobby`)
- `game_status`: `pending → active → completed` (a game is created `active` when its court is assigned)
- `queue_entry_status`: `waiting` (in queue) · `marked_out` (stepped away, reinstatable) · `removed` (gone for the day, excluded from all queue ops)

---

## Scoring — Event Sourced

`score_events` is the source of truth. Each point scored inserts one row carrying
`points = 1` (rally scoring: each tap is one point for the tapped player's side). Undo is a **soft void** (`voided_at = NOW()`),
never a delete. `games.score_a` / `score_b` are a denormalized cache, **never
written by application code** — only the sync trigger writes them.

Derived values (computed as `SUM(points)`, which equals the count of live events):

| Value | Query |
|---|---|
| Team A live score | `SUM(points) WHERE game_id = ? AND team = 'team_a' AND voided_at IS NULL` |
| Team B live score | `SUM(points) WHERE game_id = ? AND team = 'team_b' AND voided_at IS NULL` |
| Player points | `SUM(points) WHERE queue_entry_id = ? AND game_id = ? AND voided_at IS NULL` |
| Games played | `COUNT(*)` of `game_players` rows joined to `games` where `status = 'completed'` — there is **no stored counter** |
| Score log | `SELECT * WHERE game_id = ? AND voided_at IS NULL ORDER BY created_at DESC` |

---

The game ends automatically when a side reaches `score_goal` (and leads by 2
when `win_by_two`) — this check lives in the game service, not the database.
There is no clock, time limit, or point system.

---

## Triggers

All trigger functions are `SECURITY DEFINER SET search_path = public` so they can
write past RLS, and run inside the caller's transaction (atomic, no gap).

### `trg_score_events_update_game_score` → `sync_game_score()`

- Fires: `AFTER INSERT OR UPDATE OF voided_at ON score_events`
- Action: recomputes `games.score_a` / `score_b` as `COALESCE(SUM(points), 0)` per team over non-voided events. Insert raises the score; voiding lowers it; all clients self-correct via Realtime.
- Why a trigger, not an edge function: an edge function would leave a window where the cache is stale, and a permanent inconsistency if it failed. The trigger commits with the event or not at all.

### `trg_rotate_queue_on_game_complete` → `rotate_queue_on_game_complete()`

- Fires: `AFTER UPDATE OF status ON games`, only on the first `OLD.status <> 'completed' → NEW.status = 'completed'` transition.
- Does nothing for `score_only` runs. Otherwise takes `pg_advisory_xact_lock(hashtext(run_id::text), 2)` — the same key `joinQueue` uses — so concurrent court completions and joins serialize and positions never collide.
- Action: rewrites `queue_entries.position` to append the rotated players after the current max position (non-`removed` entries). `rotate_all` rotates all four players, winners first then losers, keeping old relative order within each group; `winner_stays` rotates the losing side only (winners keep their positions); a NULL winner rotates everyone in old order. `removed` entries never move. Courts finishing in any order yield completion order.
- **This is the single source of truth for rotation.** It fires on *every* completion path — host "End game" and score-to-goal auto-complete. Never rotate the queue from application code.
- Pairs that just played stay partners when drawn into the next game. This is app logic (`pickNextGroup` in `src/lib/queue-pairs.ts`; partner derived from the most recent game), not a trigger.

### `trg_stamp_host_request_decision` → `stamp_host_request_decision()`

- Fires: `BEFORE UPDATE OF status ON host_requests`.
- Action: sets `decided_at = now()` when status moves from `pending` to `approved` or `denied`. `host_requests.display_name` is required.

---

## Courts and Open Games

- `runs.court_count` rows exist in `courts` per run (`number` unique per run, `name` optional). The host can add courts (max 8) and remove idle courts; the last court, an occupied court, and a court with game history cannot be removed.
- `uq_games_court_open` is a partial unique index on `games (court_id) WHERE status IN ('pending','active')` — a court has at most one open game.
- `uq_runs_one_open_per_host` is a partial unique index on `runs (host_id) WHERE status IN ('lobby','active')` — a host has at most one open run.
- The pg_cron job `expire-timed-games` was unscheduled in the pickleball conversion; there is no timed expiry.

---

## Queue Ordering

The queue is ordered by the integer column `queue_entries.position` — **lower =
front**. Read order with `ORDER BY position ASC`. (The original `after_entry_id`
linked list was dropped in migration `1781020049924`; positions were backfilled
from the list.)

- **Join**: new entry takes `MAX(position) + 1` under a per-run advisory lock so concurrent joins can't collide.
- **Rotation**: handled exclusively by `trg_rotate_queue_on_game_complete` (above). Names are required for every player (`display_name` NOT NULL).
- **Removal**: set `status = 'removed'` — never DELETE (RESTRICT FKs on game history).

---

## Court Fee Tracking

`queue_entries.paid` (boolean, default `false`) records whether a player has paid
the run's court fee. It is plain application state — no trigger, no derivation:

- The host toggles it from the payment confirmation view via the queue-entry
  PATCH route, which accepts **either** a `status` change **or** a `paid` toggle
  (the two are a discriminated union — a mixed payload is rejected 400).
- It is orthogonal to `status`: a `marked_out` or `removed` player keeps whatever
  `paid` value they had, so the host doesn't lose the record of a collected fee.
- RLS: update is host-of-the-run only (same policy as every other
  `queue_entries` update), so guests can never mark themselves paid.

---

## Welcome Email (One-Time)

`users.welcome_sent_at` (timestamptz, nullable) gates the transactional welcome
email so it sends exactly once per account, even under concurrent email-link hits:

- On the first verified signup confirmation — either `/api/auth/callback` (PKCE)
  or `/api/auth/confirm` (token-hash) — the email service runs an atomic claim:
  `UPDATE users SET welcome_sent_at = now() WHERE id = ? AND welcome_sent_at IS NULL RETURNING id`.
  Only the row returned proceeds to send; concurrent verifications (link
  prefetchers, double taps) lose the claim and skip — no read-then-write gap.
- The claim commits **before** the Resend send, so a failed send is a missed
  welcome email (the safe failure), never a duplicate.
- Plain server state written by the email service via Drizzle — no trigger, no
  derivation. Recovery and magic-link verifications never re-trigger it because
  the column is already set.

---

## Realtime Publication

Migration `enable-realtime-tables` adds `games`, `queue_entries`, `courts`, and
`runs` to the `supabase_realtime` publication (when it exists) and sets
`courts` to `REPLICA IDENTITY FULL`. The client uses one Realtime channel per run
(`use-run-realtime`) over those four tables. A new table must be added to the
publication by its own migration before it can be subscribed to.

---

## Row Level Security

Original policy SQL: `supabase/migrations/0003_rls.sql` (legacy, already applied — do
not edit); the `courts` policies are in migration `pickleball-phase-a-schema`.
Intended access shape (`host_requests` and `invites` policies are defined in
their own migrations and not summarized here):

| Table | Read | Insert | Update |
|---|---|---|---|
| `users` | Own row (authenticated) | — (trigger-created) | Own row |
| `runs` | Authenticated: own run or a run they have an entry in · Anon: **all** (QR lookup by code) | Host (`host_id = auth.uid()`) | Host |
| `queue_entries` | **Anyone** (guests/spectators need the list) | **Anyone** (guest join, `WITH CHECK true`) | Host of the run only |
| `courts` | Anyone | Host of the run | Host of the run (delete: host of the run) |
| `games` | Anyone | Host of the run | Host of the run |
| `game_players` | Anyone | Host of the run | — (immutable) |
| `score_events` | Anyone | Host of the run | Host of the run (undo / `voided_at`) |

The score-sync and rotation triggers run `SECURITY DEFINER` and intentionally
bypass RLS — they are the only writers to `games.score_a/score_b` and to
trigger-driven `queue_entries.position`.

---

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Score storage | Event sourcing via `score_events` (`points = 1` per tap) | Always derivable — survives refresh, reconnect, undo with no client state |
| Score cache | Denormalized `score_a` / `score_b` on `games` | Cheap reads for feed/results without aggregating every event per request |
| Cache sync | DB trigger (`SUM(points)`) | Atomically consistent; an edge function would leave a stale window |
| Queue ordering | Integer `position` | Simple `ORDER BY`; rotation is a bounded `UPDATE` driven by one trigger |
| Queue rotation | Trigger on game completion | One source of truth shared by host "End game" and score auto-complete — no path can skip it |
| Multi-court | `courts` table + partial unique index on open games | The database guarantees one open game per court, even under concurrent assignment |
| Guest players | Nullable `user_id` | Join with a name only — no friction; account linking is optional |
| Undo | Soft void via `voided_at` | Non-destructive; trigger recounts and the score self-corrects |
| Hard-delete prevention | `ON DELETE RESTRICT` on game-history FKs | No orphaned game records; removals are logical (`status`), never physical |
| Welcome email | One-time via `users.welcome_sent_at` atomic claim | Exactly-once send under concurrent confirmation clicks; claim-before-send favors a missed email over a duplicate |
