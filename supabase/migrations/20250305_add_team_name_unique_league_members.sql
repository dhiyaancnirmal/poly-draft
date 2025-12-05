-- Add team_name for per-league team identity and unique membership constraint

ALTER TABLE public.league_members
  ADD COLUMN IF NOT EXISTS team_name text;

-- Enforce one membership per user per league
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'league_members_league_user_key'
  ) THEN
    CREATE UNIQUE INDEX league_members_league_user_key ON public.league_members(league_id, user_id);
  END IF;
END $$;

