-- =====================================================================
-- Secret Squad — 0099_apply_all.sql
-- Konsolidierte Migration: ergänzt das vorhandene Basis-Schema um alle
-- nötigen Spalten, Trigger, Storage-Bucket und Initial-Daten.
-- Idempotent — kann mehrfach ausgeführt werden.
-- Einfach im Supabase SQL Editor komplett ausführen.
-- =====================================================================

-- ---------- 1. TEAMS: tile_order ergänzen ----------
-- Helfer-Funktion: zufällige Permutation [1..9].
-- (Subqueries in DEFAULT sind in Postgres verboten — daher als Funktion.)
CREATE OR REPLACE FUNCTION public.random_tile_order() RETURNS INT[] AS $$
  SELECT ARRAY(SELECT generate_series(1,9) ORDER BY random())
$$ LANGUAGE SQL VOLATILE;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS tile_order INT[] NOT NULL
    DEFAULT public.random_tile_order();

-- ---------- 2. PROFILES: UNIQUE(team_id, gender) absichern ----------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_team_gender_unique'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_team_gender_unique UNIQUE (team_id, gender);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_token ON public.profiles(login_token);
CREATE INDEX IF NOT EXISTS idx_profiles_team  ON public.profiles(team_id);

-- ---------- 3. MATCHES: Erweiterungs-Spalten ----------
-- locked_at als regulärer Column + Trigger (GENERATED scheitert,
-- weil timestamptz-Arithmetik nicht IMMUTABLE ist).
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS round TEXT,
  ADD COLUMN IF NOT EXISTS flag_1 TEXT,
  ADD COLUMN IF NOT EXISTS flag_2 TEXT,
  ADD COLUMN IF NOT EXISTS api_fixture_id BIGINT,
  ADD COLUMN IF NOT EXISTS result_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- Backfill: locked_at = match_date - 5 min
UPDATE public.matches SET locked_at = match_date - interval '5 minutes'
 WHERE locked_at IS NULL AND match_date IS NOT NULL;

-- Trigger hält locked_at konsistent mit match_date
CREATE OR REPLACE FUNCTION public.set_locked_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.locked_at := NEW.match_date - interval '5 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_locked_at ON public.matches;
CREATE TRIGGER trg_set_locked_at
  BEFORE INSERT OR UPDATE OF match_date ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_locked_at();

-- Default 'group' nachträglich + NOT NULL setzen
UPDATE public.matches SET round = 'group' WHERE round IS NULL;
ALTER TABLE public.matches ALTER COLUMN round SET NOT NULL;
ALTER TABLE public.matches ALTER COLUMN round SET DEFAULT 'group';

-- CHECK-Constraint für gültige Runden
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_round_check') THEN
    ALTER TABLE public.matches ADD CONSTRAINT matches_round_check
      CHECK (round IN ('group','r32','r16','qf','sf','3rd','final'));
  END IF;
END $$;

-- UNIQUE auf api_fixture_id (falls noch nicht da)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_api_fixture_unique') THEN
    ALTER TABLE public.matches ADD CONSTRAINT matches_api_fixture_unique UNIQUE (api_fixture_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_matches_date  ON public.matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_round ON public.matches(round);

-- ---------- 4. TIPS: Indizes ----------
CREATE INDEX IF NOT EXISTS idx_tips_profile ON public.tips(profile_id);
CREATE INDEX IF NOT EXISTS idx_tips_match   ON public.tips(match_id);

-- ---------- 5a. champion_tips Tabelle (falls noch nicht da) ----------
CREATE TABLE IF NOT EXISTS public.champion_tips (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    champion_team TEXT NOT NULL,
    points_earned INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ---------- 5b. tournament_config Tabelle (falls noch nicht da) ----------
CREATE TABLE IF NOT EXISTS public.tournament_config (
    id INT PRIMARY KEY DEFAULT 1,
    champion_lock_at TIMESTAMPTZ NOT NULL,
    official_champion TEXT,
    CHECK (id = 1)
);

-- ---------- 5c. tournament_config: Initial-Row ----------
INSERT INTO public.tournament_config (id, champion_lock_at)
VALUES (1, '2026-06-11 18:00:00+02')
ON CONFLICT (id) DO NOTHING;

-- ---------- 6. RLS Default-Deny (Service-Role umgeht das) ----------
ALTER TABLE public.teams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.champion_tips      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_config  ENABLE ROW LEVEL SECURITY;

-- ---------- 7. Punkte-Funktion + Recalc-Trigger ----------
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

-- ---------- 8. Sperrfrist-Trigger Tipps ----------
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
  SELECT public.calc_points(NEW.tip_1, NEW.tip_2, result_1, result_2) INTO NEW.points_earned
    FROM public.matches WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lock_tips ON public.tips;
CREATE TRIGGER trg_lock_tips
  BEFORE INSERT OR UPDATE ON public.tips
  FOR EACH ROW EXECUTE FUNCTION public.enforce_tip_lock();

-- ---------- 9. Sperrfrist Champion-Tipp ----------
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

-- ---------- 10. Storage-Bucket 'avatars' ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, 524288, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = 524288,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

-- ---------- Fertig ----------
-- Verifikation (optional):
SELECT 'teams.tile_order' AS spalte,
       column_default IS NOT NULL AS has_default,
       data_type
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='teams' AND column_name='tile_order';
