-- Fix RLS policies for users table
-- The original policies compared auth.uid() (UUID) to fid (BIGINT) which never matched
-- This prevented ALL user inserts and updates from working

-- Drop old broken policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create correct policies that check auth.uid() against the id field (both UUIDs)
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users FOR UPDATE
USING (auth.uid() = id);

-- Verify policies are created
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
