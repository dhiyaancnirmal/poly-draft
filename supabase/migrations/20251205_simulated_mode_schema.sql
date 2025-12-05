-- Simulated mode schema extensions and supporting tables
-- Safe to run on existing data; adds columns, constraints, and new tables.

-- Extend leagues with simulated mode fields and broader status/mode values
ALTER TABLE leagues DROP CONSTRAINT IF EXISTS leagues_mode_check;
ALTER TABLE leagues ADD CONSTRAINT leagues_mode_check CHECK (
  mode IN ('social', 'live', 'competitive', 'sim', 'paid')
);

ALTER TABLE leagues DROP CONSTRAINT IF EXISTS leagues_status_check;
ALTER TABLE leagues ADD CONSTRAINT leagues_status_check CHECK (
  status IN ('open', 'drafting', 'active', 'ended', 'cancelled', 'pending', 'live', 'finalizing', 'finalized')
);

ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS cadence TEXT DEFAULT 'daily' CHECK (cadence IN ('daily', 'weekly', 'custom')),
  ADD COLUMN IF NOT EXISTS markets_per_period INTEGER DEFAULT 1 CHECK (markets_per_period > 0),
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;

-- Enforce one-side-per-market per user within a league
ALTER TABLE picks
  ADD CONSTRAINT picks_unique_league_user_market UNIQUE (league_id, user_id, market_id);

-- Swaps table: off-chain swaps priced/validated in backend
CREATE TABLE IF NOT EXISTS swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  from_pick_id UUID REFERENCES picks(id) ON DELETE SET NULL,
  from_market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
  from_outcome_id UUID REFERENCES outcomes(id) ON DELETE SET NULL,
  to_market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
  to_outcome_id UUID REFERENCES outcomes(id) ON DELETE SET NULL,
  notional_in NUMERIC(14,4) DEFAULT 0,
  notional_out NUMERIC(14,4) DEFAULT 0,
  executed_price NUMERIC(10,4),
  fee NUMERIC(10,4) DEFAULT 0,
  pnl_delta NUMERIC(14,4) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Score snapshots: periodic leaderboard/state captures
CREATE TABLE IF NOT EXISTS score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT,
  period_index INTEGER DEFAULT 0,
  as_of TIMESTAMPTZ DEFAULT NOW(),
  points INTEGER DEFAULT 0,
  pnl NUMERIC(14,4) DEFAULT 0,
  portfolio_value NUMERIC(14,4) DEFAULT 0,
  rank INTEGER,
  correct_picks INTEGER DEFAULT 0,
  total_picks INTEGER DEFAULT 0,
  markets_held INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (league_id, user_id, period_index)
);

-- User proxies: link users to wallets/fid/signer for backend operations
CREATE TABLE IF NOT EXISTS user_proxies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT,
  fid BIGINT,
  signer_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, wallet_address)
);

-- Bridge transfers (UI parity / status tracking)
CREATE TABLE IF NOT EXISTS bridge_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('deposit', 'withdraw', 'claim')),
  amount NUMERIC(14,4) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')),
  tx_hash TEXT,
  chain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pick/swap logs for transparency (off-chain append-only)
CREATE TABLE IF NOT EXISTS pick_swap_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('pick', 'swap')),
  market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
  outcome_id UUID REFERENCES outcomes(id) ON DELETE SET NULL,
  outcome_side TEXT CHECK (outcome_side IN ('YES', 'NO')),
  price NUMERIC(10,4),
  tx_hash TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for new fields/tables
CREATE INDEX IF NOT EXISTS idx_leagues_cadence ON leagues(cadence);
CREATE INDEX IF NOT EXISTS idx_leagues_status ON leagues(status);
CREATE INDEX IF NOT EXISTS idx_leagues_mode ON leagues(mode);
CREATE INDEX IF NOT EXISTS idx_swaps_league_created ON swaps(league_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_snapshots_league_user ON score_snapshots(league_id, user_id);
CREATE INDEX IF NOT EXISTS idx_score_snapshots_as_of ON score_snapshots(as_of DESC);
CREATE INDEX IF NOT EXISTS idx_user_proxies_user ON user_proxies(user_id);
CREATE INDEX IF NOT EXISTS idx_bridge_transfers_user ON bridge_transfers(user_id, wallet_address);
CREATE INDEX IF NOT EXISTS idx_pick_swap_logs_league ON pick_swap_logs(league_id, created_at DESC);

-- RLS for new tables
ALTER TABLE swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_proxies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_swap_logs ENABLE ROW LEVEL SECURITY;

-- Membership predicate helper reused inline: league_id in (select league_id from league_members where user_id/auth wallet)
CREATE POLICY "Swaps visible to league members" ON swaps FOR SELECT USING (
  league_id IN (
    SELECT league_id FROM league_members
    WHERE user_id = auth.uid() OR wallet_address = auth.jwt() ->> 'wallet_address'
  )
);

CREATE POLICY "Users can insert their swaps" ON swaps FOR INSERT WITH CHECK (
  (user_id = auth.uid() OR wallet_address = auth.jwt() ->> 'wallet_address')
  AND league_id IN (
    SELECT league_id FROM league_members
    WHERE user_id = auth.uid() OR wallet_address = auth.jwt() ->> 'wallet_address'
  )
);

CREATE POLICY "Score snapshots visible to league members" ON score_snapshots FOR SELECT USING (
  league_id IN (
    SELECT league_id FROM league_members
    WHERE user_id = auth.uid() OR wallet_address = auth.jwt() ->> 'wallet_address'
  )
);

CREATE POLICY "User proxies visible to owner" ON user_proxies FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User proxies insert by owner" ON user_proxies FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "User proxies update by owner" ON user_proxies FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Bridge transfers visible to owner" ON bridge_transfers FOR SELECT USING (
  user_id = auth.uid() OR wallet_address = auth.jwt() ->> 'wallet_address'
);
CREATE POLICY "Users can insert bridge transfers" ON bridge_transfers FOR INSERT WITH CHECK (
  user_id = auth.uid() OR wallet_address = auth.jwt() ->> 'wallet_address'
);
CREATE POLICY "Users can update bridge transfers" ON bridge_transfers FOR UPDATE USING (
  user_id = auth.uid() OR wallet_address = auth.jwt() ->> 'wallet_address'
);

CREATE POLICY "Logs visible to league members" ON pick_swap_logs FOR SELECT USING (
  league_id IN (
    SELECT league_id FROM league_members
    WHERE user_id = auth.uid() OR wallet_address = auth.jwt() ->> 'wallet_address'
  )
);

-- Realtime publication (optional; safe if already present)
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS swaps;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS score_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS user_proxies;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS bridge_transfers;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS pick_swap_logs;

-- Updated_at triggers for new tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$;
  END IF;
END $$;

CREATE TRIGGER update_user_proxies_updated_at BEFORE UPDATE ON user_proxies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bridge_transfers_updated_at BEFORE UPDATE ON bridge_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


