-- =====================================================================
-- 0107_champion_one_shot.sql — Weltmeister-Tipp endgueltig
--
-- Neue Spec:
--   - Sperrfrist = MIN(match_date) der KO-Runden (r32/r16) minus 5 Min,
--     Fallback auf tournament_config.champion_lock_at.
--   - Tipp ist EINMALIG: ein UPDATE des Champion-Teams wird blockiert,
--     nur Re-Scoring (points_earned aendert sich) bleibt erlaubt.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.enforce_champion_lock() RETURNS TRIGGER AS $$
DECLARE
  v_lock_at TIMESTAMPTZ;
  v_champion TEXT;
BEGIN
  -- Dynamische Sperrfrist: fruehestes KO-Spiel minus 5 Min.
  SELECT MIN(match_date) - INTERVAL '5 minutes'
    INTO v_lock_at
    FROM public.matches
    WHERE round IN ('r32', 'r16');

  -- Fallback: tournament_config-Datum, falls noch keine KO-Spiele angelegt.
  IF v_lock_at IS NULL THEN
    SELECT champion_lock_at INTO v_lock_at
      FROM public.tournament_config WHERE id = 1;
  END IF;

  IF v_lock_at IS NOT NULL AND NOW() >= v_lock_at THEN
    RAISE EXCEPTION 'Weltmeister-Tipp gesperrt';
  END IF;

  -- Einmaligkeit: UPDATE des Champion-Teams blockieren.
  -- Re-Scoring (nur points_earned aendert sich) bleibt erlaubt, damit
  -- recalc_champion_tips() weiterhin funktioniert.
  IF TG_OP = 'UPDATE' AND NEW.champion_team IS DISTINCT FROM OLD.champion_team THEN
    RAISE EXCEPTION 'Weltmeister-Tipp ist final — nicht mehr aenderbar';
  END IF;

  -- Punkte beim Setzen vorausberechnen.
  SELECT official_champion INTO v_champion
    FROM public.tournament_config WHERE id = 1;
  NEW.points_earned := CASE
    WHEN v_champion IS NOT NULL AND v_champion = NEW.champion_team THEN 10
    ELSE 0
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
