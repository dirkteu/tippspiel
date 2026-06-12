# Supabase Migrationen

Projekt: `https://lxrofutyghzommmeyvez.supabase.co`

## Ausführen

### Variante A — Supabase Studio (manuell)
1. Supabase Dashboard öffnen → SQL Editor
2. Inhalte der Migrationen in dieser Reihenfolge ausführen:
   - `0001_schema.sql`
   - `0002_rls_policies.sql`
   - `0003_triggers.sql`
   - `0004_storage_bucket.sql`

### Variante B — Supabase CLI
```bash
npx supabase link --project-ref lxrofutyghzommmeyvez
npx supabase db push
```

## Reihenfolge wichtig
0001 legt Tabellen → 0002 aktiviert RLS → 0003 hängt Trigger ein → 0004 erstellt den Storage-Bucket.

## Hinweise

- `0109_partner_wrong_guesses.sql` hieß früher `0108_partner_wrong_guesses.sql`
  (Umbenennung, weil zwei Dateien das Präfix 0108 teilten — Kollision mit der
  CLI-Versionierung). Inhalt unverändert; falls bereits ausgeführt, NICHT erneut nötig
  (ist aber idempotent).
- `0110_champion_lock_ko.sql` muss VOR dem 28.06.2026 ausgeführt werden —
  sie hebt die versehentlich seit 11.06. aktive Weltmeister-Tipp-Sperre auf.

## Schema-Diff
Vor Erst-Deploy prüfen, ob die Tabellen schon existieren:
```bash
npx supabase db diff --linked
```
Falls bereits existent: nur fehlende ALTER-Statements aus 0001 ausführen.
