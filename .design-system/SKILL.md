---
name: secret-squad-design
description: Use this skill to generate well-branded interfaces and assets for Secret Squad (the FIFA World Cup 2026 "Tippspiel" prediction-game mobile app), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## What's here
- `README.md` — brand context, content + visual foundations, iconography, index.
- `colors_and_type.css` — all design tokens (color, type, spacing, radii, shadow, motion). Link or copy this.
- `preview/` — small specimen cards for every foundation + component.
- `assets/icons.md` — iconography rules (Lucide CDN + emoji flags).
- `ui_kits/app/` — interactive mobile app recreation (React/Babel components + `index.html`).

## Non-negotiables
- **Stadiongrün (`#059669`) is rationed** — primary CTA, active nav tab, live, correct results only. Never flood the UI with green; the elegance lives in the green-tinted anthracite neutrals.
- **Flags are always emoji** (🇩🇪 🇲🇽 🇧🇷) — never image files.
- **Tile reveals are gentle** — 300–500ms ease-out fade + slight scale, never an instant blink.
- Dark-theme-first, mobile-first (393 × 852). Roboto for UI, Oswald for scores/numerals & headlines.
