-- =====================================================================
-- 0112_tip_lock_drift_fix.sql
-- Fix: Admin konnte für gespielte Spiele KEIN Ergebnis eintragen
--      ("Tippen gesperrt! Die Frist endete 5 Minuten vor Anpfiff.").
--
-- Ursache = Schema-Drift in PROD: Zusätzlich zu den im Repo definierten
-- Triggern (trg_recalc_tips -> recalc_tips_for_match, trg_lock_tips ->
-- enforce_tip_lock) existierten in der Produktiv-DB ZWEI weitere, NICHT
-- im Repo dokumentierte Trigger:
--   matches: trg_calculate_points_on_match_update -> calculate_tip_points()
--   tips:    trg_check_tip_deadline               -> check_tip_deadline()
--
-- Beim Ergebnis-Eintrag (UPDATE matches.result_*) feuert die Punkte-
-- Neuwertung, die public.tips aktualisiert. Das löste die Sperr-Trigger
-- auf tips aus, die nach Anpfiff eine Exception warfen -> Ergebnis konnte
-- für KEIN Spiel mit Tipps gesetzt werden (auch nicht im Admin).
--
-- Fix: Beide Sperr-Funktionen (enforce_tip_lock UND die gedriftete
-- check_tip_deadline) lassen System-Recalcs durch — erkannt an
--   (a) gesetztem Transaktions-Flag app.recalc, ODER
--   (b) UPDATE, bei dem tip_1/tip_2 unverändert bleiben (nur Punkte).
-- recalc_tips_for_match setzt das Flag zusätzlich explizit.
--
-- Hinweis: calculate_tip_points()/trg_calculate_points_on_match_update
-- sind Drift und im Repo nicht definiert. Sie bleiben hier unangetastet;
-- der Guard in check_tip_deadline deckt ihren Recalc-Pfad ab.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.recalc_tips_for_match() RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_config('app.recalc', 'on', true);   -- nur in dieser Transaktion
  UPDATE public.tips
     SET points_earned = public.calc_points(tip_1, tip_2, NEW.result_1, NEW.result_2),
         updated_at = NOW()
   WHERE match_id = NEW.id;
  PERFORM set_config('app.recalc', 'off', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.enforce_tip_lock() RETURNS TRIGGER AS $$
DECLARE
  v_lock_at TIMESTAMPTZ;
BEGIN
  IF current_setting('app.recalc', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.tip_1 IS NOT DISTINCT FROM OLD.tip_1
     AND NEW.tip_2 IS NOT DISTINCT FROM OLD.tip_2 THEN
    RETURN NEW;
  END IF;

  SELECT locked_at INTO v_lock_at FROM public.matches WHERE id = NEW.match_id;
  IF v_lock_at IS NULL THEN
    RAISE EXCEPTION 'Match % nicht gefunden', NEW.match_id;
  END IF;
  IF NOW() >= v_lock_at THEN
    RAISE EXCEPTION 'Tippen gesperrt! Die Frist endete 5 Minuten vor Anpfiff.';
  END IF;
  SELECT public.calc_points(NEW.tip_1, NEW.tip_2, result_1, result_2) INTO NEW.points_earned
    FROM public.matches WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Gedriftete zweite Sperr-Funktion (existiert nur in PROD, hier zur
-- Reproduzierbarkeit mitgeführt): gleicher Guard.
CREATE OR REPLACE FUNCTION public.check_tip_deadline()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_match_date TIMESTAMP WITH TIME ZONE;
BEGIN
  IF current_setting('app.recalc', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.tip_1 IS NOT DISTINCT FROM OLD.tip_1
     AND NEW.tip_2 IS NOT DISTINCT FROM OLD.tip_2 THEN
    RETURN NEW;
  END IF;

  SELECT match_date INTO v_match_date FROM public.matches WHERE id = NEW.match_id;
  IF NOW() > (v_match_date - INTERVAL '5 minutes') THEN
    RAISE EXCEPTION 'Tippen gesperrt! Die Frist endete 5 Minuten vor Anpfiff.';
  END IF;

  RETURN NEW;
END;
$function$;
