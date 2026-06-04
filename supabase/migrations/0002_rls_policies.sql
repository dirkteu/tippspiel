-- =====================================================================
-- 0002_rls_policies.sql — Default-Deny RLS
-- Der Browser spricht ausschließlich mit eigenen API-Routes (Service Role).
-- RLS bleibt trotzdem an, damit ein durchgesickerter Anon-Key keinen Schaden anrichtet.
-- =====================================================================

ALTER TABLE public.teams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.champion_tips      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_config  ENABLE ROW LEVEL SECURITY;

-- Anon/authenticated kommen NICHT direkt an die Daten. Keine SELECT-Policies → Default Deny.
-- Service-Role-Key umgeht RLS automatisch (das ist by-design in Supabase).
