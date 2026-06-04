# Iconography — Secret Squad

No icon assets were provided in the source blueprint. This system standardises on
**Lucide** as the closest match to the intended look: clean line icons, ~2px
stroke, rounded caps and joins.

> ⚠️ **Substitution flagged.** Lucide is a stand-in chosen for stroke-weight and
> style fit. Replace with the official Secret Squad set if one is produced.

## Loading (CDN)

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<script>lucide.createIcons();</script>
<!-- usage -->
<i data-lucide="trophy"></i>
```

In the React UI kit, icons are thin wrappers that render the inline Lucide SVG
so stroke width and color inherit from `currentColor`.

## Rules

- **Stroke:** 1.75–2px, rounded caps/joins. No filled icons except the live dot.
- **Color:** inactive `--slate-400`; active / selected `--green-600`; on dark
  default `--slate-300`.
- **Sizes:** 20px inline · 24px nav & toolbar · 28px feature.

## Common icons (Lucide names)

| Use | Lucide |
|---|---|
| Home / Spieltag | `house` |
| Tipps / predictions | `pencil-line` |
| Squad / friends | `users` |
| Leaderboard / Tabelle | `bar-chart-3` |
| Profile | `circle-user` |
| Trophy / podium | `trophy` |
| Secret partner | `lock` / `lock-open` |
| Live | `radio` (+ pulsing dot) |
| Save | `check` |
| Time / kickoff | `clock` |

## Emoji

- **Flags are ALWAYS emoji** — 🇩🇪 🇧🇷 🇫🇷 🇦🇷 🇺🇸 🇲🇽 — never image files.
  Deliberate: fast load, old-device safe, fits the minimal look.
- Celebratory emoji (🎉 ⚽ 🔥) only in success / reveal moments.
- Never use emoji in navigation, labels, or running body copy.

## Logo / brand mark

The brand mark is **typographic**: the wordmark "SECRET SQUAD" set in Space
Grotesk 700, tight tracking, with "SQUAD" optionally tinted `--green-600`. A
compact lockup uses a Lucide `shield` / `lock` glyph beside the wordmark. See
`preview/brand-mark.html`. No bespoke illustrated logo was provided.
