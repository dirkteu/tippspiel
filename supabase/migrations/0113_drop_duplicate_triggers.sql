-- =====================================================================
-- 0113_drop_duplicate_triggers.sql
-- Aufräumen des Schema-Drifts aus 0112: die doppelten, NICHT im Repo
-- definierten Trigger + Funktionen entfernen.
--
-- Die kanonischen Repo-Funktionen übernehmen alles vollständig:
--   matches: trg_recalc_tips -> recalc_tips_for_match()  (Punkte-Neuwertung)
--   tips:    trg_lock_tips    -> enforce_tip_lock()       (Sperre)
--
-- Sicher: Trigger feuern alphabetisch; auf matches lief trg_recalc_tips
-- bereits NACH trg_calculate_points_on_match_update und bestimmte damit
-- schon die finalen points_earned. Das Entfernen ändert keine bestehenden
-- Punktwerte.
-- =====================================================================

DROP TRIGGER IF EXISTS trg_calculate_points_on_match_update ON public.matches;
DROP TRIGGER IF EXISTS trg_check_tip_deadline ON public.tips;

DROP FUNCTION IF EXISTS public.calculate_tip_points();
DROP FUNCTION IF EXISTS public.check_tip_deadline();
