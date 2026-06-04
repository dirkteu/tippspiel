-- 0103_stadium.sql — Stadion pro Spiel
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS stadium TEXT;
