-- =====================================================================
-- 0003_triggers.sql — Wertungs- und Sperrfrist-Trigger
-- =====================================================================

-- ---------- Punkte-Berechnung (4-3-2-0) ----------
CREATE OR REPLACE FUNCTION public.calc_points(tip1 INT, tip2 INT, res1 INT, res2 INT)
RETURNS INT AS $$
BEGIN
  IF res1 IS NULL OR res2 IS NULL THEN RETURN 0; END IF;
  IF tip1 = res1 AND tip2 = res2 THEN RETURN 4; END IF;
  IF (tip1 - tip2) = (res1 - res2) THEN RETURN 3; END IF;
  IF sign(tip1 - tip2) = sign(res1 - res2) THEN RETURN 2; END IF;
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ---------- Punkte-Recalc bei Ergebnis-Update ----------
CREATE OR REPLACE FUNCTION public.recalc_tips_for_match() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tips
     SET points_earned = public.calc_points(tip_1, tip_2, NEW.result_1, NEW.result_2),
         updated_at = NOW()
   WHERE match_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalc_tips ON public.matches;
CREATE TRIGGER trg_recalc_tips
  AFTER UPDATE OF result_1, result_2 ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.recalc_tips_for_match();

-- ---------- Sperrfrist 5 Min vor Anpfiff ----------
CREATE OR REPLACE FUNCTION public.enforce_tip_lock() RETURNS TRIGGER AS $$
DECLARE
  v_lock_at TIMESTAMPTZ;
BEGIN
  SELECT locked_at INTO v_lock_at FROM public.matches WHERE id = NEW.match_id;
  IF v_lock_at IS NULL THEN
    RAISE EXCEPTION 'Match % nicht gefunden', NEW.match_id;
  END IF;
  IF NOW() >= v_lock_at THEN
    RAISE EXCEPTION 'Tipp gesperrt: Sperrfrist überschritten (locked_at %)', v_lock_at;
  END IF;
  -- Punkte beim Speichern direkt aus aktuellem Ergebnis ableiten
  SELECT public.calc_points(NEW.tip_1, NEW.tip_2, result_1, result_2) INTO NEW.points_earned
    FROM public.matches WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lock_tips ON public.tips;
CREATE TRIGGER trg_lock_tips
  BEFORE INSERT OR UPDATE ON public.tips
  FOR EACH ROW EXECUTE FUNCTION public.enforce_tip_lock();

-- ---------- Sperrfrist Champion-Tipp ----------
CREATE OR REPLACE FUNCTION public.enforce_champion_lock() RETURNS TRIGGER AS $$
DECLARE
  v_lock_at TIMESTAMPTZ;
  v_champion TEXT;
BEGIN
  SELECT champion_lock_at, official_champion INTO v_lock_at, v_champion
    FROM public.tournament_config WHERE id = 1;
  IF v_lock_at IS NULL THEN
    RAISE EXCEPTION 'tournament_config nicht initialisiert';
  END IF;
  IF NOW() >= v_lock_at THEN
    RAISE EXCEPTION 'Weltmeister-Tipp gesperrt';
  END IF;
  NEW.points_earned := CASE
    WHEN v_champion IS NOT NULL AND v_champion = NEW.champion_team THEN 10
    ELSE 0
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_champion_lock ON public.champion_tips;
CREATE TRIGGER trg_champion_lock
  BEFORE INSERT OR UPDATE ON public.champion_tips
  FOR EACH ROW EXECUTE FUNCTION public.enforce_champion_lock();

-- ---------- Re-Wertung Champion-Tipps bei official_champion Update ----------
CREATE OR REPLACE FUNCTION public.recalc_champion_tips() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.champion_tips
     SET points_earned = CASE
       WHEN NEW.official_champion IS NOT NULL AND champion_team = NEW.official_champion THEN 10
       ELSE 0
     END,
         updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalc_champion ON public.tournament_config;
CREATE TRIGGER trg_recalc_champion
  AFTER UPDATE OF official_champion ON public.tournament_config
  FOR EACH ROW EXECUTE FUNCTION public.recalc_champion_tips();
