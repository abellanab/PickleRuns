# PickleRuns — Product Brief

## What It Is

PickleRuns is a live pickleball doubles court manager built for how open play actually works. The host manages the courts from their phone, everyone else watches live from their browser. No app install required, minimal friction for players.

---

## The Problem

Open play is informal but it still needs organizing — who is next on which court, what is the score, who partners with whom. Right now this is done by memory, shouting, or a paddle stack at the net. Players who have not arrived yet have no idea what is happening. There is no record of anything.

---

## The Solution

A web app where the host creates a run, shares a QR code, and manages the entire session from one screen. Players scan to join the queue. Everyone can see the live score, which courts are in play, who is next up, and where they are in the queue.

---

## Users

| Role | Access | Account |
|---|---|---|
| Host | Full control — courts, queue, scoring | Required |
| Player | Joins queue, sees live scores and their place in line | Guest (optional account) |
| Spectator | Read-only live view | Guest |

Guests who create an account start tracking their stats from signup onwards. No backfilling of guest history.

A host has at most one open (lobby or active) run at a time.

---

## Data Structure

```
Run
├── id, name, location
├── run mode (score only / queue only / score and queue)
├── rotation style (stacking / winner stays)
├── courts (1–8)
├── score goal (11 or 15)
├── win by two (on/off)
├── session code (public, for QR)
├── queue [ ...players (each: name, paid?) ]
└── Games                              (each belongs to exactly one court)
    ├── Game 1
    │   ├── court
    │   ├── goal
    │   ├── Side A [ ...1–2 players ]
    │   ├── Side B [ ...1–2 players ]
    │   ├── score A, score B
    │   └── winner (Side A, Side B, or none)
    ├── Game 2
    └── ...
```

Every player must give a name.

---

## Core Features

### Creating a Run
- Host signs in, sets a name, optional location, run mode, number of courts, score goal, and win-by-two
- Rotation style applies to runs that use a queue
- These settings apply to every game in the run — there is no per-game setup step
- Session code is generated, QR is immediately live

### Run Modes
- **Score only** — no queue. The host sets the matches on each court and scores them
- **Queue only** — a paddle-stack queue with court rotation, no points. The host ends each match and picks the winner when it is needed
- **Score and queue** — both

### Rotation Styles
- **Stacking** — all four players go to the back of the queue, winners ahead of losers
- **Winner stays** — only the losing side goes to the back; the winners keep their places

Rotation is done by the database when a game completes, never by the app. Pairs that just played stay partners when they are drawn into the next game.

### Courts
- A run has one or more courts (up to 8), shown as cards on the courts dashboard
- Each court holds at most one game at a time
- The host can add a court or remove an idle court during the run

### Queue
- Players scan QR or enter session code at any point during the run, type their name, and land at the back of the queue (the host can also add players)
- One ordered queue per run, ordered by position
- Auto-updates after each game based on the rotation style

### Queue Management
- Dedicated page accessible throughout the entire run via bottom nav

Host actions per player:
- **Mark Out** — player stepped away; greyed out but stays in the list in case they return
- **Reinstate** — bring a marked-out player back into the queue
- **Remove** — gone for good, taken off entirely

### Court Fees
- A dedicated payment view lists everyone in the run with a paid / unpaid toggle
- The host marks each player paid as they collect the court fee
- Paid status is tracked per player and is independent of their queue status — marking someone out or removing them never clears the record that they paid

### Filling a Court
- The host opens a court and the app proposes the next four players from the queue (Fill proposal), keeping partners who just played together
- The host can adjust the players before confirming
- Confirming creates the game and it starts immediately — assignment is start

### During a Game
- Rally scoring: the host taps a player and the tapped player's side gets exactly one point
- Undo removes the last point (it is voided, not deleted)
- All connected viewers see the score update live
- No clock and no time limit
- Late arrivals can scan the QR and join the queue at any time

### Ending a Game
- The game ends automatically when a side reaches the score goal (and leads by 2 if win-by-two is on)
- In queue-only runs the host ends each match and chooses the winner when needed; a tied game under winner stays needs a winner chosen
- The queue updates by itself and the court is free for the next group

### Courts Dashboard (Lobby)
- Available to anyone who joined the run
- Court cards show the live game or an idle court, plus a Next up strip and a player status banner
- Tap a game to see full details

### Run History
- Account holders can view all their past runs
- Each run shows all games and scores

---

## Realtime

One live channel per run keeps games, courts, the queue, and the run itself in sync for every connected viewer. There is no polling and no client-held score state.

---

## Auth Model

```
Host        → account required to create a run
Player      → guest, name only, no account needed
Spectator   → guest, read only, no account needed
```

When a guest creates an account, their previous guest scores are not backfilled. Stats are tracked from signup onwards.

New hosts confirm their email before signing in: signup sends a confirmation link and lands on a check-your-email screen. Confirming the link verifies the account and triggers a one-time welcome email. A signed-in user can request host access from the avatar menu or the Account page; the request needs a display name.

---

## Screens

```
Landing
└── Create a Run / Join a Run

Sign Up / Log In
└── only when creating a run

Check Your Email
└── after signup — confirmation link sent, verify before sign-in

Create Run
└── name, location, run mode, rotation style, courts, score goal, win by two
    → session code generated

Courts Dashboard (Lobby)
└── court cards, Next up, player status banner; QR for the host

Court Assignment — Host   (courts/[courtId]/assign)
└── proposed four players, adjust, confirm → game starts

Bottom Nav (persistent during a run)
├── Game
├── Queue
└── Lobby

Queue Page — Host
└── per-player: mark out, reinstate, remove

Queue Page — Player / Spectator
└── read-only, see the full queue

Payment — Host
└── roster with paid / unpaid toggle per player

Game — Host View
└── live score, tap to score, undo, end game

Game — Spectator / Player View
└── live score, position in queue

Past Game View (lobby/[gameId])
└── final score and winner

Run Results — Host
└── post-run summary

Run History — Account holders
└── all past runs and their games

Account
└── profile and host request
```

---

## Intentionally Out of Scope

- Game clock and time limits
- Point systems and serving tracking
- Ties
- Tournament brackets
- Co-hosts or host transfer
- Grouping players in queue together
