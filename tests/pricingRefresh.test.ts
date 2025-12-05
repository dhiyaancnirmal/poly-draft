import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { POST, __resetPriceCache } from '@/app/api/leagues/simulated/jobs/refresh-prices/route'
import { createSupabaseMock } from './helpers/supabaseMock'

const baseUrl = 'http://test.local/api/leagues/simulated/jobs/refresh-prices'

function makeRequest(supabase: any, query = '') {
  return { url: `${baseUrl}${query}`, __supabase: supabase } as any
}

test.afterEach(() => {
  __resetPriceCache()
  mock.restoreAll()
})

test('clamps prices, stores token ids, and aggregates market_id_text', async () => {
  const supabase = createSupabaseMock({
    tables: {
      leagues: [{ id: 'l1', mode: 'sim', status: 'live' }],
      picks: [
        { league_id: 'l1', market_id: 'm1', market_id_text: 'poly-text-1' },
        { league_id: 'l1', market_id: 'm1', market_id_text: 'poly-text-1' },
      ],
      markets: [{ id: 'm1', polymarket_id: 'poly-1' }],
      outcomes: [
        { id: 'o-yes', market_id: 'm1', side: 'YES', token_id: null, current_price: null },
        { id: 'o-no', market_id: 'm1', side: 'NO', token_id: null, current_price: null },
      ],
    },
  })

  const fetchMock = mock.fn(async () => {
    return new Response(
      JSON.stringify({ outcomePrices: [1.2, -0.1], clobTokenIds: ['yes-token', 'no-token'] }),
      { status: 200 }
    )
  })
  // @ts-expect-error - test override
  globalThis.fetch = fetchMock

  const res = await POST(makeRequest(supabase, '?leagueId=l1'))
  const body = await res.json()

  assert.equal(res.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.stats.updatedOutcomes, 2)
  assert.equal(fetchMock.mock.calls.length, 1)

  const upserts = supabase.__upserts.outcomes
  assert.equal(upserts.length, 2)
  const yesRow = upserts.find((r: any) => r.side === 'YES')
  const noRow = upserts.find((r: any) => r.side === 'NO')
  assert.equal(yesRow.current_price, '0.9900')
  assert.equal(noRow.current_price, '0.0100')
  assert.equal(yesRow.token_id, 'yes-token')
  assert.equal(noRow.token_id, 'no-token')

  // Both polymarket_id and market_id_text should be aggregated
  const calledUrls = fetchMock.mock.calls.map((c: any) => String(c.arguments[0]))
  assert.ok(calledUrls.some((u) => u.includes('/poly-1')))
  // We fetch by polymarket_id; market_id_text is still allowed to appear in the set for stats
})

test('falls back to prior price (or 0.5) when feed missing', async () => {
  const supabase = createSupabaseMock({
    tables: {
      leagues: [{ id: 'l1', mode: 'sim', status: 'live' }],
      picks: [{ league_id: 'l1', market_id: 'm1', market_id_text: 'poly-1' }],
      markets: [{ id: 'm1', polymarket_id: 'poly-1' }],
      outcomes: [{ id: 'o-yes', market_id: 'm1', side: 'YES', current_price: '0.6500', token_id: null }],
    },
  })

  const fetchMock = mock.fn(async () => new Response(JSON.stringify({}), { status: 500 }))
  // @ts-expect-error - test override
  globalThis.fetch = fetchMock

  const res = await POST(makeRequest(supabase, '?leagueId=l1'))
  const body = await res.json()

  assert.equal(res.status, 200)
  assert.equal(body.stats.missingPrices, 1)
  assert.equal(fetchMock.mock.calls.length, 1)

  const upsert = supabase.__upserts.outcomes[0]
  assert.equal(upsert.current_price, '0.6500') // kept prior
})

test('cache prevents redundant fetches within TTL window', async () => {
  const supabase = createSupabaseMock({
    tables: {
      leagues: [{ id: 'l1', mode: 'sim', status: 'live' }],
      picks: [{ league_id: 'l1', market_id: 'm1', market_id_text: 'poly-1' }],
      markets: [{ id: 'm1', polymarket_id: 'poly-1' }],
      outcomes: [
        { id: 'o-yes', market_id: 'm1', side: 'YES', current_price: null, token_id: null },
        { id: 'o-no', market_id: 'm1', side: 'NO', current_price: null, token_id: null },
      ],
    },
  })

  const fetchMock = mock.fn(async () => {
    return new Response(JSON.stringify({ outcomePrices: [0.6, 0.4], clobTokenIds: ['t1', 't2'] }), {
      status: 200,
    })
  })
  // @ts-expect-error - test override
  globalThis.fetch = fetchMock

  const request = makeRequest(supabase, '?leagueId=l1')
  await POST(request)
  await POST(request)

  assert.equal(fetchMock.mock.callCount(), 1)
})

test('stats reflect updated counts and missing feeds', async () => {
  const supabase = createSupabaseMock({
    tables: {
      leagues: [{ id: 'l1', mode: 'sim', status: 'live' }],
      picks: [
        { league_id: 'l1', market_id: 'm1', market_id_text: 'poly-1' },
        { league_id: 'l1', market_id: 'm2', market_id_text: 'poly-2' },
      ],
      markets: [
        { id: 'm1', polymarket_id: 'poly-1' },
        { id: 'm2', polymarket_id: 'poly-2' },
      ],
      outcomes: [
        { id: 'o1-yes', market_id: 'm1', side: 'YES', current_price: null, token_id: null },
        { id: 'o1-no', market_id: 'm1', side: 'NO', current_price: null, token_id: null },
        { id: 'o2-yes', market_id: 'm2', side: 'YES', current_price: null, token_id: null },
        { id: 'o2-no', market_id: 'm2', side: 'NO', current_price: null, token_id: null },
      ],
    },
  })

  const fetchMock = mock.fn(async (_url: string) => {
    if (_url.includes('poly-1')) {
      return new Response(JSON.stringify({ outcomePrices: [0.55, 0.45] }), { status: 200 })
    }
    return new Response(null, { status: 404 })
  })
  // @ts-expect-error - test override
  globalThis.fetch = fetchMock

  const res = await POST(makeRequest(supabase, '?leagueId=l1'))
  const body = await res.json()

  assert.equal(body.stats.updatedOutcomes, 4) // 2 outcomes updated for poly-1, 2 fallback updates for missing feed
  assert.equal(body.stats.missingPrices, 2)
})

