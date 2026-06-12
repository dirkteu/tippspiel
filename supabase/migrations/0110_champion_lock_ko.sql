-- =====================================================================
-- 0110_champion_lock_ko.sql — Weltmeister-Sperrfrist auf erstes KO-Spiel
--
-- Bug: Der Fallback champion_lock_at stand auf dem Eröffnungsspiel
-- (11.06. 18:00) — seitdem war der Weltmeister-Tipp für alle gesperrt,
-- obwohl laut Spec (0107) bis 5 Min vor dem ersten KO-Spiel getippt
-- werden darf. Solange keine r32/r16-Spiele angelegt sind, greift in
-- enforce_champion_lock() genau dieser Fallback.
--
-- Fix: Fallback auf Anstoß Spiel 73 (28.06.2026, 21:00 CEST) minus 5 Min.
-- Sobald KO-Spiele in der DB sind, übernimmt automatisch die dynamische
-- Frist aus 0107 (identischer Zeitpunkt).
-- =====================================================================

UPDATE public.tournament_config
   SET champion_lock_at = '2026-06-28 20:55:00+02'
 WHERE id = 1;
