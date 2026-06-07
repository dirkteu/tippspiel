-- =====================================================================
-- 0108_function_search_path.sql
--
-- Setzt fuer alle vorhandenen Funktionen einen leeren search_path,
-- damit Supabase-Linter-Warnungen "Function Search Path Mutable" weg sind.
--
-- Hintergrund:
--   Ohne expliziten search_path koennte ein Angreifer per
--   `SET search_path = 'evil_schema'` eine Funktion dazu bringen,
--   unqualifizierte Refs auf untergeschobene Objekte umzuleiten.
--   Da alle Funktions-Bodies hier bereits voll qualifiziert sind
--   (`public.tips`, `public.matches`, ...) und Built-ins immer aus
--   `pg_catalog` aufgeloest werden, ist `SET search_path = ''` ein
--   No-Op fuers Verhalten — nur Hardening.
--
-- Idempotent: ALTER FUNCTION kann beliebig oft wiederholt werden.
--
-- Rollback (falls noetig):
--   ALTER FUNCTION public.<name>(...) RESET search_path;
-- =====================================================================

ALTER FUNCTION public.calc_points(INT, INT, INT, INT)            SET search_path = '';
ALTER FUNCTION public.calculate_tip_points()                     SET search_path = '';
ALTER FUNCTION public.check_tip_deadline()                       SET search_path = '';
ALTER FUNCTION public.enforce_champion_lock()                    SET search_path = '';
ALTER FUNCTION public.enforce_tip_lock()                         SET search_path = '';
ALTER FUNCTION public.random_tile_order()                        SET search_path = '';
ALTER FUNCTION public.recalc_champion_tips()                     SET search_path = '';
ALTER FUNCTION public.recalc_tips_for_match()                    SET search_path = '';
ALTER FUNCTION public.set_locked_at()                            SET search_path = '';

-- Verifikation: alle Funktionen sollten jetzt search_path='' in proconfig haben
SELECT proname, proconfig
  FROM pg_proc
 WHERE pronamespace = 'public'::regnamespace
   AND proname IN (
     'calc_points', 'calculate_tip_points', 'check_tip_deadline',
     'enforce_champion_lock', 'enforce_tip_lock', 'random_tile_order',
     'recalc_champion_tips', 'recalc_tips_for_match', 'set_locked_at'
   )
 ORDER BY proname;
