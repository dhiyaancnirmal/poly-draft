# Critical Database Fix - Apply This Now

## Problem
Your RLS policies were blocking ALL user inserts because they compared `auth.uid()` (UUID) to `fid` (BIGINT), which never matched.

## Fix Applied to Code ✅
- Fixed RLS policies in `supabase/fresh-schema.sql`
- Fixed error handling in `app/splash/page.tsx`
- Fixed `proxy.ts` bug

## DATABASE MIGRATION REQUIRED

You MUST run this SQL in your Supabase dashboard to fix the live database:

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the sidebar

### Step 2: Run This SQL

Copy and paste this entire SQL block:

```sql
-- Fix RLS policies for users table
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can insert their own profile" ON users FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users FOR UPDATE
USING (auth.uid() = id);

-- Verify it worked
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

### Step 3: Verify Success
After running the SQL, you should see this output:

| schemaname | tablename | policyname | cmd |
|------------|-----------|------------|-----|
| public | users | Users can insert their own profile | INSERT |
| public | users | Users can update own profile | UPDATE |
| public | users | Users can view all users | SELECT |

### Step 4: Enable Anonymous Sign-Ins (if not already)
1. In Supabase Dashboard → Authentication → Providers
2. Scroll to "Anonymous sign-ins"
3. Toggle it ON
4. Click Save

### Step 5: Test Authentication
1. Clear any old auth sessions: In your browser, open DevTools → Application → Storage → Clear site data
2. Go to `/splash` page
3. Click "Sign in with Base"
4. Complete Farcaster authentication
5. You should be redirected to `/app`

### Step 6: Verify User Created
Go back to Supabase SQL Editor and run:

```sql
SELECT id, fid, username, display_name, auth_method, created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;
```

You should now see your user record! 🎉

---

## What Was Wrong?

**Before (Broken)**:
```sql
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT
WITH CHECK (auth.uid()::text = fid::text);
-- auth.uid() = "550e8400-e29b-41d4-a716-446655440000" (UUID)
-- fid = 3 (BIGINT)
-- NEVER MATCHES → ALL INSERTS BLOCKED ❌
```

**After (Fixed)**:
```sql
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT
WITH CHECK (auth.uid() = id);
-- auth.uid() = "550e8400-e29b-41d4-a716-446655440000"
-- id = "550e8400-e29b-41d4-a716-446655440000"
-- MATCHES → INSERTS ALLOWED ✅
```

---

## Troubleshooting

If authentication still fails after applying the fix:

1. **Check browser console for errors**
2. **Clear all browser data** for localhost:3000
3. **Verify anonymous auth is enabled** in Supabase Dashboard
4. **Check the error message** - it should now display prominently in red

Need help? The error messages should now actually show instead of being hidden!
