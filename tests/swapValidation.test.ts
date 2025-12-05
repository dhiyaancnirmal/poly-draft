import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { POST as swapRoute } from '@/app/api/leagues/simulated/swap/route'
import { createSupabaseMock } from './helpers/supabaseMock'

type SwapBody = {
  leagueId?: string
  toMarketId?: string
  toOutcomeSide?: 'YES' | 'NO'
  fromMarketId?: string
  fromOutcomeSide?: 'YES' | 'NO'
  notionalIn?: number
  notionalOut?: number
  price?: number
}

function makeRequest(body: SwapBody, supabase: any, headers: Record<string, string> = {}) {
  const hdrs = new Headers(headers)
  return {
    __supabase: supabase,
    headers: hdrs,
    async json() {
      return body
    },
  } as any
}

test.afterEach(() => {
  mock.restoreAll()
})

test('requires price and positive notional', async () => {
  const supabase = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      leagues: [
        { id: 'l1', mode: 'sim', status: 'live', start_time: null, end_time: null, cadence: 'daily' },
      ],
      league_members: [{ id: 'lm', league_id: 'l1', user_id: 'u1', wallet_address: 'user@test.com' }],
      outcomes: [{ id: 'o1', market_id: 'm1', side: 'YES', current_price: '0.5' }],
      markets: [{ id: 'm1', polymarket_id: 'm1' }],
      swaps: [],
      picks: [],
    },
  })

  const missingPrice = await swapRoute(
    makeRequest({ leagueId: 'l1', toMarketId: 'm1', toOutcomeSide: 'YES' }, supabase, {
      authorization: 'Bearer token',
    })
  )
  assert.equal(missingPrice.status, 400)

  const nonPositive = await swapRoute(
    makeRequest(
      { leagueId: 'l1', toMarketId: 'm1', toOutcomeSide: 'YES', price: 0.4, notionalIn: 0 },
      supabase,
      { authorization: 'Bearer token' }
    )
  )
  assert.equal(nonPositive.status, 400)
})

test('blocks non-members and enforces league window/mode/status', async () => {
  const past = new Date(Date.now() - 60_000).toISOString()
  const future = new Date(Date.now() + 60_000).toISOString()

  const baseTables = {
    league_members: [],
    swaps: [],
    picks: [],
    outcomes: [{ id: 'o1', market_id: 'm1', side: 'YES', current_price: '0.5' }],
    markets: [{ id: 'm1', polymarket_id: 'poly-1' }],
  }

  const supabaseNonMember = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      ...baseTables,
      leagues: [
        { id: 'l1', mode: 'sim', status: 'live', start_time: past, end_time: null, cadence: 'daily' },
      ],
    },
  })
  const resNonMember = await swapRoute(
    makeRequest({ leagueId: 'l1', toMarketId: 'poly-1', toOutcomeSide: 'YES', price: 0.5, notionalIn: 10 }, supabaseNonMember, {
      authorization: 'Bearer token',
    })
  )
  assert.equal(resNonMember.status, 403)

  const supabaseNotStarted = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      ...baseTables,
      leagues: [
        { id: 'l2', mode: 'sim', status: 'live', start_time: future, end_time: null, cadence: 'daily' },
      ],
      league_members: [{ id: 'm2', league_id: 'l2', user_id: 'u1', wallet_address: 'user@test.com' }],
    },
  })
  const resNotStarted = await swapRoute(
    makeRequest({ leagueId: 'l2', toMarketId: 'poly-1', toOutcomeSide: 'YES', price: 0.5, notionalIn: 10 }, supabaseNotStarted, {
      authorization: 'Bearer token',
    })
  )
  assert.equal(resNotStarted.status, 400)

  const supabaseFinalized = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      ...baseTables,
      leagues: [
        { id: 'l3', mode: 'sim', status: 'finalized', start_time: past, end_time: null, cadence: 'daily' },
      ],
      league_members: [{ id: 'm3', league_id: 'l3', user_id: 'u1', wallet_address: 'user@test.com' }],
    },
  })
  const resFinalized = await swapRoute(
    makeRequest({ leagueId: 'l3', toMarketId: 'poly-1', toOutcomeSide: 'YES', price: 0.5, notionalIn: 10 }, supabaseFinalized, {
      authorization: 'Bearer token',
    })
  )
  assert.equal(resFinalized.status, 400)
})

test('enforces per-period swap cap of 3', async () => {
  const start = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  const supabase = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      leagues: [{ id: 'l1', mode: 'sim', status: 'live', start_time: start, end_time: null, cadence: 'daily' }],
      league_members: [{ id: 'm1', league_id: 'l1', user_id: 'u1', wallet_address: 'user@test.com' }],
      swaps: [
        { id: 's1', league_id: 'l1', user_id: 'u1', created_at: new Date().toISOString() },
        { id: 's2', league_id: 'l1', user_id: 'u1', created_at: new Date().toISOString() },
        { id: 's3', league_id: 'l1', user_id: 'u1', created_at: new Date().toISOString() },
      ],
      outcomes: [{ id: 'o1', market_id: 'm1', side: 'YES', current_price: '0.5' }],
      markets: [{ id: 'm1', polymarket_id: 'poly-1' }],
      picks: [],
    },
  })

  const res = await swapRoute(
    makeRequest({ leagueId: 'l1', toMarketId: 'poly-1', toOutcomeSide: 'YES', price: 0.5, notionalIn: 10 }, supabase, {
      authorization: 'Bearer token',
    })
  )
  assert.equal(res.status, 400)
})

test('slippage ±5% enforced when stored price exists and skipped when null', async () => {
  const past = new Date(Date.now() - 60_000).toISOString()

  const supabaseWithPrice = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      leagues: [{ id: 'l1', mode: 'sim', status: 'live', start_time: past, end_time: null, cadence: 'daily' }],
      league_members: [{ id: 'm1', league_id: 'l1', user_id: 'u1', wallet_address: 'user@test.com' }],
      outcomes: [{ id: 'o1', market_id: 'm1', side: 'YES', current_price: '0.50' }],
      markets: [{ id: 'm1', polymarket_id: 'poly-1' }],
      swaps: [],
      picks: [],
    },
  })

  const tooHigh = await swapRoute(
    makeRequest({ leagueId: 'l1', toMarketId: 'poly-1', toOutcomeSide: 'YES', price: 0.57, notionalIn: 5 }, supabaseWithPrice, {
      authorization: 'Bearer token',
    })
  )
  assert.equal(tooHigh.status, 400)

  const supabaseNoStoredPrice = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      leagues: [{ id: 'l2', mode: 'sim', status: 'live', start_time: past, end_time: null, cadence: 'daily' }],
      league_members: [{ id: 'm2', league_id: 'l2', user_id: 'u1', wallet_address: 'user@test.com' }],
      outcomes: [{ id: 'o2', market_id: 'm2', side: 'YES', current_price: null }],
      markets: [{ id: 'm2', polymarket_id: 'poly-2' }],
      swaps: [],
      picks: [],
    },
  })

  const res = await swapRoute(
    makeRequest({ leagueId: 'l2', toMarketId: 'poly-2', toOutcomeSide: 'YES', price: 0.8, notionalIn: 5 }, supabaseNoStoredPrice, {
      authorization: 'Bearer token',
    })
  )
  assert.equal(res.status, 200)
})

test('blocks opposite-side conflicts with existing pick', async () => {
  const past = new Date(Date.now() - 60_000).toISOString()
  const supabase = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      leagues: [{ id: 'l1', mode: 'sim', status: 'live', start_time: past, end_time: null, cadence: 'daily' }],
      league_members: [{ id: 'm1', league_id: 'l1', user_id: 'u1', wallet_address: 'user@test.com' }],
      picks: [{ id: 'p1', league_id: 'l1', user_id: 'u1', market_id: 'm1', outcome_side: 'NO' }],
      outcomes: [{ id: 'o1', market_id: 'm1', side: 'YES', current_price: '0.5' }],
      markets: [{ id: 'm1', polymarket_id: 'poly-1' }],
      swaps: [],
    },
  })

  const res = await swapRoute(
    makeRequest({ leagueId: 'l1', toMarketId: 'poly-1', toOutcomeSide: 'YES', price: 0.5, notionalIn: 5 }, supabase, {
      authorization: 'Bearer token',
    })
  )

  assert.equal(res.status, 400)
})

