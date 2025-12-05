-- Predix settlement support: token settlement tracking + tx logging

ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS predix_settled_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS settlement_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'sent', 'confirmed', 'failed')),
  ADD COLUMN IF NOT EXISTS settlement_error TEXT,
  ADD COLUMN IF NOT EXISTS settlement_updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE pick_swap_logs
  ADD COLUMN IF NOT EXISTS tx_status TEXT CHECK (tx_status IN ('pending', 'sent', 'confirmed', 'failed')),
  ADD COLUMN IF NOT EXISTS tx_error TEXT,
  ADD COLUMN IF NOT EXISTS chain_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_scores_settlement_status ON scores(settlement_status);
CREATE INDEX IF NOT EXISTS idx_pick_swap_logs_tx_hash ON pick_swap_logs(tx_hash);

-- Block inserts when league is finalizing/finalized (defense in depth)
DROP POLICY IF EXISTS "Block picks during finalizing" ON picks;
CREATE POLICY "Block picks during finalizing" ON picks FOR INSERT WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM leagues l WHERE l.id = picks.league_id AND l.status IN ('finalizing','finalized')
  )
);

DROP POLICY IF EXISTS "Block swaps during finalizing" ON swaps;
CREATE POLICY "Block swaps during finalizing" ON swaps FOR INSERT WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM leagues l WHERE l.id = swaps.league_id AND l.status IN ('finalizing','finalized')
  )
);



