'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { OutcomeSide } from '@/lib/supabase/database-types'
import { computePeriodIndex } from '@/lib/simulated/periods'

type SwapBody = {
    leagueId?: string
    toMarketId?: string
    toOutcomeSide?: OutcomeSide
    fromMarketId?: string
    fromOutcomeSide?: OutcomeSide
    notionalIn?: number
    notionalOut?: number
    price?: number
    fee?: number
    pnlDelta?: number
    metadata?: any
    marketTitle?: string
    endTime?: string
}

function badRequest(message: string, detail?: any) {
    return NextResponse.json({ success: false, error: message, detail }, { status: 400 })
}

async function ensureMarketAndOutcome(
    supabase: any,
    marketId: string,
    outcomeSide: OutcomeSide,
    opts: { title?: string; endTime?: string }
): Promise<{ marketIdUuid: string; outcomeId: string }> {
    const { data: existingMarket } = await supabase
        .from('markets')
        .select('id')
        .eq('polymarket_id', marketId)
        .maybeSingle()

    let marketIdUuid = existingMarket?.id as string | undefined

    if (!marketIdUuid) {
        const { data: created, error: marketError } = await supabase
            .from('markets')
            .insert({
                polymarket_id: marketId,
                title: opts.title || marketId,
                end_time: opts.endTime || null,
                is_active: true,
                is_resolved: false,
            })
            .select('id')
            .single()
        if (marketError || !created) {
            throw new Error(marketError?.message || 'Failed to create market')
        }
        marketIdUuid = created.id
    }

    const { data: existingOutcome } = await supabase
        .from('outcomes')
        .select('id')
        .eq('market_id', marketIdUuid)
        .eq('side', outcomeSide)
        .maybeSingle()

    let outcomeId = existingOutcome?.id as string | undefined
    if (!outcomeId) {
        const { data: createdOutcome, error: outcomeError } = await supabase
            .from('outcomes')
            .insert({
                market_id: marketIdUuid,
                side: outcomeSide,
            })
            .select('id')
            .single()
        if (outcomeError || !createdOutcome) {
            throw new Error(outcomeError?.message || 'Failed to create outcome')
        }
        outcomeId = createdOutcome.id
    }

    if (!marketIdUuid || !outcomeId) {
        throw new Error('Failed to prepare market/outcome')
    }

    return { marketIdUuid, outcomeId }
}

export async function POST(request: NextRequest) {
    const body = (await request.json().catch(() => ({}))) as SwapBody
    const leagueId = body.leagueId?.trim()
    const toMarketId = body.toMarketId?.trim()
    const toOutcomeSide = body.toOutcomeSide as OutcomeSide | undefined

    if (!leagueId) return badRequest('leagueId is required')
    if (!toMarketId) return badRequest('toMarketId is required')
    if (!toOutcomeSide || !['YES', 'NO'].includes(toOutcomeSide)) {
        return badRequest('toOutcomeSide must be YES or NO')
    }
    if (typeof body.price !== 'number') {
        return badRequest('price is required')
    }

    const supabase = (await createServerClient()) as any
    const token = request.headers.get('authorization')?.replace(/Bearer\s+/i, '') || undefined
    const { data: authData, error: authError } = await supabase.auth.getUser(token)
    if (authError || !authData?.user) {
        return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }
    const user = authData.user

    const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select('id, mode, status, start_time, end_time, cadence')
        .eq('id', leagueId)
        .maybeSingle()

    if (leagueError || !league) {
        return NextResponse.json(
            { success: false, error: leagueError?.message || 'League not found' },
            { status: 404 }
        )
    }

    if (league.mode !== 'sim') {
        return badRequest('League is not in simulated mode')
    }
    if (['ended', 'cancelled', 'finalizing', 'finalized'].includes(league.status)) {
        return badRequest(`League is not accepting swaps (status=${league.status})`)
    }

    const now = new Date()
    const startTime = league.start_time ? new Date(league.start_time) : null
    const endTime = league.end_time ? new Date(league.end_time) : null
    if (startTime && now < startTime) return badRequest('League has not started yet')
    if (endTime && now > endTime) return badRequest('League is closed for swaps')

    const memberWallet =
        (user.user_metadata as any)?.wallet_address ||
        (user.user_metadata as any)?.wallet ||
        user.email ||
        user.id

    const { data: membership } = await supabase
        .from('league_members')
        .select('id')
        .eq('league_id', league.id)
        .or(`user_id.eq.${user.id},wallet_address.eq.${memberWallet}`)
        .maybeSingle()

    if (!membership) {
        return NextResponse.json({ success: false, error: 'User is not a member of this league' }, { status: 403 })
    }

    let toMarketOutcome
    let fromMarketOutcome: { marketIdUuid: string; outcomeId: string } | undefined
    try {
        toMarketOutcome = await ensureMarketAndOutcome(supabase, toMarketId, toOutcomeSide, {
            title: body.marketTitle,
            endTime: body.endTime,
        })
        if (body.fromMarketId && body.fromOutcomeSide && ['YES', 'NO'].includes(body.fromOutcomeSide)) {
            fromMarketOutcome = await ensureMarketAndOutcome(
                supabase,
                body.fromMarketId,
                body.fromOutcomeSide as OutcomeSide,
                { title: body.marketTitle, endTime: body.endTime }
            )
        }
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err?.message || 'Failed to prepare market/outcome' }, { status: 500 })
    }

    const notionalIn = typeof body.notionalIn === 'number' ? body.notionalIn : null
    const notionalOut = typeof body.notionalOut === 'number' ? body.notionalOut : null
    if (!notionalIn && !notionalOut) {
        return badRequest('notionalIn or notionalOut is required')
    }
    if ((notionalIn ?? 0) <= 0 && (notionalOut ?? 0) <= 0) {
        return badRequest('notional must be positive')
    }

    const swapPayload = {
        league_id: league.id,
        user_id: user.id,
        wallet_address: memberWallet,
        from_market_id: fromMarketOutcome?.marketIdUuid || null,
        from_outcome_id: fromMarketOutcome?.outcomeId || null,
        to_market_id: toMarketOutcome.marketIdUuid,
        to_outcome_id: toMarketOutcome.outcomeId,
        notional_in: notionalIn ?? 0,
        notional_out: notionalOut ?? 0,
        executed_price: body.price,
        fee: body.fee ?? 0,
        pnl_delta: body.pnlDelta ?? 0,
        metadata: body.metadata ?? null,
    }

    const currentPeriod = computePeriodIndex(league.start_time, league.cadence, now)
    const { data: priorSwaps, error: priorSwapError } = await supabase
        .from('swaps')
        .select('created_at')
        .eq('league_id', league.id)
        .eq('user_id', user.id)

    if (priorSwapError) {
        return NextResponse.json({ success: false, error: priorSwapError.message }, { status: 500 })
    }

    const swapsThisPeriod = (priorSwaps || []).filter((s: any) => {
        const created = s.created_at ? new Date(s.created_at) : null
        return computePeriodIndex(league.start_time, league.cadence, created ?? now) === currentPeriod
    }).length
    if (swapsThisPeriod >= 3) {
        return badRequest('Swap limit reached for this period')
    }

    // Prevent opposite-side conflicts within the league for this market
    const { data: conflictingPick, error: conflictError } = await supabase
        .from('picks')
        .select('id')
        .eq('league_id', league.id)
        .eq('user_id', user.id)
        .eq('market_id', toMarketOutcome.marketIdUuid)
        .neq('outcome_side', toOutcomeSide)
        .maybeSingle()

    if (conflictError) {
        return NextResponse.json({ success: false, error: conflictError.message }, { status: 500 })
    }
    if (conflictingPick) {
        return badRequest('Cannot swap into opposite side for an existing pick')
    }

    // Slippage check vs current price
    const { data: refOutcome, error: refError } = await supabase
        .from('outcomes')
        .select('current_price')
        .eq('id', toMarketOutcome.outcomeId)
        .maybeSingle()

    if (refError) {
        return NextResponse.json({ success: false, error: refError.message }, { status: 500 })
    }

    if (typeof body.price === 'number' && refOutcome?.current_price !== undefined && refOutcome?.current_price !== null) {
        const refPrice = Number(refOutcome.current_price)
        const tolerance = 0.1 // allow ±10% absolute price difference to reduce false rejects when prices are slightly stale
        if (Number.isFinite(refPrice) && Math.abs(body.price - refPrice) > tolerance) {
            return badRequest('Price exceeds slippage tolerance')
        }
    }

    const { data: swap, error: swapError } = await (supabase
        .from('swaps') as any)
        .insert(swapPayload)
        .select('id, league_id, user_id, to_market_id, to_outcome_id, notional_in, notional_out, executed_price')
        .single()

    if (swapError || !swap) {
        return NextResponse.json(
            { success: false, error: swapError?.message || 'Failed to record swap' },
            { status: 500 }
        )
    }

    await supabase.from('pick_swap_logs').insert({
        league_id: league.id,
        user_id: user.id,
        action: 'swap',
        market_id: toMarketOutcome.marketIdUuid,
        outcome_id: toMarketOutcome.outcomeId,
        outcome_side: toOutcomeSide,
        price: body.price ?? null,
    })

    return NextResponse.json({ success: true, swap })
}

