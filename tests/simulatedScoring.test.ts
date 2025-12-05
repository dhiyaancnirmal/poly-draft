import test from 'node:test'
import assert from 'node:assert/strict'
import { computeAndStoreScores } from '@/lib/simulated/scoring'

type MockArgs = {
  league: any
  picks: any[]
  resolutions: any[]
}

function makeSupabase({ league, picks, resolutions }: MockArgs) {
  const scores: any[] = []
  const snapshots: any[] = []

  const supabase = {
    scores,
    snapshots,
    from(table: string) {
      if (table === 'leagues') {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({ data: league, error: null }),
                }
              },
            }
          },
        }
      }
      if (table === 'picks') {
        return {
          select() {
            return {
              eq() {
                return Promise.resolve({ data: picks, error: null })
              },
            }
          },
        }
      }
      if (table === 'market_resolutions') {
        return {
          select() {
            return {
              in: async () => ({ data: resolutions, error: null }),
            }
          },
        }
      }
      if (table === 'scores') {
        return {
          upsert: async (rows: any) => {
            scores.push(...rows)
            return { error: null }
          },
        }
      }
      if (table === 'score_snapshots') {
        return {
          upsert: async (rows: any) => {
            snapshots.push(...rows)
            return { error: null }
          },
        }
      }
      throw new Error(`Unknown table ${table}`)
    },
  }

  return supabase as any
}

test('computes mark-to-market scoring with unresolved prices', async () => {
  const supabase = makeSupabase({
    league: { id: 'l1', start_time: new Date().toISOString(), cadence: 'daily' },
    picks: [
      {
        user_id: 'u1',
        wallet_address: 'w1',
        market_id: 'm1',
        market_id_text: 'pm-1',
        outcome_id: 'o1',
        outcome_side: 'YES',
        outcome: { current_price: '0.7' },
      },
    ],
    resolutions: [],
  })

  const result = await computeAndStoreScores(supabase, 'l1')
  assert.equal(result.scores[0].points, 70)
  assert.equal(result.snapshots[0].pnl, 20)
})

test('uses resolved outcomes for scoring', async () => {
  const supabase = makeSupabase({
    league: { id: 'l1', start_time: new Date().toISOString(), cadence: 'daily' },
    picks: [
      {
        user_id: 'u1',
        wallet_address: 'w1',
        market_id: 'm1',
        market_id_text: 'pm-1',
        outcome_id: 'o1',
        outcome_side: 'NO',
        outcome: { current_price: '0.2' }, // ignored after resolution
      },
    ],
    resolutions: [{ market_id: 'm1', winning_outcome: 'NO' }],
  })

  const result = await computeAndStoreScores(supabase, 'l1')
  assert.equal(result.scores[0].points, 100)
  assert.equal(result.snapshots[0].pnl, 50)
  assert.equal(result.scores[0].correct_picks, 1)
})

