# PickleRuns — Brand Guidelines & Design System

> **Note.** This system was authored during the basketball era. The visual language (colors, type, spacing) still applies. References to the game clock, clock bar, and the basketball court motif are legacy: PickleRuns has no clock or time limit and uses rally scoring (one point per tap).


---

## 1. Brand Foundation

### What PickleRuns Is

A live pickleball doubles court manager built for how open play actually works. The host runs everything from one screen. Players join with a scan. Everyone sees the score in real time — including people still on their way.

### The Design Problem

The host is holding a phone at a court. One hand. Sweaty. Sun possibly in their face. Players need to see the score from across the gym. Speed, tap accuracy, and outdoor legibility are not nice-to-haves — they are the product.

### Design Principles

**Legibility first, always.**
Every decision — color, type weight, size, contrast — is filtered through one question: does this work at distance, in direct sunlight, on a mid-range screen?

**The numbers are the product.**
Scores, points, courts. These are the information that matters. Everything else is infrastructure supporting them.

**Native to the court, not to the web.**
Aesthetic references come from physical courts — scoreboards, painted court lines, paddle stacks at the net — not from SaaS design trends or Dribbble.

**No decoration without purpose.**
Every visual element earns its place. Textures, borders, and color only appear when they carry information or reinforce hierarchy.

**Fast over clever.**
Interactions should feel instant and forgiving. Big tap targets. Clear feedback. No ambiguity about what just happened.

---

## 2. Color

### Philosophy

Dark base with a single high-visibility accent. The background recedes, the content pops. The accent color is used exclusively to signal what's active, alive, or winning — never decoratively.

### Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0e0f0c` | App background — near-black with a warm asphalt undertone |
| `--bg-raised` | `#161710` | Elevated surfaces, modals |
| `--bg-surface` | `#1e2019` | Cards, input fields, clock bar |
| `--bg-hover` | `#252720` | Hover states, pressed backgrounds |
| `--accent` | `#c8f135` | **The brand color.** Electric yellow-green. |
| `--accent-dim` | `#a0c228` | Secondary accent — labels, active links, team A header |
| `--accent-glow` | `rgba(200, 241, 53, 0.15)` | Accent fill on hover/active states |
| `--text-primary` | `#f0f0e8` | Primary text — warm white, not harsh pure white |
| `--text-secondary` | `#8a8c7a` | Secondary text, player points at rest |
| `--text-muted` | `#4a4c3e` | Labels, metadata, inactive states |
| `--border` | `#2a2c22` | Default borders — subtle, structural |
| `--border-accent` | `rgba(200, 241, 53, 0.3)` | Active/focused borders |

### Accent Color Rationale

`#c8f135` — electric yellow-green — was chosen for three reasons:

1. **High visibility by nature.** This tone is used in safety signage and sports equipment for a reason. It reads in any lighting condition.
2. **Court-native.** The color of a freshly painted court line under gym lights. A new ball on the court.
3. **Distinctive.** Nobody in this product category is using it. It won't be confused with anything else.

### Color Rules

- The accent touches **active states, leading scores, and score events.** Nothing else.
- Team B is never given a competing accent color. They stay in `--text-secondary`. The distinction is hierarchy, not rivalry.
- Red (`#ff4040` range) is reserved exclusively for **destructive actions** — End Game, delete, remove. It does not appear anywhere else.
- Never use pure black (`#000000`) or pure white (`#ffffff`) as backgrounds or primary text. The warm undertones in `--bg` and `--text-primary` are intentional.

### Backgrounds as Atmosphere

The background is not just a color — it has a subtle noise texture overlay (SVG fractalNoise, `opacity: 0.04`) that reads as a slight grain. This is the detail that makes the interface feel physical rather than flat. It references the texture of a court surface or gym floor rather than a glass screen.

---

## 3. Typography

### Typefaces

| Role | Family | Source |
|---|---|---|
| Display / Numbers | **Barlow Condensed** | Google Fonts |
| Body / UI | **Barlow** | Google Fonts |

```
https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap
```

### Why Barlow Condensed

Tall, bold, condensed numerals that recall a physical scoreboard. High information density without sacrificing legibility. The condensed width means large numbers don't overflow on small screens. The weight range (400–900) gives us full expressive control from metadata labels to hero scores.

### Type Scale

| Role | Family | Size | Weight | Transform | Tracking |
|---|---|---|---|---|---|
| Score Number | Barlow Condensed | `clamp(96px, 22vw, 160px)` | 900 | — | `-0.02em` |
| Clock Display | Barlow Condensed | `42px` | 900 | — | `0.04em` |
| Run Name | Barlow Condensed | `20px` | 800 | Uppercase | `0.02em` |
| Player Name (card) | Barlow Condensed | `15px` | 800 | Uppercase | `0.03em` |
| Player Points | Barlow Condensed | `22px` | 900 | — | `-0.01em` |
| Section Title | Barlow Condensed | `12px` | 700 | Uppercase | `0.14em` |
| Game Badge | Barlow Condensed | `12px` | 700 | Uppercase | `0.10em` |
| Log Entry | Barlow Condensed | `13px` | 600 | — | `0.04em` |
| Run Label | Barlow Condensed | `11px` | 700 | Uppercase | `0.12em` |
| Team Label | Barlow Condensed | `11px` | 700 | Uppercase | `0.14em` |
| Score Goal | Barlow Condensed | `12px` | 600 | Uppercase | `0.08em` |
| Body / UI text | Barlow | `14–16px` | 400–500 | — | — |

### Typography Rules

- **All display text is Barlow Condensed.** Barlow (non-condensed) is only used for paragraphs, longer form content, and inputs.
- **Numbers are always weight 900.** No exceptions. Scores, points, time — maximum weight.
- **Labels are always uppercase with generous letter-spacing.** This creates contrast between labels and values without relying on size alone.
- **Line height for score numbers is `0.88`.** Tighter than default — these numbers are display elements, not running text.
- Never use font weights below 600 for any display text in the app. Thin weights disappear at distance and in sunlight.

---

## 4. Spacing & Layout

### Container

The app is a single-column mobile layout, max-width `480px`, centered. This is a phone-first product. Desktop is a secondary concern.

```css
.app {
  max-width: 480px;
  margin: 0 auto;
}
```

### Base Spacing Unit

`4px`. All spacing values are multiples of 4.

| Token | Value | Usage |
|---|---|---|
| `4px` | xs | Internal element gaps |
| `8px` | sm | Tight component spacing |
| `10px` | md | Card padding, gap between cards |
| `12px` | — | Section padding |
| `16px` | lg | Standard section padding |
| `20px` | xl | Page edge padding (left/right gutter) |
| `24px` | — | Bottom bar bottom padding (safe area) |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `6px` | Small elements — badges, log entries, clock buttons |
| `--radius-md` | `10px` | Cards, player cards, clock bar, bottom buttons |
| `--radius-lg` | `16px` | Modals, sheets, large containers |

### Visual Hierarchy on Screen

The game screen establishes a vertical hierarchy that all other screens should honor:

1. **Scoreboard** — dominant, takes the most vertical and visual space
2. **Progress bar** — contextual, compact
3. **Recent log** — supporting, stays minimal (3 entries max)
4. **Player cards** — action layer, equal-weight grid
5. **Bottom bar** — persistent, always visible

---

## 5. Components

### Topbar

- Fixed height with `border-bottom: 1px solid var(--border)`
- Left: run label (small, muted uppercase) + run name (large, bold)
- Right: game badge + icon buttons
- Never cluttered. Max two actions on the right.

### Game Badge

```css
color: var(--accent);
background: var(--accent-glow);
border: 1px solid var(--border-accent);
padding: 4px 10px;
border-radius: 4px;
font: 700 12px Barlow Condensed, uppercase, 0.1em tracking
```

Used to indicate current game number. Accent-colored because this is live, active state information.

### Score Numbers

The hero of every game screen. Sized with `clamp()` to scale with viewport while staying bounded. Use `line-height: 0.88` to keep them tight. On score event: flash to `--accent` and `scale(1.06)` for 300ms.

```css
font-size: clamp(96px, 22vw, 160px);
font-weight: 900;
line-height: 0.88;
letter-spacing: -0.02em;
```

### Clock Bar (legacy, removed)

PickleRuns has no game clock; this component is not used.

A contained row with background `--bg-surface` and a `1px` border. Clock display left, controls right. The clock number is accent-colored at rest. Turns `#ff6b35` (orange-red) with a pulse animation when ≤60 seconds remain.

**Warning state** (`≤ 60s`):
```css
color: #ff6b35;
animation: pulse-warn 0.8s ease-in-out infinite;
```

### Progress Bar

Two fills growing from outside edges inward, separated by a `3px` gap at center. Team A (accent) grows left-to-right. Team B (secondary) grows right-to-left. Each fill represents `score / goal * 47%` max width, leaving space for the center gap.

```css
.progress-fill-a { background: var(--accent); }
.progress-fill-b { background: var(--text-secondary); }
```

### Player Card

The primary interactive element for the host. Requirements:
- Large enough to tap accurately under pressure
- Immediate visual feedback on tap
- Name left, points right

```css
background: var(--bg-surface);
border: 1px solid var(--border);
border-radius: var(--radius-md);
padding: 10px 12px;
cursor: pointer;
-webkit-tap-highlight-color: transparent;
```

**States:**

| State | Border | Background | Transform |
|---|---|---|---|
| Rest | `--border` | `--bg-surface` | none |
| Hover | `--border-accent` | `+ accent-glow overlay` | `translateY(-1px)` |
| Active/press | `--accent` | — | `scale(0.97)` |
| Just scored | `--accent` | flash `rgba(200,241,53,0.25) → --bg-surface` | — |

On "just-scored": player points number flashes to `--accent` and `scale(1.15)` for 500ms.

### Score Log

Maximum 3 entries visible at any time. New entries prepend (push to top), oldest drops off the bottom. Each entry slides in from above on entry (`translateY(-6px) → 0`, 200ms).

Structure per entry: team color dot → player name scored → score at that moment.

Team A dot: `var(--accent)`. Team B dot: `var(--text-secondary)`.

### Icon Button

```css
width: 36px; height: 36px;
border-radius: var(--radius-sm);
border: 1px solid var(--border);
background: var(--bg-surface);
```

Hover: border transitions to `--accent-dim`, color to `--accent`, background to `--accent-glow`.

### Bottom Bar

Always pinned to bottom of screen. `border-top: 1px solid var(--border)`. Contains Undo (secondary) and primary action (End Game / Start Game / Confirm).

**Undo button:** Secondary style. `--bg-surface` background, `--text-secondary` color. Has an undo SVG icon. Never accent-colored — it's a correction, not a forward action.

**End Game button:** Danger style. Red border (`#ff4040`), red text (`#ff6060`), `rgba(255,64,64,0.08)` background. This is the only place red appears in the active game screen.

**Primary action button** (Start Game, Confirm, etc.): `--accent` background, `--bg` text, full weight. The most visually heavy element in any screen — used sparingly.

### Section Headers

```css
font: 700 12px Barlow Condensed, uppercase, 0.14em tracking
color: var(--text-muted)
```

Right-aligned secondary action (e.g. "Edit teams") uses `--accent-dim`. No background, no border — just text.

---

## 6. Motion & Animation

### Page Load

Staggered fade-up on all major sections. Each section starts `translateY(8px)` and `opacity: 0`, resolves to rest position. Delays increase by ~30–40ms per section.

```
topbar:          0ms delay
scoreboard:     60ms delay
clock:         100ms delay
progress:      130ms delay
section header: 160ms delay
teams:         190ms delay
bottom bar:    220ms delay
```

Duration: `300ms`, `ease-out`.

### Score Event

When a player scores:
- Score number: `color → --accent`, `scale(1.06)`, duration `300ms`, `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight overshoot)
- Player card: border flashes accent, background flashes `rgba(200,241,53,0.25) → --bg-surface`, duration `500ms`
- Player points: `color → --accent`, `scale(1.15)`, duration `500ms`

### Log Entry

New entries slide in from above: `translateY(-6px), opacity: 0 → translateY(0), opacity: 1`, `200ms ease-out`.

### Progress Bar

Width transitions: `300ms cubic-bezier(0.34, 1.56, 0.64, 1)`. The slight overshoot makes the bar feel alive rather than mechanical.

### General Rules

- No animation exceeds `500ms` in the active game screen. This is a fast-action interface.
- Easing is always `ease-out` or the custom spring `cubic-bezier(0.34, 1.56, 0.64, 1)` for score events. Never `linear`.
- Animations confirm actions — they are never decorative. If removing an animation breaks the sense of feedback, it belongs. If not, cut it.

---

## 7. Screen Roles & View Modes

The app has three user roles, each with a distinct relationship to the interface:

| Role | Mode | Primary Need |
|---|---|---|
| Host | Control | Speed, accuracy, no mistakes |
| Player | Live | Score awareness, queue position |
| Spectator | Live | Score awareness |

### Host View

Dense, interactive. Every element is a potential tap target. Maximum information density while maintaining tap safety. The host should never have to search for anything.

### Spectator / Player View

Stripped down. Score numbers should be **even larger** than host view — these people aren't tapping, they're reading from a distance. Recent log stays. Player cards are non-interactive (display only). Queue position displayed prominently for players.

### Design Implication

The same design tokens and components serve both views, but the spectator view de-emphasizes interactive affordances (no hover states, no tap cursors) and maximizes score display size.

---

## 8. Iconography

Icons are inline SVG only. No icon library dependency.

Style: `stroke` based, `stroke-width: 2.5`, `stroke-linecap: round`, `stroke-linejoin: round`. This matches the boldness of the typography without being too heavy.

Default size in icon buttons: `16x16px`. In text-adjacent contexts: `14x14px`.

Color inherits from parent (`currentColor`). Never hardcoded.

---

## 9. The Court Motif

Court-native details that appear intentionally, not as decoration:

**The court center circle** — a visual divider between the two team scores in the scoreboard. A circle with a center dot, flanked by horizontal lines. References the center court marking. Never labeled, never explained — understood by the audience.

**The progress bar gap** — the 3px gap between Team A and Team B fills references the center line of a court. Two teams, one court, a clear dividing line.

**Team naming convention** — "Runs" and "Next" rather than "Team A" and "Team B." This is the language of the court. The team that won stays on. The team waiting is "Next."

These details should not multiply. Their power comes from restraint. Three is enough.

---

## 10. Writing & Language

### Tone

Direct. No fluff. The language of someone who's been running open gyms for years.

- Not: "Your game has been successfully started."
- Yes: "Game 3"

- Not: "Would you like to add a point to this player?"
- Yes: tap. done.

### Labels

All UI labels are uppercase with tracking. This is both a design choice and a readability choice — short uppercase strings read faster at small sizes.

### Player Names

Displayed exactly as entered. Uppercase in the UI (CSS `text-transform: uppercase`), but stored as-entered. Nicknames, short names, initials — whatever the player types is what shows. The app doesn't correct people.

### Numbers

Scores and points are always whole integers. No decimals. No "+" prefix. Just the number.

### Empty States

Should feel like the natural state before something happens, not like an error. A queue with no players shouldn't say "No players yet." It should show the join instructions prominently — the empty state is the call to action.

---

## 11. What This System Is Not

To keep the design system sharp, these decisions are explicitly off the table:

- **No light mode.** The dark base is a legibility decision, not a preference. It's not a toggle.
- **No color theming per team.** Teams are not given unique colors. Accent belongs to the concept of "winning / active / Team A." Introducing a second accent color breaks the hierarchy.
- **No rounded pill shapes on primary buttons.** The `--radius-md` (10px) is the max for any interactive element. Pills read as consumer/social apps. This is a utility tool.
- **No gradients on backgrounds.** The atmosphere comes from the noise texture and the color temperature, not gradients.
- **No system fonts.** Barlow Condensed is non-negotiable. If it fails to load, the fallback is `sans-serif` — but the design assumes it loads.
- **No purple.** Under any circumstances.

---

## 12. CSS Custom Properties — Full Reference

```css
:root {
  /* Backgrounds */
  --bg:           #0e0f0c;
  --bg-raised:    #161710;
  --bg-surface:   #1e2019;
  --bg-hover:     #252720;

  /* Accent */
  --accent:       #c8f135;
  --accent-dim:   #a0c228;
  --accent-glow:  rgba(200, 241, 53, 0.15);

  /* Text */
  --text-primary:   #f0f0e8;
  --text-secondary: #8a8c7a;
  --text-muted:     #4a4c3e;

  /* Borders */
  --border:         #2a2c22;
  --border-accent:  rgba(200, 241, 53, 0.3);

  /* Radius */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  16px;

  /* Typography */
  --font-display: 'Barlow Condensed', sans-serif;
  --font-body:    'Barlow', sans-serif;

  /* Score number — fluid, viewport-relative */
  --score-size: clamp(96px, 22vw, 160px);
}
```

---

*Version 1.0 — Based on the Game Screen design proof. Updated as new screens are designed and new decisions are made.*
