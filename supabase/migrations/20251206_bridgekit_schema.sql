-- BridgeKit schema extensions for paid leagues
-- Extends user_proxies and bridge_transfers for USDC bridging (Base -> Polygon)

-- ========================================
-- EXTEND user_proxies TABLE
-- ========================================

-- Add Polygon proxy address for Polymarket trades
ALTER TABLE user_proxies
  ADD COLUMN IF NOT EXISTS polygon_proxy_address TEXT;

-- Add proxy creation status tracking
ALTER TABLE user_proxies
  ADD COLUMN IF NOT EXISTS proxy_status TEXT DEFAULT 'pending'
    CHECK (proxy_status IN ('pending', 'ready', 'error'));

-- Add last check timestamp
ALTER TABLE user_proxies
  ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- Add error message storage
ALTER TABLE user_proxies
  ADD COLUMN IF NOT EXISTS proxy_error TEXT;

-- Index for proxy lookups
CREATE INDEX IF NOT EXISTS idx_user_proxies_polygon_proxy
  ON user_proxies(polygon_proxy_address)
  WHERE polygon_proxy_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_proxies_status
  ON user_proxies(proxy_status);

-- ========================================
-- EXTEND bridge_transfers TABLE
-- ========================================

-- Add idempotency key for deduplication
ALTER TABLE bridge_transfers
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- Add token type (default USDC)
ALTER TABLE bridge_transfers
  ADD COLUMN IF NOT EXISTS token TEXT DEFAULT 'USDC';

-- Add source chain identifier
ALTER TABLE bridge_transfers
  ADD COLUMN IF NOT EXISTS from_chain TEXT;

-- Add destination chain identifier
ALTER TABLE bridge_transfers
  ADD COLUMN IF NOT EXISTS to_chain TEXT;

-- Add destination address (Polygon proxy)
ALTER TABLE bridge_transfers
  ADD COLUMN IF NOT EXISTS dest_address TEXT;

-- Add bridge state tracking (more granular than status)
ALTER TABLE bridge_transfers
  ADD COLUMN IF NOT EXISTS bridge_state TEXT DEFAULT 'pending'
    CHECK (bridge_state IN ('pending', 'attesting', 'minted', 'failed', 'error'));

-- Add source chain transaction hash
ALTER TABLE bridge_transfers
  ADD COLUMN IF NOT EXISTS tx_hash_from TEXT;

-- Add destination chain transaction hash
ALTER TABLE bridge_transfers
  ADD COLUMN IF NOT EXISTS tx_hash_to TEXT;

-- Add full bridge result from SDK (JSONB for flexibility)
ALTER TABLE bridge_transfers
  ADD COLUMN IF NOT EXISTS bridge_result JSONB;

-- Indexes for bridge transfer queries
CREATE INDEX IF NOT EXISTS idx_bridge_transfers_idempotency
  ON bridge_transfers(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bridge_transfers_bridge_state
  ON bridge_transfers(bridge_state);

CREATE INDEX IF NOT EXISTS idx_bridge_transfers_dest_address
  ON bridge_transfers(dest_address)
  WHERE dest_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bridge_transfers_chains
  ON bridge_transfers(from_chain, to_chain);

-- ========================================
-- PAID LEAGUES TABLE (optional, for on-chain sync)
-- ========================================

-- Track on-chain paid league state for reconciliation
CREATE TABLE IF NOT EXISTS paid_leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE UNIQUE,
  on_chain_league_id TEXT NOT NULL, -- bytes32 as hex string
  buy_in_cents INTEGER NOT NULL,
  buy_in_usdc NUMERIC(14,6) NOT NULL,
  max_players INTEGER NOT NULL,
  pool_usdc NUMERIC(14,6) DEFAULT 0,
  contract_address TEXT NOT NULL,
  chain TEXT NOT NULL, -- 'polygon' or 'polygon-amoy'
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'active', 'settled', 'cancelled')),
  settlement_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track paid league participants (for reconciliation with on-chain)
CREATE TABLE IF NOT EXISTS paid_league_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paid_league_id UUID REFERENCES paid_leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  proxy_address TEXT, -- Polygon proxy used for join
  join_tx_hash TEXT,
  payout_usdc NUMERIC(14,6),
  payout_tx_hash TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(paid_league_id, user_id)
);

-- Indexes for paid leagues
CREATE INDEX IF NOT EXISTS idx_paid_leagues_league_id ON paid_leagues(league_id);
CREATE INDEX IF NOT EXISTS idx_paid_leagues_on_chain_id ON paid_leagues(on_chain_league_id);
CREATE INDEX IF NOT EXISTS idx_paid_leagues_status ON paid_leagues(status);
CREATE INDEX IF NOT EXISTS idx_paid_league_participants_league ON paid_league_participants(paid_league_id);
CREATE INDEX IF NOT EXISTS idx_paid_league_participants_user ON paid_league_participants(user_id);

-- RLS for new tables
ALTER TABLE paid_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE paid_league_participants ENABLE ROW LEVEL SECURITY;

-- Paid leagues visible to participants
CREATE POLICY "Paid leagues visible to members" ON paid_leagues FOR SELECT USING (
  league_id IN (
    SELECT league_id FROM league_members
    WHERE user_id = auth.uid() OR wallet_address = auth.jwt() ->> 'wallet_address'
  )
);

-- Participants visible to league members
CREATE POLICY "Paid participants visible to league members" ON paid_league_participants FOR SELECT USING (
  paid_league_id IN (
    SELECT pl.id FROM paid_leagues pl
    JOIN league_members lm ON pl.league_id = lm.league_id
    WHERE lm.user_id = auth.uid() OR lm.wallet_address = auth.jwt() ->> 'wallet_address'
  )
);

-- Owner can insert paid leagues (via service role)
CREATE POLICY "Service can insert paid leagues" ON paid_leagues FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update paid leagues" ON paid_leagues FOR UPDATE USING (true);
CREATE POLICY "Service can insert participants" ON paid_league_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update participants" ON paid_league_participants FOR UPDATE USING (true);

-- Updated_at trigger for paid_leagues
CREATE TRIGGER update_paid_leagues_updated_at
  BEFORE UPDATE ON paid_leagues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Realtime for paid leagues (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS paid_leagues;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS paid_league_participants;

