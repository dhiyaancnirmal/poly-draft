import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { computeAndStoreScores } from '@/lib/simulated/scoring'
import { computePeriodIndex } from '@/lib/simulated/periods'
import { createSupabaseMock } from './helpers/supabaseMock'

test.afterEach(() => {
  mock.restoreAll()
})

test('computes YES/NO value, pnl vs 0.5, ranking, and winner flag', async () => {
  const now = new Date().toISOString()
  const supabase = createSupabaseMock({
    tables: {
      leagues: [{ id: 'l1', start_time: now, cadence: 'daily' }],
      picks: [
        {
          league_id: 'l1',
          user_id: 'u1',
          wallet_address: 'w1',
          market_id: 'm1',
          market_id_text: 'pm1',
          outcome_id: 'o1',
          outcome_side: 'YES',
          outcome: { current_price: '0.8' },
        },
        {
          league_id: 'l1',
          user_id: 'u2',
          wallet_address: 'w2',
          market_id: 'm1',
          market_id_text: 'pm1',
          outcome_id: 'o2',
          outcome_side: 'NO',
          outcome: { current_price: '0.3' },
        },
      ],
      market_resolutions: [],
      scores: [],
      score_snapshots: [],
    },
  })

  const result = await computeAndStoreScores(supabase as any, 'l1')

  assert.equal(result.scores.length, 2)
  const winner = result.scores.find((s) => s.user_id === 'u1')!
  const runner = result.scores.find((s) => s.user_id === 'u2')!

  assert.equal(winner.points, 80)
  assert.equal(runner.points, 70)
  assert.equal(winner.rank, 1)
  assert.equal(winner.is_winner, true)
  assert.equal(runner.rank, 2)
  assert.equal(runner.is_winner, false)

  const winnerSnap = result.snapshots.find((s) => s.user_id === 'u1')!
  assert.equal(winnerSnap.pnl, '30.0000')
  assert.equal(winnerSnap.portfolio_value, '80.0000')
})

test('uses resolution overrides (YES -> 1, NO -> 0) for scoring and correctness', async () => {
  const now = new Date().toISOString()
  const supabase = createSupabaseMock({
    tables: {
      leagues: [{ id: 'l1', start_time: now, cadence: 'daily' }],
      picks: [
        {
          league_id: 'l1',
          user_id: 'u1',
          wallet_address: 'w1',
          market_id: 'm1',
          market_id_text: 'pm1',
          outcome_id: 'o1',
          outcome_side: 'YES',
          outcome: { current_price: '0.1' }, // should be overridden
        },
      ],
      market_resolutions: [{ market_id: 'm1', winning_outcome: 'YES' }],
      scores: [],
      score_snapshots: [],
    },
  })

  const result = await computeAndStoreScores(supabase as any, 'l1')

  assert.equal(result.scores[0].points, 100)
  assert.equal(result.scores[0].correct_picks, 1)
  assert.equal(result.snapshots[0].pnl, '50.0000')
})

test('computePeriodIndex treats custom cadence as 1-day and respects weekly cadence', () => {
  const start = '2025-01-01T00:00:00Z'
  const asOf = new Date('2025-01-03T00:00:00Z')

  assert.equal(computePeriodIndex(start, 'daily', asOf), 2)
  assert.equal(computePeriodIndex(start, 'custom', asOf), 2) // custom falls back to 1-day
  assert.equal(computePeriodIndex(start, 'weekly', asOf), 0)
})

test('snapshots are upserted per (league,user,period) with formatted strings', async () => {
  const now = new Date().toISOString()
  const supabase = createSupabaseMock({
    tables: {
      leagues: [{ id: 'l1', start_time: now, cadence: 'daily' }],
      picks: [
        {
          league_id: 'l1',
          user_id: 'u1',
          wallet_address: 'w1',
          market_id: 'm1',
          market_id_text: 'pm1',
          outcome_id: 'o1',
          outcome_side: 'YES',
          outcome: { current_price: '0.55' },
        },
      ],
      market_resolutions: [],
      scores: [],
      score_snapshots: [],
    },
  })

  await computeAndStoreScores(supabase as any, 'l1')

  const snapshotUpserts = supabase.__upserts.score_snapshots
  assert.equal(snapshotUpserts.length, 1)
  const snap = snapshotUpserts[0]
  assert.equal(typeof snap.period_index, 'number')
  assert.equal(snap.pnl, '5.0000')
  assert.equal(snap.portfolio_value, '55.0000')
})

