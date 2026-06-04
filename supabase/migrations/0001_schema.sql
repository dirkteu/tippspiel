-- =====================================================================
-- Secret Squad — 0001_schema.sql
-- Anonymes Zweier-Team WM 2026 Tippspiel
-- =====================================================================

-- ---------- TEAMS ----------
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_name TEXT,
    invite_code_male TEXT UNIQUE NOT NULL,
    invite_code_female TEXT UNIQUE NOT NULL,
    tile_order INT[] NOT NULL DEFAULT ARRAY(SELECT generate_series(1,9) ORDER BY random()),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ---------- PROFILES ----------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    gender CHAR(1) CHECK (gender IN ('m', 'f')) NOT NULL,
    avatar_url TEXT,
    login_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(team_id, gender)
);

CREATE INDEX IF NOT EXISTS idx_profiles_token ON public.profiles(login_token);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON public.profiles(team_id);

-- ---------- MATCHES ----------
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_name TEXT NOT NULL DEFAULT 'Deutsche Gruppe',
    round TEXT NOT NULL CHECK (round IN ('group','r32','r16','qf','sf','3rd','final')),
    team_1 TEXT NOT NULL,
    team_2 TEXT NOT NULL,
    flag_1 TEXT,                                -- Emoji
    flag_2 TEXT,                                -- Emoji
    match_date TIMESTAMPTZ NOT NULL,
    locked_at TIMESTAMPTZ GENERATED ALWAYS AS (match_date - interval '5 minutes') STORED,
    result_1 INT,
    result_2 INT,
    api_fixture_id BIGINT UNIQUE,
    result_synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_round ON public.matches(round);

-- ---------- TIPS ----------
CREATE TABLE IF NOT EXISTS public.tips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    tip_1 INT NOT NULL CHECK (tip_1 >= 0),
    tip_2 INT NOT NULL CHECK (tip_2 >= 0),
    points_earned INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(profile_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_tips_profile ON public.tips(profile_id);
CREATE INDEX IF NOT EXISTS idx_tips_match ON public.tips(match_id);

-- ---------- CHAMPION TIPS ----------
CREATE TABLE IF NOT EXISTS public.champion_tips (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    champion_team TEXT NOT NULL,
    points_earned INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ---------- TOURNAMENT CONFIG (Single-Row) ----------
CREATE TABLE IF NOT EXISTS public.tournament_config (
    id INT PRIMARY KEY DEFAULT 1,
    champion_lock_at TIMESTAMPTZ NOT NULL,
    official_champion TEXT,
    CHECK (id = 1)
);

-- Default-Konfig falls noch nicht vorhanden (kann Admin nachträglich ändern)
INSERT INTO public.tournament_config (id, champion_lock_at)
VALUES (1, '2026-06-11 18:00:00+02')
ON CONFLICT (id) DO NOTHING;
