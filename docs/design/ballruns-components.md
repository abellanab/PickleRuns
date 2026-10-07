# PickleRuns — Component Reference

> **Note.** The shipped HTML mockups this file documents (`docs/references/*.html`) are legacy basketball-era mockups kept for visual reference. Components marked **Legacy** below describe features that no longer exist in PickleRuns (game clock, time limit, team assignment screen, run format). Pickleball uses rally scoring (one point per tap), a courts dashboard, and `courts/[courtId]/assign` for filling a court.

> Source of truth for all components built across all screens. Every component here exists in a shipped HTML file. Nothing assumed. Do not add components that haven't been built yet.

**Screens covered:** `BallRuns-game.html`, `BallRuns-lobby-host.html`, `BallRuns-team-assignment.html`, `BallRuns-results.html`, `BallRuns-spectator.html`, `BallRuns-feed.html`, `BallRuns-create-run.html`, `BallRuns-landing.html`, `BallRuns-queue.html`

---

## Page Shell

Every screen shares the same base structure.

### Body / Global Reset

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  background: var(--bg);
  color: var(--text-primary);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
```

### Noise Texture

Applied via `body::before`. Fixed, full-screen, pointer-events off. Never remove this — it's what makes the background feel physical rather than flat.

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
  opacity: 0.6;
}
```

### App Container

```html
<div class="app">
  <!-- all screen content goes here -->
</div>
```

```css
.app {
  position: relative;
  z-index: 1;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
}
```

`dvh` (dynamic viewport height) is intentional — it accounts for mobile browser chrome correctly.

### Court Arc (Landing only)

A subtle full-bleed arc on `body::after` that references the three-point line. Used only on the Landing screen to give the background atmosphere without decoration.

```css
body::after {
  content: '';
  position: fixed;
  bottom: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  border-radius: 50%;
  border: 1px solid var(--border);
  pointer-events: none;
  z-index: 0;
  opacity: 0.6;
}
```

### Page Load Animation

Every new screen fades up from `translateY(8px)`. Apply staggered `animation-delay` values to major sections in order of visual hierarchy. Base delay increments: ~30–40ms per section.

```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Example stagger */
.topbar         { animation: fade-up 0.3s 0.00s ease-out both; }
.scoreboard     { animation: fade-up 0.3s 0.06s ease-out both; }
.clock-bar      { animation: fade-up 0.3s 0.10s ease-out both; }
.score-progress { animation: fade-up 0.3s 0.13s ease-out both; }
.section-header { animation: fade-up 0.3s 0.16s ease-out both; }
.teams-container{ animation: fade-up 0.3s 0.19s ease-out both; }
.bottom-bar     { animation: fade-up 0.3s 0.22s ease-out both; }
```

### Scrollbar

Applied globally. Always use this — never leave default browser scrollbar.

```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
```

---

## 1. Topbar

The persistent header. Present on every screen. Left side: context (what run, what screen). Right side: status badge + actions (max 2).

### HTML

```html
<div class="topbar">
  <div class="topbar-left">
    <span class="run-label">Friday Run</span>
    <span class="run-name">Rucker Park</span>
  </div>
  <div class="topbar-right">
    <span class="game-badge">Game 3</span>
    <button class="icon-btn" title="Share / QR">
      <!-- inline SVG -->
    </button>
  </div>
</div>
```

### CSS

```css
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.run-label {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.run-name {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--text-primary);
  line-height: 1;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
```

### Rules

- `.run-label` is the secondary line — use it for context like "Friday Run", "Game 3 of 5", "Waiting", etc.
- `.run-name` is always the location or run name — the primary identity of the session.
- Right side should never exceed 2 elements.

---

## 2. Game Badge

A small pill that sits in the topbar right. Two variants: accent (live/active) and muted (inactive/past).

### HTML

```html
<!-- Active / live state -->
<span class="game-badge">Game 3</span>

<!-- Muted / past state — used on Results screen -->
<span class="game-badge muted">Game 3</span>
```

### CSS

```css
.game-badge {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  background: var(--accent-glow);
  border: 1px solid var(--border-accent);
  padding: 4px 10px;
  border-radius: 4px;
}

/* Muted variant — game is over */
.game-badge.muted {
  color: var(--text-secondary);
  background: var(--bg-surface);
  border-color: var(--border);
}
```

### Rules

- Accent variant: live game, active session, current state.
- Muted variant: completed game (Results screen).
- `border-radius: 4px` — intentionally tighter than `--radius-sm`.

---

## 3. Live Badge

Variant of Game Badge used on Spectator and Feed screens. Includes a pulsing dot to signal active connection.

### HTML

```html
<span class="live-badge">
  <span class="live-dot"></span>
  Live
</span>
```

### CSS

```css
.live-badge {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  background: var(--accent-glow);
  border: 1px solid var(--border-accent);
  padding: 4px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: live-pulse 1.8s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1;   transform: scale(1);   }
  50%       { opacity: 0.4; transform: scale(0.7); }
}
```

### Rules

- Only used when the session is live and the viewer is read-only (Spectator, Feed).
- The Game Badge is used for the host (interactive) screens. The Live Badge is for viewers.

---

## 4. Icon Button

A square tap target for a single icon action. Used in the topbar right.

### HTML

```html
<button class="icon-btn" title="Share / QR">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <!-- path data -->
  </svg>
</button>
```

### CSS

```css
.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.icon-btn:hover {
  border-color: var(--accent-dim);
  color: var(--accent);
  background: var(--accent-glow);
}

.icon-btn svg { width: 16px; height: 16px; }
```

### SVG Icon Rules

All icons: `fill="none"`, `stroke="currentColor"`, `stroke-width="2.5"`, `stroke-linecap="round"`, `stroke-linejoin="round"`. Never fill-based. Never a third-party icon library.

---

## 5. Scoreboard

The dominant visual element on game screens. Structured as a 3-column grid: Team A / separator / Team B.

Two size variants: **host** (smaller, leaves room for controls) and **spectator** (larger, pure reading).

### HTML

```html
<div class="scoreboard">
  <div class="score-row">
    <div class="team-block">
      <span class="team-label">Runs</span>
      <span class="score-number" id="score-a">14</span>
      <span class="score-goal">to 21</span>
    </div>
    <div class="score-separator">
      <span class="separator-dash">—</span>
    </div>
    <div class="team-block">
      <span class="team-label">Next</span>
      <span class="score-number" id="score-b">11</span>
      <span class="score-goal">to 21</span>
    </div>
  </div>
</div>
```

### CSS

```css
.score-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 8px 0 4px;
  gap: 8px;
}

.team-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.team-label {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* Host view */
.score-number {
  font-family: var(--font-display);
  font-size: clamp(96px, 22vw, 160px);
  font-weight: 900;
  line-height: 0.88;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  transition: transform 0.08s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.15s;
  user-select: none;
}

/* Spectator view — bigger */
.score-number.spectator {
  font-size: clamp(110px, 28vw, 180px);
}

.score-number.scored {
  color: var(--accent);
  transform: scale(1.06);
}

.score-goal {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.separator-dash {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 900;
  color: var(--text-muted);
  line-height: 1;
  letter-spacing: -0.04em;
}
```

### Score Event (JS)

```js
scoreEl.classList.add('scored');
setTimeout(() => scoreEl.classList.remove('scored'), 300);
```

---

## 6. Clock Bar

> **Legacy (basketball-era).** PickleRuns has no game clock or time limit; this component is not used.

Present only when the game has a time limit. Hidden entirely when there's no clock — do not render an empty bar.

### HTML

```html
<div class="clock-bar">
  <span class="clock-display" id="clock">12:47</span>
  <div class="clock-controls">
    <button class="clock-btn running" id="clock-btn">Pause</button>
  </div>
</div>
```

### CSS

```css
.clock-bar {
  margin: 0 20px 4px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.clock-display {
  font-family: var(--font-display);
  font-size: 42px;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: var(--accent);
  line-height: 1;
}

.clock-display.warning {
  color: #ff6b35;
  animation: pulse-warn 0.8s ease-in-out infinite;
}

@keyframes pulse-warn {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

.clock-btn {
  height: 38px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-hover);
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.12s;
}

.clock-btn.running {
  background: var(--accent-glow);
  border-color: var(--border-accent);
  color: var(--accent);
}
```

### Rules

- Clock is accent at rest, orange-red (`#ff6b35`) with pulse when ≤ 60 seconds.
- On spectator screens: clock is display-only — no Pause button rendered.

---

## 7. Score Progress Bar

Dual-fill bar showing each team's progress toward goal. Grows from opposite ends with a center gap.

### HTML

```html
<div class="score-progress">
  <div class="progress-labels">
    <span class="progress-label">Runs — 14</span>
    <span class="progress-goal">Goal: 21</span>
    <span class="progress-label">11 — Next</span>
  </div>
  <div class="progress-track">
    <div class="progress-fill-a" id="progress-a"></div>
    <div class="progress-fill-b" id="progress-b"></div>
  </div>
</div>
```

### CSS

```css
.progress-track {
  height: 5px;
  background: var(--bg-surface);
  border-radius: 3px;
  display: flex;
  gap: 3px; /* the court center line motif */
}

.progress-fill-a {
  height: 100%;
  border-radius: 3px 0 0 3px;
  background: var(--accent);
  transition: width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.progress-fill-b {
  height: 100%;
  border-radius: 0 3px 3px 0;
  background: var(--text-secondary);
  transition: width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Width Calculation (JS)

```js
const half = 47; // max % per side — remaining 6% is the gap
document.getElementById('progress-a').style.width =
  `calc(${Math.min(scoreA, goal)} / ${goal} * ${half}%)`;
document.getElementById('progress-b').style.width =
  `calc(${Math.min(scoreB, goal)} / ${goal} * ${half}%)`;
```

---

## 8. Section Header

A lightweight label row that names a content section. Optionally includes a right-aligned text action.

### HTML

```html
<!-- Label only -->
<div class="section-header">
  <span class="section-title">Recent</span>
</div>

<!-- Label + action -->
<div class="section-header">
  <span class="section-title">Tap to score</span>
  <button class="section-action">Edit teams</button>
</div>

<!-- Label + count pill (Queue screen) -->
<div class="section-header">
  <span class="section-title">
    Up Next
    <span class="section-count">5</span>
  </span>
</div>
```

### CSS

```css
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 10px;
}

.section-title {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-action {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent-dim);
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}

/* Inline count badge — used in Queue screen */
.section-count {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  padding: 2px 7px;
  border-radius: 3px;
}

/* Active state — On Court section */
.section-count.active {
  color: var(--accent-dim);
  background: var(--accent-glow);
  border-color: var(--border-accent);
}
```

---

## 9. Score Log

Live feed of the last 3 scoring events. New entries prepend to top. Max 3 visible.

### HTML

```html
<div class="score-log" id="log">
  <div class="log-entry">
    <div class="log-team-dot a"></div>
    <span class="log-text">Marcus scored</span>
    <span class="log-score">14 – 11</span>
  </div>
</div>
```

### CSS

```css
.score-log {
  margin: 0 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bg-surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  animation: slide-in 0.2s ease-out;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.log-team-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.log-team-dot.a { background: var(--accent); }
.log-team-dot.b { background: var(--text-secondary); }

.log-text {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
  flex: 1;
}

.log-score {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}
```

### JS — Add entry, maintain 3-item cap

```js
function addLog(team, name) {
  const log = document.getElementById('log');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `
    <div class="log-team-dot ${team}"></div>
    <span class="log-text">${name} scored</span>
    <span class="log-score">${scores.a} – ${scores.b}</span>
  `;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 3) log.removeChild(log.lastChild);
}
```

---

## 10. Teams Container + Team Column

Two-column grid for player cards on the Game and Team Assignment screens.

### HTML

```html
<div class="teams-container">
  <div class="team-column">
    <div class="team-col-header a">Runs</div>
    <!-- player cards -->
  </div>
  <div class="team-column">
    <div class="team-col-header">Next</div>
    <!-- player cards -->
  </div>
</div>
```

### CSS

```css
.teams-container {
  flex: 1;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  overflow-y: auto;
}

.team-column {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.team-col-header {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2px;
}

.team-col-header.a {
  color: var(--accent-dim);
  border-color: var(--border-accent);
}
```

---

## 11. Player Card

Primary interactive unit for scoring. Tap = point.

### HTML

```html
<div class="player-card" onclick="score('a', this, 'Marcus')">
  <div class="player-info">
    <span class="player-name">Marcus</span>
    <span class="player-pts-label">pts</span>
  </div>
  <span class="player-pts">4</span>
</div>
```

### CSS

```css
.player-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.12s;
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.player-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent-glow);
  opacity: 0;
  transition: opacity 0.12s;
}

.player-card:hover { border-color: var(--border-accent); transform: translateY(-1px); }
.player-card:hover::before { opacity: 1; }
.player-card:active { transform: scale(0.97); border-color: var(--accent); }

.player-card.just-scored {
  border-color: var(--accent);
  animation: score-flash 0.5s ease-out;
}

@keyframes score-flash {
  0%   { background: rgba(200, 241, 53, 0.25); }
  100% { background: var(--bg-surface); }
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  position: relative;
  z-index: 1;
}

.player-name {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-primary);
  line-height: 1.1;
}

.player-pts-label {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.player-pts {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: var(--text-secondary);
  line-height: 1;
  position: relative;
  z-index: 1;
  transition: color 0.15s, transform 0.1s;
}

.player-card.just-scored .player-pts {
  color: var(--accent);
  transform: scale(1.15);
}
```

---

## 12. Bottom Bar

Persistent action bar pinned to bottom of screen. Contains 1–2 buttons. Never more.

### HTML

```html
<div class="bottom-bar">
  <button class="btn-secondary">Undo</button>
  <button class="btn-primary">Start Game</button>
</div>
```

### CSS

```css
.bottom-bar {
  padding: 12px 20px 24px;
  display: flex;
  gap: 10px;
  border-top: 1px solid var(--border);
  margin-top: 12px;
  flex-shrink: 0;
}

/* Primary — forward action */
.btn-primary {
  flex: 1;
  height: 52px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--accent);
  color: var(--bg);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-primary:hover { background: #d4f545; transform: translateY(-1px); }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:disabled {
  background: var(--bg-hover);
  color: var(--text-muted);
  border: 1px solid var(--border);
  cursor: not-allowed;
  transform: none;
}

/* Secondary — reversible / supporting action */
.btn-secondary {
  height: 52px;
  padding: 0 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.btn-secondary:hover { border-color: var(--text-muted); color: var(--text-primary); }

/* Destructive — terminal / irreversible action */
.btn-danger {
  flex: 1;
  height: 52px;
  border-radius: var(--radius-md);
  border: 1px solid #ff4040;
  background: rgba(255, 64, 64, 0.08);
  color: #ff6060;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-danger:hover { background: rgba(255, 64, 64, 0.16); color: #ff8080; }
```

### Button Types

| Class | Semantic | Color | When to use |
|---|---|---|---|
| `.btn-primary` | Forward action | `--accent` bg, `--bg` text | Start Game, Confirm, Next Game |
| `.btn-secondary` | Reversible / supporting | `--bg-surface`, `--text-secondary` | Undo, Back, Add, Lobby |
| `.btn-danger` | Destructive / terminal | Red border + fill | End Game, Remove, Delete |

### Rules

- `padding-bottom: 24px` always — safe area for mobile home indicator.
- `.btn-secondary` does not get `flex: 1` — stays natural width. Primary action takes remaining space.
- Red is exclusively for `.btn-danger`. It appears nowhere else in the app.

---

## 13. QR Block

Used in the Lobby — host view. The hero of the screen, front and center.

### HTML

```html
<div class="qr-block">
  <span class="qr-label">Scan to join</span>
  <div class="qr-frame">
    <!-- QR code SVG -->
  </div>
  <div class="qr-meta">
    <span class="qr-code-label">Session code</span>
    <span class="qr-code-value">RKR-74</span>
  </div>
  <span class="qr-hint">Share this screen or send the code — players join from any browser</span>
</div>
```

### CSS

```css
.qr-block {
  margin: 20px 20px 0;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  position: relative;
  overflow: hidden;
}

/* Accent glow behind QR */
.qr-block::before {
  content: '';
  position: absolute;
  top: -40px; left: 50%;
  transform: translateX(-50%);
  width: 200px; height: 200px;
  background: var(--accent-glow);
  border-radius: 50%;
  filter: blur(40px);
  pointer-events: none;
}

.qr-frame {
  width: 180px; height: 180px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 3px solid var(--bg);
  box-shadow: 0 0 0 1px var(--border-accent);
}

.qr-code-value {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  line-height: 1;
}
```

### Rules

- QR frame has a light `--bg` border and `--border-accent` box-shadow — makes the code visually distinct from the background.
- Session code is always accent-colored, large, and readable at arm's length.

---

## 14. Format Strip

> **Legacy (basketball-era).** `run_format` was removed; PickleRuns shows run mode and rotation style instead.

Compact info row used in the Lobby to show the current run format. Includes a change action.

### HTML

```html
<div class="format-strip">
  <div class="format-left">
    <span class="format-label">Format</span>
    <span class="format-value">Winner Stays</span>
  </div>
  <button class="format-change">Change</button>
</div>
```

### CSS

```css
.format-strip {
  margin: 12px 20px 0;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.format-label {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.format-value {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-primary);
  line-height: 1.1;
}

.format-change {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent-dim);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
```

---

## 15. Queue Item

A row in any queue list. Used in Lobby, Queue page. Variants: standard, in-next, on-court, marked-out.

### HTML

```html
<div class="queue-item" draggable="true" data-id="1">
  <div class="drag-handle"><!-- grip SVG --></div>
  <span class="queue-pos">1</span>
  <span class="queue-name">Marcus</span>
  <span class="queue-games">3 games</span>
  <div class="queue-actions">
    <button class="queue-action-btn" onclick="openCtx(event, 1)"><!-- ⋮ SVG --></button>
  </div>
</div>
```

### CSS

```css
.queue-item {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 11px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  transition: border-color 0.12s, background 0.12s;
  user-select: none;
}

/* Currently playing */
.queue-item.on-court {
  border-color: var(--border-accent);
  background: rgba(200, 241, 53, 0.04);
}

/* In the next game */
.queue-item.in-next .queue-pos { color: var(--accent-dim); }

/* Marked as out — skipped this game */
.queue-item.marked-out {
  opacity: 0.45;
}
.queue-item.marked-out .queue-name {
  text-decoration: line-through;
  text-decoration-color: var(--text-muted);
}

/* New player join flash */
.queue-item.just-joined {
  animation: join-flash 0.6s ease-out;
}

@keyframes join-flash {
  0%   { border-color: var(--accent); background: rgba(200, 241, 53, 0.12); }
  100% { border-color: var(--border); background: var(--bg-surface); }
}

/* Drag states */
.queue-item.dragging  { opacity: 0.35; border-color: var(--border-accent); }
.queue-item.drag-over { border-color: var(--accent-dim); background: var(--bg-hover); transform: translateY(-1px); }

.queue-pos {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.queue-name {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-primary);
  line-height: 1;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.queue-games {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  flex-shrink: 0;
}

.queue-action-btn {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-hover);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s;
}
.queue-action-btn.danger:hover {
  border-color: #ff4040;
  color: #ff6060;
  background: rgba(255, 64, 64, 0.08);
}
.queue-action-btn.accent-btn:hover {
  border-color: var(--accent-dim);
  color: var(--accent);
  background: var(--accent-glow);
}
```

### Rules

- Drag is only available in Up Next and Waiting sections. On Court items are locked — hide drag handle with `.drag-handle.hidden { visibility: hidden; pointer-events: none; }`.
- In read-only mode (Player/Spectator), hide `.drag-handle` and `.queue-actions` entirely.
- `queue-games` is always present but muted — ambient info, not primary.

---

## 16. Stats Strip

Four-cell summary bar. Used at the top of the Queue screen.

### HTML

```html
<div class="stats-strip">
  <div class="stat-item">
    <span class="stat-label">On court</span>
    <span class="stat-value accent">10</span>
  </div>
  <div class="stat-item">
    <span class="stat-label">Up next</span>
    <span class="stat-value">5</span>
  </div>
  <div class="stat-item">
    <span class="stat-label">Waiting</span>
    <span class="stat-value">3</span>
  </div>
  <div class="stat-item">
    <span class="stat-label">Total</span>
    <span class="stat-value">18</span>
  </div>
</div>
```

### CSS

```css
.stats-strip {
  display: flex;
  margin: 14px 20px 0;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 8px;
}

.stat-item + .stat-item { border-left: 1px solid var(--border); }

.stat-label {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  line-height: 1;
}

.stat-value.accent { color: var(--accent); }
```

---

## 17. Context Menu

Per-row action sheet. Triggered by the ⋮ button on queue items. Anchors near the trigger button.

### HTML

```html
<div class="ctx-overlay" id="ctx-overlay" onclick="closeCtx()"></div>
<div class="ctx-menu" id="ctx-menu">
  <div class="ctx-item" onclick="ctxAction('rename')">
    <!-- icon SVG -->
    Rename
  </div>
  <div class="ctx-item" onclick="ctxAction('markout')">
    <!-- icon SVG -->
    Mark Out
  </div>
  <div class="ctx-divider"></div>
  <div class="ctx-item danger" onclick="ctxAction('remove')">
    <!-- icon SVG -->
    Remove
  </div>
</div>
```

### CSS

```css
.ctx-menu {
  position: fixed;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 6px;
  min-width: 160px;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  display: none;
  flex-direction: column;
  gap: 2px;
}

.ctx-menu.visible {
  display: flex;
  animation: ctx-in 0.15s ease-out both;
}

@keyframes ctx-in {
  from { opacity: 0; transform: scale(0.95) translateY(-4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.ctx-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-secondary);
  transition: background 0.1s, color 0.1s;
}

.ctx-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.ctx-item.danger { color: #ff6060; }
.ctx-item.danger:hover { background: rgba(255, 64, 64, 0.08); color: #ff8080; }

.ctx-divider { height: 1px; background: var(--border); margin: 4px 0; }

/* Full-screen invisible overlay — closes menu on outside tap */
.ctx-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  display: none;
}
.ctx-overlay.visible { display: block; }
```

### Rules

- Always pair `.ctx-menu` with `.ctx-overlay` — the overlay handles outside-tap dismissal.
- Position is set dynamically via JS based on the trigger button's `getBoundingClientRect()`.
- Dangerous actions (Remove, Delete) always go below a `.ctx-divider`.

---

## 18. Assignment Card

> **Legacy (basketball-era).** The team assignment screen was replaced by the court assign screen (`courts/[courtId]/assign`).

Draggable player card used on the Team Assignment screen. Different from the Player Card — no tap-to-score, uses drag or arrow button to move between teams.

### HTML

```html
<div class="assign-card" draggable="true">
  <div class="assign-grip"><!-- grip SVG --></div>
  <span class="assign-name">Marcus</span>
  <button class="assign-move" onclick="movePlayer(1, 'b')">
    <!-- chevron SVG -->
  </button>
</div>
```

### CSS

```css
.assign-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 9px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: grab;
  transition: border-color 0.12s, transform 0.12s;
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.assign-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent-glow);
  opacity: 0;
  transition: opacity 0.12s;
}

.assign-card:hover { border-color: var(--border-accent); transform: translateY(-1px); }
.assign-card:hover::before { opacity: 1; }
.assign-card.dragging  { opacity: 0.35; transform: scale(0.97); }
.assign-card.drag-over { border-color: var(--accent-dim); background: var(--bg-hover); transform: translateY(-2px); }

.assign-card.just-moved {
  animation: move-flash 0.35s ease-out;
}

@keyframes move-flash {
  0%   { background: rgba(200, 241, 53, 0.2); border-color: var(--accent); }
  100% { background: var(--bg-surface); border-color: var(--border); }
}

.assign-name {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-primary);
  line-height: 1;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.assign-move {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-hover);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s;
  position: relative;
  z-index: 1;
}
.assign-move:hover { border-color: var(--text-muted); color: var(--text-secondary); }
```

### Rules

- The arrow button (`.assign-move`) is the mobile fallback for drag — always include both.
- Arrow points right (→) for Team A cards (move to B), left (←) for Team B cards (move to A).
- Name uses `ellipsis` truncation — no wrapping.

---

## 19. Balance Bar

> **Legacy (basketball-era).** Belonged to the removed team assignment screen.

Shows team split balance on Team Assignment screen. Updates live as players move.

### HTML

```html
<div class="balance-bar">
  <div class="balance-labels">
    <div class="balance-team">
      <span class="balance-team-name a">Runs</span>
      <span class="balance-count a" id="count-a">5</span>
    </div>
    <span class="balance-vs">vs</span>
    <div class="balance-team" style="align-items: flex-end;">
      <span class="balance-team-name">Next</span>
      <span class="balance-count" id="count-b">5</span>
    </div>
  </div>
  <div class="balance-track">
    <div class="balance-fill-a" id="balance-a"></div>
    <div class="balance-fill-b" id="balance-b"></div>
  </div>
  <span class="balance-status even" id="balance-status">Even split</span>
</div>
```

### Status States

| Diff | Status text | Class |
|---|---|---|
| 0 | "Even split" | `.even` — accent-dim |
| 1 | "Off by one" | default — muted |
| 2+ | "X apart" | `.uneven` — `#ff6b35` |

---

## 20. Option Pills

Single-select group. Used on Create Run for run mode, rotation style, and score goal selection (the original mockup used it for the removed run format).

### HTML

```html
<div class="pill-row" id="format-pills">
  <button class="pill selected" onclick="selectPill('format', this)">
    <svg class="pill-check" ...><polyline points="20 6 9 17 4 12"/></svg>
    Winner Stays
  </button>
  <button class="pill" onclick="selectPill('format', this)">
    <svg class="pill-check" ...><polyline points="20 6 9 17 4 12"/></svg>
    Rotation
  </button>
</div>
```

### CSS

```css
.pill {
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.12s;
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.pill:hover { border-color: var(--text-muted); color: var(--text-primary); }

.pill.selected {
  border-color: var(--border-accent);
  background: var(--accent-glow);
  color: var(--accent);
}

.pill-check { width: 14px; height: 14px; display: none; }
.pill.selected .pill-check { display: block; }
```

### JS

```js
function selectPill(group, btn) {
  btn.closest('.pill-row').querySelectorAll('.pill')
    .forEach(p => p.classList.remove('selected'));
  btn.classList.add('selected');
}
```

---

## 21. Stepper

Numeric +/− input. Used for Score Goal on Create Run.

### HTML

```html
<div class="goal-row">
  <button class="goal-btn" onclick="adjustGoal(-1)">−</button>
  <div class="goal-display">
    <span class="goal-num" id="goal-num">21</span>
    <span class="goal-unit">pts</span>
  </div>
  <button class="goal-btn" onclick="adjustGoal(1)">+</button>
</div>
```

### CSS

```css
.goal-btn {
  width: 44px; height: 44px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s;
  user-select: none;
}
.goal-btn:hover { border-color: var(--text-muted); color: var(--text-primary); }
.goal-btn:active { transform: scale(0.94); }

.goal-num {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 900;
  color: var(--text-primary);
  line-height: 1;
  transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.1s;
}
.goal-num.bump { transform: scale(1.12); color: var(--accent); }
```

### JS

```js
function adjustGoal(delta) {
  goal = Math.max(5, Math.min(50, goal + delta));
  const el = document.getElementById('goal-num');
  el.textContent = goal;
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 200);
}
```

---

## 22. Toggle Switch

On/off toggle. Used for win-by-two on Create Run (the original mockup used it for the removed Game Clock). Reveals dependent content when on.

### HTML

```html
<div class="toggle-row" onclick="toggleTime()">
  <div class="toggle-left">
    <span class="toggle-title">Game clock</span>
    <span class="toggle-sub">Set a time limit per game</span>
  </div>
  <div class="toggle-switch" id="time-switch">
    <div class="toggle-knob"></div>
  </div>
</div>
```

### CSS

```css
.toggle-switch {
  width: 44px; height: 26px;
  border-radius: 13px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  position: relative;
  transition: background 0.2s, border-color 0.2s;
}

.toggle-switch.on { background: var(--accent); border-color: var(--accent); }

.toggle-knob {
  position: absolute;
  top: 3px; left: 3px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s;
}

.toggle-switch.on .toggle-knob {
  transform: translateX(18px);
  background: var(--bg);
}
```

---

## 23. Text Input

Used on Create Run (name, location) and Landing (session code).

### CSS

```css
.text-input {
  width: 100%;
  height: 48px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0 14px;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, background 0.15s;
  caret-color: var(--accent);
}

.text-input::placeholder { color: var(--text-muted); font-weight: 600; }
.text-input:focus { border-color: var(--border-accent); background: var(--bg-hover); }
```

### Code Input Variant (Landing)

Large letter-spacing for session code entry. Auto-formats with dash after 3 chars. Shake animation on wrong code.

```css
.join-input {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.18em;
}

.join-input.error {
  border-color: #ff4040;
  animation: shake 0.4s ease-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}
```

---

## 24. Wordmark

Used on the Landing screen only.

### HTML

```html
<div class="wordmark">
  <span class="wordmark-name">Open<br>Run</span>
  <div class="wordmark-line"></div>
  <span class="wordmark-tagline">Run your game</span>
</div>
```

### CSS

```css
.wordmark-name {
  font-family: var(--font-display);
  font-size: 52px;
  font-weight: 900;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--text-primary);
  line-height: 0.9;
}

/* Accent underline — references court line markings */
.wordmark-line {
  width: 48px;
  height: 3px;
  background: var(--accent);
  border-radius: 2px;
  margin-top: 10px;
}

.wordmark-tagline {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-top: 10px;
}
```

---

## 25. Live Card (Run Feed)

Pinned hero card at the top of the Feed. Always present while a game is active.

### HTML

```html
<div class="live-card">
  <div class="live-card-bar"></div>
  <div class="live-card-inner">
    <div class="live-card-header">
      <span class="live-card-game">Game 4 · In progress</span>
      <span class="live-card-clock" id="clock">12:47</span>
    </div>
    <div class="live-score-row">
      <!-- team blocks with live-score-num -->
    </div>
    <div class="live-progress">
      <div class="live-progress-a" id="progress-a"></div>
      <div class="live-progress-b" id="progress-b"></div>
    </div>
    <div class="live-last-score">
      <div class="live-last-dot a"></div>
      <span class="live-last-text">Marcus scored</span>
      <span class="live-tap-hint">Tap to watch →</span>
    </div>
  </div>
</div>
```

### Key CSS

```css
/* Accent top bar — signals this card is alive */
.live-card-bar { height: 3px; background: var(--accent); width: 100%; }

/* Score numbers inside live card — smaller than full scoreboard */
.live-score-num {
  font-family: var(--font-display);
  font-size: clamp(52px, 14vw, 72px);
  font-weight: 900;
  line-height: 0.88;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  transition: color 0.2s, transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.live-score-num.scored { color: var(--accent); transform: scale(1.08); }

/* Progress — thinner than full bar */
.live-progress { height: 3px; background: var(--bg-hover); border-radius: 2px; display: flex; gap: 2px; }
```

### Rules

- The 3px accent bar at the top is what makes this card feel alive vs a static card.
- Always tappable — leads to the Spectator view.

---

## 26. Past Game Card (Run Feed)

Tappable row for completed games. Stacked layout: game number eyebrow → winner name → duration.

### HTML

```html
<div class="past-card" onclick="...">
  <div class="past-card-main">
    <span class="past-card-num">Game 3</span>
    <span class="past-card-winner">Runs won</span>
    <span class="past-card-detail">18:42</span>
  </div>
  <span class="past-card-score">21–17</span>
  <div class="past-card-chevron"><!-- chevron SVG --></div>
</div>
```

### CSS

```css
.past-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
  position: relative;
  overflow: hidden;
}

.past-card-num {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  line-height: 1;
}

.past-card-winner {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-primary);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.past-card-detail {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.past-card-score {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: var(--text-secondary);
  flex-shrink: 0;
}
```

### Layout Hierarchy

```
GAME 3         ← past-card-num (eyebrow, muted)
Runs won       ← past-card-winner (dominant)
18:42          ← past-card-detail (muted)
                          21–17  ›
```

---

## 27. Queue Position Strip

Player-only strip showing their position in the queue. Hidden for spectators.

### HTML

```html
<div class="queue-position" id="queue-strip">
  <div class="queue-pos-left">
    <span class="queue-pos-label">Your position</span>
    <span class="queue-pos-value">#6 in queue</span>
  </div>
  <span class="queue-pos-status">~1 game away</span>
</div>
```

### States

```css
/* Default */
.queue-position { border: 1px solid var(--border); background: var(--bg-surface); }

/* Up next — accent highlight */
.queue-position.up-next {
  border-color: var(--border-accent);
  background: rgba(200, 241, 53, 0.06);
}
.queue-position.up-next .queue-pos-label { color: var(--accent-dim); }
.queue-position.up-next .queue-pos-value { color: var(--accent); }
```

---

## Component Inventory Summary

| # | Component | Screen(s) | Interactive |
|---|---|---|---|
| — | Page Shell | All | No |
| — | Noise Texture | All | No |
| 1 | Topbar | All | No |
| 2 | Game Badge | Game, Lobby, Team Assignment, Queue, Results | No |
| 3 | Live Badge | Spectator, Feed | No |
| 4 | Icon Button | Game, Lobby, Queue | Yes |
| 5 | Scoreboard | Game, Spectator | JS-animated |
| 6 | Clock Bar (legacy, removed) | Game, Spectator | Yes — toggle |
| 7 | Score Progress | Game, Spectator | JS-updated |
| 8 | Section Header | Game, Lobby, Team Assignment, Queue, Results, Feed | Optional |
| 9 | Score Log | Game, Spectator | JS-managed |
| 10 | Teams Container | Game, Team Assignment | No |
| 11 | Player Card | Game | Yes — tap to score |
| 12 | Bottom Bar | Game, Lobby, Team Assignment, Results, Create Run | Yes |
| 13 | QR Block | Lobby | No |
| 14 | Format Strip (legacy, removed) | Lobby | Yes |
| 15 | Queue Item | Lobby, Queue | Yes — drag, actions |
| 16 | Stats Strip | Queue | No |
| 17 | Context Menu | Queue | Yes |
| 18 | Assignment Card (legacy, removed) | Team Assignment | Yes — drag, arrow |
| 19 | Balance Bar (legacy, removed) | Team Assignment | JS-updated |
| 20 | Option Pills | Create Run | Yes — single select |
| 21 | Stepper | Create Run | Yes — +/− |
| 22 | Toggle Switch | Create Run | Yes |
| 23 | Text Input | Create Run, Landing | Yes |
| 24 | Wordmark | Landing | No |
| 25 | Live Card | Feed | Yes — tap |
| 26 | Past Game Card | Feed | Yes — tap |
| 27 | Queue Position Strip | Spectator | No |

---

*Last updated after: `BallRuns-queue.html`. Do not add components to this file that don't exist in a built HTML screen.*
