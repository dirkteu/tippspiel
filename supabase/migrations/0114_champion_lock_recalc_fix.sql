-- =====================================================================
-- 0114_champion_lock_recalc_fix.sql
-- Fix: official_champion konnte nach der Sperrfrist nicht gesetzt werden.
--
-- Gleicher Konstruktionsfehler wie 0111 (Tipp-Lock): recalc_champion_tips()
-- (Trigger auf tournament_config.official_champion) macht ein UPDATE auf
-- champion_tips -> das feuert trg_champion_lock -> enforce_champion_lock
-- prueft die ZEIT-Sperre VOR der Recalc-Ausnahme und warf nach dem
-- 28.06. immer "Weltmeister-Tipp gesperrt". Der Admin konnte den
-- Weltmeister also nie buchen.
--
-- Fix: Reine Punkte-Neuwertungen (champion_team unveraendert) werden als
-- erstes durchgelassen; alles andere bleibt wie in 0107 (dynamische
-- Sperre aus KO-Spielen, One-Shot, Punkte-Vorausberechnung).
--
-- In Prod angewandt am 19.07.2026 (per SQL-Editor), zusammen mit
--   UPDATE tournament_config SET official_champion = 'Spanien' WHERE id = 1;
-- =====================================================================

CREATE OR REPLACE FUNCTION public.enforce_champion_lock() RETURNS TRIGGER AS $fn$
DECLARE
  v_lock_at TIMESTAMPTZ;
  v_champion TEXT;
BEGIN
  -- Recalc-Ausnahme: champion_team unveraendert -> reine Punkte-Neuwertung
  IF TG_OP = 'UPDATE' AND NEW.champion_team IS NOT DISTINCT FROM OLD.champion_team THEN
    RETURN NEW;
  END IF;

  SELECT MIN(match_date) - INTERVAL '5 minutes'
    INTO v_lock_at
    FROM public.matches
    WHERE round IN ('r32', 'r16');

  IF v_lock_at IS NULL THEN
    SELECT champion_lock_at INTO v_lock_at
      FROM public.tournament_config WHERE id = 1;
  END IF;

  IF v_lock_at IS NOT NULL AND NOW() >= v_lock_at THEN
    RAISE EXCEPTION 'Weltmeister-Tipp gesperrt';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.champion_team IS DISTINCT FROM OLD.champion_team THEN
    RAISE EXCEPTION 'Weltmeister-Tipp ist final — nicht mehr aenderbar';
  END IF;

  SELECT official_champion INTO v_champion
    FROM public.tournament_config WHERE id = 1;
  NEW.points_earned := CASE
    WHEN v_champion IS NOT NULL AND v_champion = NEW.champion_team THEN 10
    ELSE 0
  END;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql SET search_path = '';
