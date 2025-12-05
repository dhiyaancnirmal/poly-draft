import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { POST, __resetPriceCache } from '@/app/api/leagues/simulated/jobs/refresh-prices/route'
import { computeAndStoreScores } from '@/lib/simulated/scoring'
import { createSupabaseMock } from './helpers/supabaseMock'

const baseUrl = 'http://test.local/api/leagues/simulated/jobs/refresh-prices'

function makeRefreshRequest(supabase: any) {
  return { url: `${baseUrl}?leagueId=l1`, __supabase: supabase } as any
}

test.afterEach(() => {
  __resetPriceCache()
  mock.restoreAll()
})

test('price refresh feeds scoring and snapshots in order', async () => {
  const now = new Date().toISOString()
  const supabase = createSupabaseMock({
    tables: {
      leagues: [{ id: 'l1', mode: 'sim', status: 'live', start_time: now, cadence: 'daily' }],
      picks: [
        {
          id: 'p1',
          league_id: 'l1',
          user_id: 'u1',
          wallet_address: 'w1',
          market_id: 'm1',
          market_id_text: 'poly-1',
          outcome_id: 'o1-yes',
          outcome_side: 'YES',
        },
        {
          id: 'p2',
          league_id: 'l1',
          user_id: 'u2',
          wallet_address: 'w2',
          market_id: 'm1',
          market_id_text: 'poly-1',
          outcome_id: 'o1-no',
          outcome_side: 'NO',
        },
      ],
      markets: [{ id: 'm1', polymarket_id: 'poly-1' }],
      outcomes: [
        { id: 'o1-yes', market_id: 'm1', side: 'YES', current_price: null, token_id: null },
        { id: 'o1-no', market_id: 'm1', side: 'NO', current_price: null, token_id: null },
      ],
      market_resolutions: [],
      scores: [],
      score_snapshots: [],
    },
    authUser: { id: 'u1' }, // not used by refresh
  })

  const fetchMock = mock.fn(async () => {
    return new Response(JSON.stringify({ outcomePrices: [0.65, 0.35], clobTokenIds: ['ty', 'tn'] }), { status: 200 })
  })
  // @ts-expect-error - test override
  globalThis.fetch = fetchMock

  const refreshRes = await POST(makeRefreshRequest(supabase))
  assert.equal(refreshRes.status, 200)
  const outcomes = supabase.__getTable('outcomes')
  const yes = outcomes.find((o: any) => o.id === 'o1-yes')
  const no = outcomes.find((o: any) => o.id === 'o1-no')
  assert.equal(yes.current_price, '0.6500')
  assert.equal(no.current_price, '0.3500')

  const scores1 = await computeAndStoreScores(supabase as any, 'l1')
  assert.equal(scores1.scores.length, 2)
  assert.equal(scores1.scores[0].rank, 1)
  assert.equal(scores1.scores[0].is_winner, true)
  assert.equal(scores1.snapshots[0].points, scores1.scores[0].points)

  // Idempotent-friendly: running again should keep ordering
  const scores2 = await computeAndStoreScores(supabase as any, 'l1')
  assert.equal(scores2.scores[0].rank, 1)
  assert.equal(scores2.scores[1].rank, 2)
})

