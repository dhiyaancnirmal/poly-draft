import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { POST as pickRoute } from '@/app/api/leagues/simulated/pick/route'
import { createSupabaseMock } from './helpers/supabaseMock'

type ReqBody = {
  leagueId?: string
  marketId?: string
  outcomeSide?: 'YES' | 'NO'
  marketTitle?: string
  price?: number
  endTime?: string
}

function makeRequest(body: ReqBody, supabase: any, headers: Record<string, string> = {}) {
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

test('requires authentication', async () => {
  const supabase = createSupabaseMock({
    tables: { leagues: [], league_members: [] },
    authUser: null as any,
  })
  const res = await pickRoute(
    makeRequest({ leagueId: 'l1', marketId: 'm1', outcomeSide: 'YES' }, supabase, {})
  )
  assert.equal(res.status, 401)
})

test('blocks non-members', async () => {
  const supabase = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      leagues: [
        {
          id: 'l1',
          mode: 'sim',
          status: 'live',
          start_time: new Date(Date.now() - 1000).toISOString(),
          end_time: null,
          markets_per_period: 2,
          cadence: 'daily',
        },
      ],
      league_members: [],
    },
  })

  const res = await pickRoute(
    makeRequest({ leagueId: 'l1', marketId: 'm1', outcomeSide: 'YES' }, supabase, {
      authorization: 'Bearer token',
    })
  )

  assert.equal(res.status, 403)
})

test('enforces start/end windows and mode/status guards', async () => {
  const future = new Date(Date.now() + 60_000).toISOString()
  const past = new Date(Date.now() - 60_000).toISOString()

  const supabaseNotStarted = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      leagues: [
        { id: 'l1', mode: 'sim', status: 'live', start_time: future, end_time: null, markets_per_period: 1, cadence: 'daily' },
      ],
      league_members: [{ id: 'm1', league_id: 'l1', user_id: 'u1', wallet_address: 'user@test.com' }],
    },
  })
  const resNotStarted = await pickRoute(
    makeRequest({ leagueId: 'l1', marketId: 'm1', outcomeSide: 'YES' }, supabaseNotStarted, {
      authorization: 'Bearer token',
    })
  )
  assert.equal(resNotStarted.status, 400)

  const supabaseClosed = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      leagues: [
        {
          id: 'l2',
          mode: 'sim',
          status: 'ended',
          start_time: past,
          end_time: past,
          markets_per_period: 1,
          cadence: 'daily',
        },
      ],
      league_members: [{ id: 'm2', league_id: 'l2', user_id: 'u1', wallet_address: 'user@test.com' }],
    },
  })
  const resEnded = await pickRoute(
    makeRequest({ leagueId: 'l2', marketId: 'm1', outcomeSide: 'YES' }, supabaseClosed, {
      authorization: 'Bearer token',
    })
  )
  assert.equal(resEnded.status, 400)

  const supabaseWrongMode = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      leagues: [
        { id: 'l3', mode: 'live', status: 'live', start_time: past, end_time: null, markets_per_period: 1, cadence: 'daily' },
      ],
      league_members: [{ id: 'm3', league_id: 'l3', user_id: 'u1', wallet_address: 'user@test.com' }],
    },
  })
  const resWrongMode = await pickRoute(
    makeRequest({ leagueId: 'l3', marketId: 'm1', outcomeSide: 'YES' }, supabaseWrongMode, {
      authorization: 'Bearer token',
    })
  )
  assert.equal(resWrongMode.status, 400)
})

test('enforces per-period pick cap (markets_per_period) using computePeriodIndex', async () => {
  const start = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  const supabase = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      leagues: [
        { id: 'l1', mode: 'sim', status: 'live', start_time: start, end_time: null, markets_per_period: 1, cadence: 'daily' },
      ],
      league_members: [{ id: 'm1', league_id: 'l1', user_id: 'u1', wallet_address: 'user@test.com' }],
      picks: [
        {
          id: 'p1',
          league_id: 'l1',
          user_id: 'u1',
          market_id: 'm1',
          picked_at: new Date().toISOString(),
        },
      ],
    },
  })

  const res = await pickRoute(
    makeRequest({ leagueId: 'l1', marketId: 'm2', outcomeSide: 'YES' }, supabase, {
      authorization: 'Bearer token',
    })
  )
  assert.equal(res.status, 400)
})

test('increments pick_number and round based on markets_per_period', async () => {
  const supabase = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com', user_metadata: { wallet_address: 'wallet1' } },
    tables: {
      leagues: [
        { id: 'l1', mode: 'sim', status: 'live', start_time: null, end_time: null, markets_per_period: 2, cadence: 'daily' },
      ],
      league_members: [{ id: 'm1', league_id: 'l1', user_id: 'u1', wallet_address: 'wallet1' }],
      picks: [{ id: 'p-last', league_id: 'l1', user_id: 'u1', market_id: 'm-existing', pick_number: 2, picked_at: null }],
      markets: [{ id: 'm-existing', polymarket_id: 'existing' }],
      outcomes: [{ id: 'o-existing', market_id: 'm-existing', side: 'YES' }],
    },
  })

  const res = await pickRoute(
    makeRequest({ leagueId: 'l1', marketId: 'poly-new', outcomeSide: 'YES' }, supabase, {
      authorization: 'Bearer token',
    })
  )
  const body = await res.json()

  assert.equal(res.status, 200)
  assert.equal(body.pick.pick_number, 3)
  assert.equal(body.pick.round, 2)
})

test('surfacing unique constraint errors for duplicate side per market', async () => {
  const baseSupabase = createSupabaseMock({
    authUser: { id: 'u1', email: 'user@test.com' },
    tables: {
      leagues: [
        { id: 'l1', mode: 'sim', status: 'live', start_time: null, end_time: null, markets_per_period: 2, cadence: 'daily' },
      ],
      league_members: [{ id: 'm1', league_id: 'l1', user_id: 'u1', wallet_address: 'user@test.com' }],
      picks: [],
      markets: [],
      outcomes: [],
    },
  })

  const supabase: any = {
    ...baseSupabase,
    from(table: string) {
      const base = baseSupabase.from(table)
      if (table !== 'picks') return base
      const insert = () => ({
        select() {
          return {
            async single() {
              return { data: null, error: { message: 'duplicate key value violates unique constraint "picks_unique_league_user_market"' } }
            },
          }
        },
      })
      return { ...base, insert }
    },
  }

  const res = await pickRoute(
    makeRequest({ leagueId: 'l1', marketId: 'poly-dup', outcomeSide: 'YES' }, supabase, {
      authorization: 'Bearer token',
    })
  )

  assert.equal(res.status, 500)
})

