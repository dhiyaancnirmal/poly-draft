import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { POST as swapRoute } from '@/app/api/leagues/simulated/swap/route'
import { createSupabaseMock } from './helpers/supabaseMock'

const baseUrl = 'http://test.local'

test.afterEach(() => {
    mock.restoreAll()
})

test('finalize settles delta and records tx metadata', async () => {
    const writeMock = mock.fn(async () => '0xtesthash' as `0x${string}`)
    const waitMock = mock.fn(async () => ({}))
        ; (globalThis as any).__predixClients = {
            cfg: {
                managerAddress: '0x000000000000000000000000000000000000dEaD',
                chainId: 84532,
                rpcUrl: '',
                chain: {} as any,
                account: {} as any,
            },
            walletClient: { writeContract: writeMock },
            publicClient: { waitForTransactionReceipt: waitMock },
        }

    const { POST: finalizeJob } = await import('@/app/api/leagues/simulated/jobs/finalize/route')

    const supabase = createSupabaseMock({
        tables: {
            leagues: [{ id: 'l1', mode: 'sim', status: 'active' }],
            scores: [
                {
                    id: 's1',
                    league_id: 'l1',
                    user_id: 'u1',
                    wallet_address: '0x0000000000000000000000000000000000000001',
                    points: 100,
                    predix_settled_points: 40,
                    settlement_status: 'pending',
                    settlement_tx_hash: null,
                    correct_picks: 0,
                    total_picks: 0,
                    rank: 1,
                    is_winner: false,
                    average_pick_time: null,
                    best_streak: 0,
                    current_streak: 0,
                    updated_at: new Date().toISOString(),
                },
            ],
        },
    })

    const res = await finalizeJob({ url: `${baseUrl}/api/leagues/simulated/jobs/finalize?leagueId=l1`, __supabase: supabase } as any)
    const body = await res.json()

    assert.equal(res.status, 200)
    assert.equal(body.success, true)
    assert.equal(writeMock.mock.callCount(), 1)

    const updated = supabase.__getTable('scores')[0]
    assert.equal(updated.predix_settled_points, 100)
    assert.equal(updated.settlement_status, 'confirmed')
    assert.equal(updated.settlement_tx_hash, '0xtesthash')
    delete (globalThis as any).__predixClients
})

test('swap rejects when price exceeds slippage tolerance', async () => {
    const supabase = createSupabaseMock({
        authUser: { id: 'u1', user_metadata: { wallet_address: '0xabc0000000000000000000000000000000000000' } },
        tables: {
            leagues: [{ id: 'l1', mode: 'sim', status: 'active', start_time: null, end_time: null, cadence: 'daily' }],
            league_members: [{ id: 'lm1', league_id: 'l1', user_id: 'u1', wallet_address: '0xabc0000000000000000000000000000000000000' }],
            markets: [{ id: 'm1', polymarket_id: 'poly-1', title: 't1', end_time: null, is_active: true, is_resolved: false }],
            outcomes: [{ id: 'o1', market_id: 'm1', side: 'YES', current_price: '0.50', token_id: null }],
            picks: [],
            swaps: [],
            pick_swap_logs: [],
        },
    })

    const request = {
        url: `${baseUrl}/api/leagues/simulated/swap`,
        json: async () => ({
            leagueId: 'l1',
            toMarketId: 'poly-1',
            toOutcomeSide: 'YES',
            price: 0.7, // 0.20 away from reference 0.50
            notionalIn: 10,
        }),
        headers: new Headers(),
        __supabase: supabase,
    } as any

    const res = await swapRoute(request)
    const body = await res.json()
    assert.equal(res.status, 400)
    assert.equal(body.success, false)
    assert.ok(String(body.error).includes('slippage'))

    // ensure no swap inserted
    assert.equal((supabase.__inserts.swaps || []).length, 0)
})


