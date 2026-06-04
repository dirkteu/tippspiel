# Secret Squad — App UI Kit

A high-fidelity, interactive recreation of the Secret Squad mobile Tippspiel
(iPhone 14/15 Pro, 393 × 852). Built on the system tokens in
`../../colors_and_type.css`. This is a cosmetic prototype — state is local and
fake, not production logic.

## Run it
Open `index.html`. The prototype starts at the **welcome screen** → **squad
join** → the app. Use the bottom tab bar to move between screens. Try:
- **Spieltag / Tipps** — tap the `+ / −` steppers to change a score; hit
  **„Tipps speichern"** to save (toast confirms; cards flag „Tipp gespeichert").
- **Partner** — tap tiles to reveal the hidden partner photo (gentle 500ms
  fade). Each "Volltreffer" would normally open one tile.
- **Tabelle** — leaderboard with the current user highlighted.
- **Profil** — season stats + account list.

## Files
| File | Role |
|---|---|
| `index.html` | App shell: phone frame, stage flow (welcome→join→app), state, nav, save bar, toast. Loads React + Babel + Lucide. |
| `Onboarding.jsx` | `WelcomeScreen`, `JoinScreen` — the entry flow. |
| `Primitives.jsx` | Shared components — `Icon`, `StatusBar`, `AppBar`, `Button`, `Stepper`, `MatchCard`, `BottomNav`, `Toast`. Exported to `window`. |
| `Screens.jsx` | `SpieltagScreen`, `TippsScreen`, `PartnerScreen`, `TabelleScreen`, `ProfilScreen`. |
| `app.css` | Kit-specific layout/component styles (uses the global tokens). |

## Conventions
- **Green is rationed.** Only the primary CTA, the active nav tab, the live dot,
  and correct-result text use Stadiongrün. Never two primary greens on one screen.
- **Flags are emoji** (`🇩🇪 🇲🇽 🇦🇷`). On some desktop browsers without flag-emoji
  fonts these fall back to country-code letters (MX, DE); on iOS/Android they
  render as real flags. This is the intended, deliberate approach.
- **Icons** are Lucide via CDN, swapped in by `refreshIcons()` after render.
- **Tile reveal** uses `--dur-slow` (500ms) ease-out — opacity + slight scale.

## Component coverage
Welcome / onboarding · squad-join with code field · app bar · status bar ·
bottom tab nav · primary/secondary/ghost buttons · score stepper · match
prediction card (with live state) · 3×3 secret-partner reveal grid + progress ·
leaderboard rows (rank/podium/me) · stat tiles · settings list · toast.
