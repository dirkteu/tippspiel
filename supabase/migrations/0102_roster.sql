-- =====================================================================
-- 0102_roster.sql — Admin-Roster mit Echtnamen + Real-Partner-Exclusion
-- =====================================================================

-- 1. profiles erweitern
ALTER TABLE public.profiles
  ALTER COLUMN username    DROP NOT NULL,
  ALTER COLUMN login_token DROP NOT NULL,
  ALTER COLUMN team_id     DROP NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS real_name       TEXT,
  ADD COLUMN IF NOT EXISTS real_partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invite_code     TEXT,
  ADD COLUMN IF NOT EXISTS joined_at       TIMESTAMPTZ;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_invite_code_unique') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_invite_code_unique UNIQUE (invite_code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_invite_code ON public.profiles(invite_code);
CREATE INDEX IF NOT EXISTS idx_profiles_real_partner ON public.profiles(real_partner_id);

-- 2. teams: Per-Team-Invite-Codes weg
ALTER TABLE public.teams
  DROP COLUMN IF EXISTS invite_code_male,
  DROP COLUMN IF EXISTS invite_code_female;

-- 3. Leere Test-Teams aufräumen (Teams ohne zugewiesene Spieler)
DELETE FROM public.teams t
 WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.team_id = t.id);
