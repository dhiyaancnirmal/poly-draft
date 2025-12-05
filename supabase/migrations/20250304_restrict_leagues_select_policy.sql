-- Restrict leagues visibility to creator or members (plus service role)

-- Drop prior open select policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'leagues'
      AND policyname = 'leagues_select_all'
  ) THEN
    DROP POLICY leagues_select_all ON public.leagues;
  END IF;
END $$;

-- Create the scoped select policy if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'leagues'
      AND policyname = 'leagues_select_owner_or_member'
  ) THEN
    CREATE POLICY leagues_select_owner_or_member
      ON public.leagues
      FOR SELECT
      USING (
        auth.role() = 'service_role'
        OR created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.league_members lm
          WHERE lm.league_id = leagues.id
            AND lm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

