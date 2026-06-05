-- =====================================================================
-- 0106_team_name_owner.sql — Team-Namensvergabe vom Geschlecht entkoppeln
--
-- Statt implizit "die Frau benennt das Team" wird pro Team ein:e Spieler:in
-- als Team-Namen-Vergeber:in ausgelost (im Admin-Generate-Endpoint).
-- =====================================================================

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS team_name_owner_id UUID
    REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill: Für Teams ohne Namen jetzt nachträglich zufällig auslosen.
-- (Bereits benannte Teams: owner_id bleibt NULL, Spalte ist dann irrelevant.)
UPDATE public.teams t
SET team_name_owner_id = (
  SELECT id FROM public.profiles p
  WHERE p.team_id = t.id
  ORDER BY random()
  LIMIT 1
)
WHERE t.team_name_owner_id IS NULL
  AND t.team_name IS NULL;
