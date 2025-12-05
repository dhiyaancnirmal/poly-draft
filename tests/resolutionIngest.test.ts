import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { POST as resolutionsJob } from '@/app/api/leagues/simulated/jobs/resolutions/route'
import { createSupabaseMock } from './helpers/supabaseMock'

const baseUrl = 'http://test.local/api/leagues/simulated/jobs/resolutions'

function makeRequest(supabase: any, query = '') {
    return { url: `${baseUrl}${query}`, __supabase: supabase } as any
}

test.afterEach(() => {
    mock.restoreAll()
})

test('ingests winning outcome into market_resolutions', async () => {
    const supabase = createSupabaseMock({
        tables: {
            leagues: [{ id: 'l1', mode: 'sim', status: 'active' }],
            picks: [{ league_id: 'l1', market_id: 'm1', market_id_text: 'poly-1' }],
            markets: [{ id: 'm1', polymarket_id: 'poly-1' }],
            market_resolutions: [],
        },
    })

    const fetchMock = mock.fn(async () => {
        return new Response(
            JSON.stringify({
                winningOutcome: 'YES',
                resolutionTime: '2024-01-01T00:00:00Z',
                resolutionSource: 'polymarket',
            }),
            { status: 200 }
        )
    })
    // @ts-expect-error - test override
    globalThis.fetch = fetchMock

    const res = await resolutionsJob(makeRequest(supabase, '?leagueId=l1'))
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(body.success, true)
    assert.equal(body.stats.resolved, 1)

    const upserts = supabase.__upserts.market_resolutions
    assert.equal(upserts.length, 1)
    assert.equal(upserts[0].winning_outcome, 'YES')
    assert.equal(upserts[0].final_price_yes, '1')
})


