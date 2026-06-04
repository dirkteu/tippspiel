-- =====================================================================
-- 0100_fixes.sql — Korrekturen zu 0099
-- 1. random_tile_order() als PLPGSQL VOLATILE, damit nicht inlined
-- 2. recalc_champion_tips() mit explizitem WHERE (Supabase safe_update)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.random_tile_order() RETURNS INT[] AS $$
DECLARE
  result INT[];
BEGIN
  SELECT ARRAY(SELECT generate_series(1,9) ORDER BY random()) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION public.recalc_champion_tips() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.champion_tips
     SET points_earned = CASE
       WHEN NEW.official_champion IS NOT NULL AND champion_team = NEW.official_champion THEN 10
       ELSE 0
     END,
         updated_at = NOW()
   WHERE profile_id IS NOT NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
