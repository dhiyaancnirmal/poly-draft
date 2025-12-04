# Apply Supabase Schema Instructions

## Current Status
✅ Supabase connection verified
✅ Environment variables configured
⚠️  Schema partially applied (some tables exist, others missing)

## Tables Status
- ✅ users
- ✅ leagues
- ✅ league_members
- ✅ picks
- ✅ scores
- ❌ markets (missing)
- ❌ outcomes (missing)
- ❌ draft_state (missing)
- ❌ market_resolutions (missing)
- ❌ draft_transactions (missing)
- ❌ user_presence (missing)

## How to Apply Full Schema

### Option 1: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/wlgjwaihjbrtblvoqxgz
2. Navigate to: **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql`
5. Paste into the query editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for completion (should take 10-20 seconds)

### Option 2: Link CLI and Push

```bash
# Link to your remote project
supabase link --project-ref wlgjwaihjbrtblvoqxgz

# Apply the schema
supabase db push
```

## After Schema is Applied

Verify everything worked:
```bash
npx tsx test-supabase.ts
```

All tables should now show ✅

## What the Schema Creates

- **Tables**: 11 core tables with proper relationships
- **Indexes**: Performance indexes on all key fields
- **RLS Policies**: Row Level Security enabled with MVP-friendly policies
- **Realtime**: WebSocket subscriptions on key tables
- **Triggers**: Auto-update timestamps
- **Views**: league_standings and user_statistics
- **Sample Data**: One sample entry per table for testing

## Notes

The schema uses `CREATE TABLE IF NOT EXISTS` so it won't overwrite existing tables, but will create any missing ones. Your existing data in users, leagues, league_members, picks, and scores will be preserved.
