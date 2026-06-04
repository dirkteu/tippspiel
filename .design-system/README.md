# Secret Squad — WM 2026 Tippspiel · Design System

A dark-themed, mobile-first design system for **Secret Squad**, a FIFA World
Cup 2026 prediction game ("Tippspiel"). Friends form a squad, predict match
results, earn points, and climb the leaderboard. The signature mechanic is the
**Secret Partner Card** — a 3×3 grid of tiles that hides a partner's photo and
reveals one tile at a time as you make correct predictions.

The aesthetic is restrained and "edel" (elegant): near-black anthracite
surfaces, chalk-white text, and a single **Stadiongrün** (stadium green) accent
used only for the moments that matter.

---

## Sources

This system was reconstructed from a single provided spec — there is **no
codebase or live Figma file**. Keep this in mind: components below are faithful
to the blueprint's tokens and structure but extrapolate the full product.

- `uploads/figma_design_blueprint.pdf` — *"FIGMA DESIGN BLUEPRINT — Secret Squad
  WM 2026 Tippspiel // Mobile UI Kit"*. Defines the frame size, layout grid,
  color tokens, type base, and the 3×3 tile component spec.
- User direction (German): green used sparingly (only key actions / active tab);
  tile reveals animated gently (300–500ms); flags rendered as **emoji** (🇩🇪 🇺🇸),
  never image files.
- Typeface: **Roboto** (per user) for UI/body, paired with **Oswald**
  for display/score numerals.

> **Note — deviation from blueprint:** the type scale floors at **14px**
> (`xs`) for legibility (blueprint used 12px). Neutrals follow the original
> blue-slate spec (user-confirmed).

> **Frame:** iPhone 14/15 Pro — **393 × 852 px**. Layout grid: 4 columns,
> 16px margins, 12px gutter.

---

## Content fundamentals

**Language:** German (de-DE). Football-fan register — energetic but never
shouty. The app speaks like a knowledgeable mate organising the squad pool.

**Voice & address:** Informal **„du"** throughout. Direct and active:
„Speichere deine Tipps", „Du liegst auf Platz 3". Never the formal „Sie".

**Casing:** Sentence case for body and buttons. Short ALL-CAPS kickers/labels
with wide letter-spacing for section eyebrows (`SPIELTAG 1`, `LIVE`,
`DEINE SQUAD`). Headlines are title-/sentence-case, never all-caps.

**Tone examples**
- CTA: „Tipps speichern" · „Squad beitreten" · „Jetzt tippen"
- Empty state: „Noch keine Tipps abgegeben — der Anpfiff wartet." 
- Success: „Volltreffer! +3 Punkte" · „Kachel aufgedeckt 🎉"
- Section eyebrows: „NÄCHSTES SPIEL", „TABELLE", „DEIN GEHEIMER PARTNER"

**Numbers & scores:** Tabular figures, always. Scores read `2 : 1` with thin
spaces around the colon. Points prefixed with `+` (`+3`, `+1`). Ranks as `#3`.

**Emoji:** Used purposefully, not decoratively. **Flags are always emoji**
(🇩🇪 🇧🇷 🇺🇸 🇲🇽) — this is a deliberate brand + performance choice. A sparse
celebratory emoji (🎉 🔥 ⚽) is allowed in success moments. Avoid emoji in
navigation, labels, or body copy.

**Vibe:** Match-day anticipation. Premium sports-betting polish (think a
pared-back DAZN/Onefootball) without the gambling sleaze — it's a friendly pool.

---

## Visual foundations

### Color
A two-tier system: a deep **slate** neutral ramp does all the structural work,
and a single **emerald "Stadiongrün"** accent is rationed.

- **Backgrounds:** `--slate-900 #0f172a` app canvas; `--slate-800 #1e293b`
  cards/sections; `--slate-850` for elevated sheets. Cool blue-slate per the
  original blueprint. Flat fills — no gradients on surfaces.
- **Text:** `--slate-50 #f8fafc` (Kreideweiß) for titles/core; `--slate-400
  #94a3b8` (Muted-Grey) for sublines/labels.
- **Accent — use sparingly:** `--green-600 #059669`. Reserved for the primary
  CTA, the **active** bottom-nav tab, live indicators, and correct-result
  states. If more than ~one green element is on screen at once, reconsider.
- **Semantic:** win `#10b981`, pending/draw amber `#f59e0b`, wrong/loss rose
  `#f43f5e`, info sky `#38bdf8`, podium gold `#fbbf24`. All muted, no neon.

### Type
Roboto for everything readable; **Oswald** for big numerals (scores, points,
countdowns) and headlines — a condensed, athletic poster typeface that gives the
brand a classic sports feel. Tight tracking on display sizes (`-0.02em`), wide
tracking on uppercase kickers (`0.08em`). Tabular
numerics everywhere a figure can change.

### Spacing & layout
4px base grid. Frame margins 16px, gutters 12px, 4 columns. Generous vertical
rhythm between cards (16–24px). Content is single-column, scrollable, with a
fixed bottom tab bar and often a sticky header.

### Backgrounds & texture
Solid anthracite — **no** photographic backgrounds, no full-bleed hero imagery,
no repeating patterns. Depth comes from elevation (surface color steps +
shadow), not decoration. The one place imagery appears is *behind* the 3×3
Secret Partner grid, where it is progressively revealed.

### Corners, borders, cards
Radii: tiles/inputs/chips `8px`, buttons `12px`, cards/sections `16px`, sheets
`24px`. Cards are `--slate-800` fills with either a hairline
`rgba(148,163,184,.14)` border *or* a soft shadow (`--shadow-card`) — rarely
both. A faint inset top highlight (`inset 0 1px 0 rgba(255,255,255,.03)`) gives
cards a subtle sheen on the dark canvas.

### Elevation & shadow
Shadows are soft, dark, and diffuse (black at 40–55%). The accent gets a
dedicated `--glow-green` (1px emerald ring + soft green shadow) for the primary
CTA and freshly-revealed tiles only.

### Motion
Calm and physical. Default `300ms` ease-out; the **tile reveal** is the
signature animation — a tile fades + slightly scales out over **300–500ms** so
the photo beneath emerges gently rather than blinking. Buttons: press =
`scale(0.97)` + darken to `--green-700`. Hover (where pointers exist): lighten
to `--green-500`. No bounces, no infinite loops, respects
`prefers-reduced-motion`.

### Transparency & blur
Used lightly: sticky headers and the bottom tab bar use a `slate-900` at ~80%
with `backdrop-filter: blur(12px)` so content scrolls under them. Modals dim the
canvas with `rgba(2,6,23,.6)`.

---

## Iconography

**System:** Line icons, ~1.75–2px stroke, rounded caps/joins — matching the
clean, modern, slightly sporty tone. The blueprint ships no icon assets, so this
system standardises on **[Lucide](https://lucide.dev)** (loaded from CDN) as the
closest match to the intended weight and feel.

> ⚠️ **Substitution flagged:** no icons were provided in the source. Lucide is a
> substitute chosen for stroke/weight fit. Swap for the official set if/when it
> exists. See `assets/icons.md`.

- **Active vs inactive:** inactive icons use `--slate-400`; the active nav icon
  + label switch to `--green-600`. Filled variants are avoided except the live
  dot.
- **Sizes:** 20px inline, 24px nav/toolbar, 28px feature.
- **Emoji as iconography:** **country flags are always emoji** (🇩🇪 🇫🇷 🇦🇷) — a
  deliberate choice for load speed, old-device safety, and the minimal look.
  Sparing celebratory emoji (🎉 ⚽ 🔥) only in success/reveal moments.
- **No custom SVG illustration** — the brand is typographic + spatial, not
  illustrative.

---

## Index — what's in this system

| File / folder | What it is |
|---|---|
| `README.md` | This document — context, content + visual foundations, iconography. |
| `colors_and_type.css` | All design tokens: color, type, spacing, radii, shadow, motion. |
| `preview/` | Small HTML specimen cards rendered in the Design System tab. |
| `assets/` | Brand mark, icon documentation. |
| `assets/icons.md` | Iconography reference (Lucide CDN usage + emoji rules). |
| `ui_kits/app/` | The Secret Squad mobile app UI kit (JSX components + interactive `index.html`). |
| `SKILL.md` | Agent-Skill manifest so this system can be used in Claude Code. |

**UI kits**
- `ui_kits/app/` — the mobile Tippspiel app: match-day prediction screen, the
  Secret Partner 3×3 reveal card, leaderboard, and bottom-nav shell.

*No slide template was provided, so `slides/` is intentionally omitted.*
