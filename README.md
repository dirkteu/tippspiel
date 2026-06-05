# Secret Squad — WM 2026 Tippspiel

Anonymes Zweier-Team Tippspiel zur FIFA Weltmeisterschaft 2026.
Frau + Mann tippen gemeinsam — wissen aber nicht, wer ihr Partner ist.
Die Identität wird über ein 3×3-Kachelraster auf einem Selfie geschützt
und im Lauf des Turniers schrittweise enthüllt.

## Stack

- **Next.js 16** (App Router, TypeScript strict, Turbopack)
- **Supabase** (PostgreSQL + Storage)
- **Roboto + Oswald** via `next/font` + Twemoji-Flag-Polyfill
- **Lucide-React** Icons
- **api-football.com** für Live-Ergebnisse (Cron-Worker, alle 5 Min)
- **Docker Compose + Nginx + Let's Encrypt** auf Hetzner Cloud-VM

## Lokales Setup

```bash
# 1. Repo klonen
git clone <repo>
cd secret-squad

# 2. Dependencies
npm install

# 3. .env
cp .env.example .env.local
# … Werte eintragen (Supabase-URL + Service-Role-Key + Admin-Passwort)

# 4. Supabase-Migrationen
# Variante A: SQL Editor im Supabase-Dashboard, 0001 → 0002 → 0003 → 0004
# Variante B: supabase CLI
npx supabase link --project-ref lxrofutyghzommmeyvez
npx supabase db push

# 5. Dev-Server
npm run dev
# → http://localhost:3000

# 6. Tests
npx vitest run
```

## Produktion (Hetzner Cloud VM → tipp.dirkteu.de)

Voraussetzung: Hetzner-VM mit Ubuntu 22.04/24.04, DNS A-Record
`tipp.dirkteu.de → <VM-IP>` ist gesetzt.

### Erst-Deploy

```bash
# 1. Auf der VM einloggen (SSH)
ssh root@<VM-IP>

# 2. Docker + Compose-Plugin installieren
apt-get update && apt-get install -y docker.io docker-compose-plugin git

# 3. Repo holen
cd /opt
git clone <DEIN-GITHUB-REPO> secret-squad && cd secret-squad

# 4. .env aus .env.example anlegen + ausfüllen
cp .env.example .env
nano .env
# Wichtig: NEXT_PUBLIC_SITE_URL=https://tipp.dirkteu.de
#          ADMIN_PASSWORD=...
#          SUPABASE_* aus Supabase-Dashboard
#          API_FOOTBALL_KEY (optional)

# 5. Deploy-Script (macht Bootstrap-SSL automatisch)
chmod +x deploy.sh
./deploy.sh
```

Das Script erkennt am Fehlen von `nginx/certbot/conf/live/tipp.dirkteu.de/`
automatisch den Erst-Deploy, startet nginx im HTTP-only Bootstrap-Modus,
holt das Zertifikat via certbot und schwenkt dann auf die HTTPS-Config.

### Updates

```bash
cd /opt/secret-squad
git pull
./deploy.sh                    # Cert bleibt, nur web + worker neu gebaut
```

### Logs / Status

```bash
docker compose ps
docker compose logs -f web
docker compose logs -f cron-worker
docker compose logs -f nginx
```

## Architektur

| Layer                | Wo                                                      |
|----------------------|---------------------------------------------------------|
| UI / Server-Routen   | `src/app/` (App Router)                                 |
| API-Routen           | `src/app/api/`                                          |
| Komponenten          | `src/components/`                                       |
| Reine Logik          | `src/lib/` (points, tiles, auth, matches, supabase)     |
| Cron-Worker          | `src/workers/sync-results.ts` (eigener Container)       |
| DB-Migrationen       | `supabase/migrations/`                                  |
| Design-Tokens        | `src/styles/tokens.css` (1:1 aus Design-System-ZIP)     |
| Container-Setup      | `Dockerfile`, `docker-compose.yml`, `nginx/`            |

## Spielregeln (Kurz)

- 6 Gruppenspiele der **Deutschen Gruppe** + komplette Endrunde.
- **5-Min-Sperrfrist** vor Anpfiff. Danach hart gesperrt (DB-Trigger).
- **Punkte:** 4 (exakt) · 3 (Tordiff) · 2 (Tendenz) · 0.
- **Weltmeister-Bonus:** +10 Punkte für richtigen Tipp. Sperrfrist = Anpfiff Eröffnungsspiel.
- **Volltreffer** (≥3 Pkt) deckt eine Kachel auf. K.o.-Runden bringen Bonus-Kacheln.
- **Anonym:** alle Ansichten zeigen nur Pseudonyme und Team-Namen.

## Admin

- `/admin` mit `ADMIN_PASSWORD` aus `.env`
- Teams anlegen → 2 Invite-Links (Mann/Frau) per WhatsApp verschicken
- Ergebnisse manuell setzen (Override, falls API-Football versagt)
- Offiziellen Weltmeister nach Finale eintragen → alle Champion-Tipps werden automatisch gewertet

## Tests

```bash
npx vitest run              # ein Mal
npx vitest                  # watch mode
```

22 Tests — Punkte-Logik mit Property-Based-Tests (fast-check, 1000 Random-Cases), Kachel-Logik mit Edge-Cases.

## Lizenz

Privat — Familienprojekt.
