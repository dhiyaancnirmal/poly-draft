# Your Tasks: Backend & Supabase Infrastructure
**Role:** Backend Lead (Full-Stack)
**Timeline:** 36 hours
**Core Deliverable:** Supabase database + API routes + draft engine + scoring system

---

## Your Mission
You're building the entire backend that makes the game work. Supabase stores everything, API routes handle game logic, and your draft engine orchestrates the multiplayer experience.

**Critical:** Your work blocks Person 4 (frontend). Prioritize getting Supabase credentials shared by Hour 4 and API routes working by Hour 14.

---

## Phase 1: Supabase Setup (Hours 0-4)

### Create Project
1. Go to https://supabase.com
2. Create new project: "polydraft-mvp"
3. Choose region close to you
4. Wait for database to provision (~2 minutes)

### Get Credentials

From Supabase dashboard → Settings → API:
- Project URL
- anon/public key
- service_role key (keep this secret!)

### Add to Environment

Update `.env`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_KEY=eyJhb... (for backend only!)
```

### Install Client

```bash
npm install @supabase/supabase-js
```

### Create Supabase Clients

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

Create `lib/supabase/server.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!, // Has full access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

### **SHARE CREDENTIALS WITH TEAM BY HOUR 4**

Post in team channel:
```
✅ Supabase is live!

Add these to your .env file:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...

@Person4 - You can now start using Supabase Realtime for draft sync
```

---

## Phase 2: Database Schema (Hours 4-8)

### Open SQL Editor

Supabase Dashboard → SQL Editor → New Query

### Run This Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  wins INT DEFAULT 0,
  total_leagues INT DEFAULT 0,
  total_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leagues table
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  on_chain_id BIGINT UNIQUE, -- from smart contract
  name TEXT NOT NULL,
  creator_address TEXT NOT NULL,
  max_players INT DEFAULT 6,
  status TEXT DEFAULT 'open', -- open, drafting, active, ended
  mode TEXT DEFAULT 'social', -- social, live
  draft_started_at TIMESTAMP,
  end_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- League members
CREATE TABLE league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  wallet_address TEXT NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  draft_order INT, -- assigned when draft starts (1, 2, 3...)
  UNIQUE(league_id, wallet_address)
);

-- Picks table
CREATE TABLE picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  wallet_address TEXT NOT NULL,
  market_id TEXT NOT NULL, -- Polymarket market ID
  outcome_side TEXT NOT NULL, -- 'YES' or 'NO'
  round INT NOT NULL,
  pick_number INT NOT NULL, -- overall pick number in draft
  picked_at TIMESTAMP DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  correct BOOLEAN, -- set when market resolves
  UNIQUE(league_id, market_id, outcome_side) -- Lock market+side combo
);

-- Scores table
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  wallet_address TEXT NOT NULL,
  points INT DEFAULT 0,
  rank INT,
  is_winner BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(league_id, wallet_address)
);

-- Indexes for performance
CREATE INDEX idx_leagues_status ON leagues(status);
CREATE INDEX idx_picks_league ON picks(league_id);
CREATE INDEX idx_picks_user ON picks(user_id);
CREATE INDEX idx_scores_league ON scores(league_id);
CREATE INDEX idx_league_members_league ON league_members(league_id);

-- Enable Realtime for draft room
ALTER PUBLICATION supabase_realtime ADD TABLE picks;
ALTER PUBLICATION supabase_realtime ADD TABLE league_members;
ALTER PUBLICATION supabase_realtime ADD TABLE leagues;
```

### Enable Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Policies (for MVP, allow all reads, authenticated writes)
CREATE POLICY "Anyone can read leagues" ON leagues FOR SELECT USING (true);
CREATE POLICY "Anyone can read picks" ON picks FOR SELECT USING (true);
CREATE POLICY "Anyone can read scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Anyone can read members" ON league_members FOR SELECT USING (true);
CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (true);

-- For MVP hackathon, allow inserts/updates (in production, tighten this)
CREATE POLICY "Anyone can insert leagues" ON leagues FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert picks" ON picks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert members" ON league_members FOR INSERT WITH CHECK (true);
```

---

## Phase 3: API Routes (Hours 8-14)

**See the full task file for detailed API route implementations including:**
- Create League Endpoint
- Join League Endpoint
- Draft Engine Logic
- Draft Pick Endpoint
- List Leagues & Get League Details

All API routes with complete TypeScript code are included in the original plan.

---

## Phase 4: Scoring System (Hours 20-26)

**See the full task file for scoring calculator implementation**

---

## Your Checklist

**Hours 0-4:**
- [ ] Create Supabase project
- [ ] Get credentials
- [ ] Share credentials with team
- [ ] Install Supabase client
- [ ] Create client files

**Hours 4-8:**
- [ ] Design and run database schema
- [ ] Enable Realtime on picks/leagues tables
- [ ] Set up RLS policies
- [ ] Test queries in Supabase dashboard

**Hours 8-14:**
- [ ] Create `/api/leagues/create`
- [ ] Create `/api/leagues/[id]/join`
- [ ] Create `/api/leagues` (list)
- [ ] Create `/api/leagues/[id]` (details)
- [ ] Create `/api/draft/pick`
- [ ] Build `lib/draft/engine.ts`
- [ ] Test all endpoints with Postman/curl

**Hours 14-20:**
- [ ] Help Person 4 integrate API routes
- [ ] Debug draft pick flow
- [ ] Test real-time updates

**Hours 20-26:**
- [ ] Build scoring calculator
- [ ] Create `/api/scoring/calculate` endpoint
- [ ] Integrate with smart contract commitWinner()
- [ ] Test scoring with resolved markets

**Hours 26-36:**
- [ ] Add Live Builder Mode integration (if time)
- [ ] Polish error handling
- [ ] Test end-to-end flows

---

## Key Contacts

- **Person 4 (Frontend):** Your API routes block their integration. Prioritize getting endpoints working by Hour 14.
- **Person 1 (Contracts):** You need their contract address and backend signer setup.

---

## Troubleshooting

**"Relation does not exist"**
→ Re-run your SQL schema, make sure tables are created

**"Row Level Security policy violation"**
→ Check your RLS policies, may need to adjust for MVP

**"Invalid API key"**
→ Check `.env` has correct Supabase keys

**Realtime not working**
→ Verify tables are added to `supabase_realtime` publication
