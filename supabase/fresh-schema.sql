-- ========================================
-- RESET DATABASE - DROP ALL EXISTING TABLES
-- ========================================
-- WARNING: This will DELETE ALL DATA in the following tables:
-- users, leagues, league_members, picks, scores
--
-- Only run this if you want to start completely fresh!
-- ========================================

-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS picks CASCADE;
DROP TABLE IF EXISTS league_members CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any other tables that might exist
DROP TABLE IF EXISTS draft_transactions CASCADE;
DROP TABLE IF EXISTS user_presence CASCADE;
DROP TABLE IF EXISTS draft_state CASCADE;
DROP TABLE IF EXISTS market_resolutions CASCADE;
DROP TABLE IF EXISTS outcomes CASCADE;
DROP TABLE IF EXISTS markets CASCADE;

-- Drop views if they exist
DROP VIEW IF EXISTS league_standings CASCADE;
DROP VIEW IF EXISTS user_statistics CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ All tables dropped successfully! Now run the full schema from supabase-schema.sql';
END $$;
-- PolyDraft Fantasy Sports Database Schema
-- Comprehensive schema for fantasy league prediction markets

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- CORE USER & LEAGUE TABLES
-- ========================================

-- Users table - stores user profiles and authentication data
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fid BIGINT UNIQUE, -- Farcaster ID
    display_name TEXT, -- Base app username
    wallet_address TEXT UNIQUE,
    username TEXT,
    auth_method TEXT DEFAULT 'farcaster' CHECK (auth_method IN ('farcaster', 'wallet')),
    avatar_url TEXT,
    bio TEXT,
    
    -- Statistics
    wins INTEGER DEFAULT 0,
    total_leagues INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Leagues table - fantasy league information
CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    on_chain_id BIGINT UNIQUE, -- Smart contract reference
    name TEXT NOT NULL,
    description TEXT,
    creator_address TEXT NOT NULL,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- League settings
    max_players INTEGER DEFAULT 6 CHECK (max_players > 0 AND max_players <= 20),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'drafting', 'active', 'ended', 'cancelled')),
    mode TEXT DEFAULT 'social' CHECK (mode IN ('social', 'live', 'competitive')),
    
    -- Draft settings
    draft_started_at TIMESTAMPTZ,
    draft_completed_at TIMESTAMPTZ,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Configuration
    pick_time_limit INTEGER DEFAULT 60, -- seconds per pick
    auto_pick_enabled BOOLEAN DEFAULT TRUE,
    market_categories TEXT[], -- restrict to specific categories
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- League members table - tracks users in each league
CREATE TABLE IF NOT EXISTS league_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    
    -- Draft information
    draft_order INTEGER, -- Assigned when draft starts
    has_picked_current_round BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(league_id, wallet_address)
);

-- ========================================
-- MARKET DATA TABLES
-- ========================================

-- Markets table - Polymarket market metadata
CREATE TABLE IF NOT EXISTS markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    polymarket_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    subcategory TEXT,
    tags TEXT[],
    
    -- Market timing
    end_time TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    is_resolved BOOLEAN DEFAULT FALSE,
    
    -- Market metadata
    image_url TEXT,
    volume DECIMAL(20,8) DEFAULT 0,
    liquidity DECIMAL(20,8) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Outcomes table - market outcomes (YES/NO positions)
CREATE TABLE IF NOT EXISTS outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    side TEXT NOT NULL CHECK (side IN ('YES', 'NO')),
    token_id TEXT, -- Polymarket token ID
    current_price DECIMAL(10,4) DEFAULT 0.5000,
    implied_probability DECIMAL(5,4) DEFAULT 0.5000,
    volume DECIMAL(20,8) DEFAULT 0,
    liquidity DECIMAL(20,8) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(market_id, side)
);

-- Market resolutions table - track market outcomes
CREATE TABLE IF NOT EXISTS market_resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE UNIQUE,
    winning_outcome TEXT CHECK (winning_outcome IN ('YES', 'NO')),
    final_price_yes DECIMAL(10,4),
    final_price_no DECIMAL(10,4),
    resolved_at TIMESTAMPTZ DEFAULT NOW(),
    resolution_source TEXT DEFAULT 'polymarket' CHECK (resolution_source IN ('polymarket', 'manual', 'oracle')),
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    notes TEXT
);

-- ========================================
-- DRAFT & PICKS TABLES
-- ========================================

-- Draft state table - real-time draft management
CREATE TABLE IF NOT EXISTS draft_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE UNIQUE,
    current_pick_number INTEGER DEFAULT 1,
    current_round INTEGER DEFAULT 1,
    current_user_id UUID REFERENCES users(id),
    time_remaining INTEGER, -- seconds remaining for current pick
    is_paused BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Draft settings
    total_rounds INTEGER,
    picks_per_round INTEGER DEFAULT 1,
    draft_type TEXT DEFAULT 'snake' CHECK (draft_type IN ('snake', 'linear', 'auction')),
    
    -- Timestamps
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Picks table - user draft picks
CREATE TABLE IF NOT EXISTS picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    outcome_id UUID REFERENCES outcomes(id) ON DELETE CASCADE,
    
    -- Pick details
    market_id_text TEXT NOT NULL, -- Store polymarket_id as text for easy lookup
    outcome_side TEXT NOT NULL CHECK (outcome_side IN ('YES', 'NO')),
    round INTEGER NOT NULL CHECK (round > 0),
    pick_number INTEGER NOT NULL CHECK (pick_number > 0),
    draft_order INTEGER, -- User's draft position
    
    -- Resolution tracking
    resolved BOOLEAN DEFAULT FALSE,
    correct BOOLEAN, -- NULL until resolved
    points_earned INTEGER DEFAULT 0,
    
    -- Timestamps
    picked_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(league_id, market_id, outcome_side),
    UNIQUE(league_id, pick_number) -- Each pick number is unique per league
);

-- ========================================
-- SCORING & LEADERBOARD TABLES
-- ========================================

-- Scores table - league scoring and rankings
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    
    -- Scoring data
    points INTEGER DEFAULT 0,
    rank INTEGER,
    is_winner BOOLEAN DEFAULT FALSE,
    correct_picks INTEGER DEFAULT 0,
    total_picks INTEGER DEFAULT 0,
    
    -- Performance metrics
    average_pick_time INTEGER, -- seconds
    best_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    
    -- Timestamps
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(league_id, wallet_address)
);

-- ========================================
-- ACTIVITY LOGGING TABLES
-- ========================================

-- Draft transactions table - log all draft activities
CREATE TABLE IF NOT EXISTS draft_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('pick', 'skip', 'auto_pick', 'join', 'leave', 'pause', 'resume')),
    
    -- Transaction data
    data JSONB, -- Flexible storage for transaction details
    pick_number INTEGER,
    round INTEGER,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User presence table - track online status in draft rooms
CREATE TABLE IF NOT EXISTS user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT TRUE,
    is_drafting BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    
    -- Constraints
    UNIQUE(league_id, user_id)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_fid ON users(fid);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

-- Leagues indexes
CREATE INDEX IF NOT EXISTS idx_leagues_creator ON leagues(creator_address);
CREATE INDEX IF NOT EXISTS idx_leagues_status ON leagues(status);
CREATE INDEX IF NOT EXISTS idx_leagues_end_time ON leagues(end_time);
CREATE INDEX IF NOT EXISTS idx_leagues_created_at ON leagues(created_at);

-- League members indexes
CREATE INDEX IF NOT EXISTS idx_league_members_league ON league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_league_members_draft_order ON league_members(league_id, draft_order);

-- Markets indexes
CREATE INDEX IF NOT EXISTS idx_markets_polymarket_id ON markets(polymarket_id);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);
CREATE INDEX IF NOT EXISTS idx_markets_active ON markets(is_active);
CREATE INDEX IF NOT EXISTS idx_markets_end_time ON markets(end_time);

-- Outcomes indexes
CREATE INDEX IF NOT EXISTS idx_outcomes_market ON outcomes(market_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_side ON outcomes(side);

-- Picks indexes
CREATE INDEX IF NOT EXISTS idx_picks_league ON picks(league_id);
CREATE INDEX IF NOT EXISTS idx_picks_user ON picks(user_id);
CREATE INDEX IF NOT EXISTS idx_picks_round ON picks(league_id, round);
CREATE INDEX IF NOT EXISTS idx_picks_market ON picks(market_id);
CREATE INDEX IF NOT EXISTS idx_picks_resolved ON picks(resolved);

-- Scores indexes
CREATE INDEX IF NOT EXISTS idx_scores_league ON scores(league_id);
CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_points ON scores(league_id, points DESC);

-- Draft state indexes
CREATE INDEX IF NOT EXISTS idx_draft_state_league ON draft_state(league_id);
CREATE INDEX IF NOT EXISTS idx_draft_state_current ON draft_state(current_user_id);

-- Presence indexes
CREATE INDEX IF NOT EXISTS idx_user_presence_league ON user_presence(league_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_online ON user_presence(is_online, last_seen);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies - MVP (open but secure)

-- Users can view all users, update only their own profile
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = fid::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = fid::text);

-- Leagues are publicly readable, only creators can modify
CREATE POLICY "Leagues are publicly readable" ON leagues FOR SELECT USING (true);
CREATE POLICY "Anyone can create leagues" ON leagues FOR INSERT WITH CHECK (true);
CREATE POLICY "Creators can update their leagues" ON leagues FOR UPDATE USING (creator_address = auth.jwt() ->> 'wallet_address');
CREATE POLICY "Creators can delete their leagues" ON leagues FOR DELETE USING (creator_address = auth.jwt() ->> 'wallet_address');

-- League members - users can see members, join/leave their own
CREATE POLICY "League members are visible to all" ON league_members FOR SELECT USING (true);
CREATE POLICY "Users can join leagues" ON league_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can leave leagues" ON league_members FOR DELETE USING (wallet_address = auth.jwt() ->> 'wallet_address');

-- Markets and outcomes are publicly readable
CREATE POLICY "Markets are publicly readable" ON markets FOR SELECT USING (true);
CREATE POLICY "Outcomes are publicly readable" ON outcomes FOR SELECT USING (true);
CREATE POLICY "Market resolutions are publicly readable" ON market_resolutions FOR SELECT USING (true);

-- Picks are visible to league members
CREATE POLICY "Picks visible to league members" ON picks FOR SELECT USING (
    league_id IN (SELECT league_id FROM league_members WHERE wallet_address = auth.jwt() ->> 'wallet_address')
);
CREATE POLICY "Users can make picks" ON picks FOR INSERT WITH CHECK (
    wallet_address = auth.jwt() ->> 'wallet_address' AND
    league_id IN (SELECT league_id FROM league_members WHERE wallet_address = auth.jwt() ->> 'wallet_address')
);

-- Scores are visible to league members
CREATE POLICY "Scores visible to league members" ON scores FOR SELECT USING (
    league_id IN (SELECT league_id FROM league_members WHERE wallet_address = auth.jwt() ->> 'wallet_address')
);

-- Draft state visible to league members
CREATE POLICY "Draft state visible to league members" ON draft_state FOR SELECT USING (
    league_id IN (SELECT league_id FROM league_members WHERE wallet_address = auth.jwt() ->> 'wallet_address')
);

-- Activity logging
CREATE POLICY "Draft transactions visible to league members" ON draft_transactions FOR SELECT USING (
    league_id IN (SELECT league_id FROM league_members WHERE wallet_address = auth.jwt() ->> 'wallet_address')
);
CREATE POLICY "Users can create draft transactions" ON draft_transactions FOR INSERT WITH CHECK (true);

-- User presence visible to league members
CREATE POLICY "User presence visible to league members" ON user_presence FOR SELECT USING (
    league_id IN (SELECT league_id FROM league_members WHERE wallet_address = auth.jwt() ->> 'wallet_address')
);
CREATE POLICY "Users can insert their presence" ON user_presence FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their presence" ON user_presence FOR UPDATE USING (user_id = auth.uid());

-- ========================================
-- REALTIME SUBSCRIPTIONS
-- ========================================

-- Enable Realtime on key tables for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE leagues;
ALTER PUBLICATION supabase_realtime ADD TABLE league_members;
ALTER PUBLICATION supabase_realtime ADD TABLE picks;
ALTER PUBLICATION supabase_realtime ADD TABLE scores;
ALTER PUBLICATION supabase_realtime ADD TABLE draft_state;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE markets;
ALTER PUBLICATION supabase_realtime ADD TABLE outcomes;

-- ========================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_league_members_updated_at BEFORE UPDATE ON league_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_outcomes_updated_at BEFORE UPDATE ON outcomes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_draft_state_updated_at BEFORE UPDATE ON draft_state FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- League standings view
CREATE OR REPLACE VIEW league_standings
WITH (security_invoker = true)
AS
SELECT
    l.id as league_id,
    l.name as league_name,
    u.id as user_id,
    u.display_name,
    u.wallet_address,
    s.points,
    s.rank,
    s.correct_picks,
    s.total_picks,
    s.is_winner,
    lm.joined_at,
    lm.draft_order
FROM leagues l
JOIN league_members lm ON l.id = lm.league_id
JOIN users u ON lm.user_id = u.id
LEFT JOIN scores s ON l.id = s.league_id AND u.id = s.user_id
WHERE l.status IN ('active', 'ended')
ORDER BY l.id, s.points DESC, s.rank ASC;

-- User statistics view
CREATE OR REPLACE VIEW user_statistics
WITH (security_invoker = true)
AS
SELECT
    u.id,
    u.display_name,
    u.wallet_address,
    u.wins,
    u.total_leagues,
    u.total_points,
    COUNT(DISTINCT l.id) as active_leagues,
    COUNT(p.id) as total_picks_made,
    COUNT(CASE WHEN p.correct = true THEN 1 END) as correct_predictions,
    ROUND(COUNT(CASE WHEN p.correct = true THEN 1 END)::DECIMAL / NULLIF(COUNT(p.id), 0) * 100, 2) as accuracy_percentage
FROM users u
LEFT JOIN league_members lm ON u.id = lm.user_id
LEFT JOIN leagues l ON lm.league_id = l.id AND l.status IN ('active', 'drafting')
LEFT JOIN picks p ON u.id = p.user_id
GROUP BY u.id, u.display_name, u.wallet_address, u.wins, u.total_leagues, u.total_points;

-- ========================================
-- SAMPLE DATA (only one entry per table as requested)
-- ========================================

-- Sample user
INSERT INTO users (fid, display_name, wallet_address, username) 
VALUES (12345, 'Sample User', '0x1234567890123456789012345678901234567890', 'sampleuser')
ON CONFLICT (wallet_address) DO NOTHING;

-- Sample league
INSERT INTO leagues (name, description, creator_address, end_time, max_players)
VALUES ('Sample League', 'A sample fantasy league for testing', '0x1234567890123456789012345678901234567890', NOW() + INTERVAL '30 days', 6)
ON CONFLICT (on_chain_id) DO NOTHING;

-- Sample market
INSERT INTO markets (polymarket_id, title, description, category, end_time)
VALUES ('market_123', 'Will BTC reach $100k by end of year?', 'Bitcoin price prediction market', 'cryptocurrency', NOW() + INTERVAL '90 days')
ON CONFLICT (polymarket_id) DO NOTHING;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

-- Schema setup complete
DO $$
BEGIN
    RAISE NOTICE 'PolyDraft database schema setup complete!';
    RAISE NOTICE 'Tables: users, leagues, league_members, markets, outcomes, picks, scores, draft_state, market_resolutions, draft_transactions, user_presence';
    RAISE NOTICE 'Features: RLS enabled, Realtime enabled, Indexes created, Views created, Triggers added';
END $$;