-- 0105_partner_revealed.sql — Partner-Auflösung persistieren
-- Wer den Partner richtig erraten hat, bekommt einen Zeitstempel.
-- Damit ist die "Aufgelöst"-Ansicht idempotent nach Reload.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_revealed_at TIMESTAMPTZ;
