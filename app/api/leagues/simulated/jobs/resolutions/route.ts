'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { recordJobMetric } from '@/lib/jobs/metrics'

const GAMMA_API = 'https://gamma-api.polymarket.com'

type ResolutionRow = {
    market_id: string
    winning_outcome: 'YES' | 'NO' | null
    final_price_yes: string | null
    final_price_no: string | null
    resolved_at: string
    resolution_source: 'polymarket' | 'manual' | 'oracle'
    notes?: string | null
}

async function fetchResolution(polymarketId: string) {
    try {
        const res = await fetch(`${GAMMA_API}/markets/${polymarketId}`, {
            headers: { Accept: 'application/json', 'User-Agent': 'PolyDraft/1.0' },
            cache: 'no-store',
        })
        if (!res.ok) return null
        const data = await res.json()
        return data
    } catch (err) {
        console.error('Resolution fetch error', polymarketId, err)
        return null
    }
}

function parseWinningOutcome(raw: any): { outcome: 'YES' | 'NO' | null; resolvedAt?: string } {
    const winnerField =
        raw?.winningOutcome || raw?.winner || raw?.resolution || raw?.resolvedOutcome || raw?.resolvedOutcomeId
    if (typeof winnerField === 'string') {
        const upper = winnerField.toUpperCase()
        if (upper.includes('YES')) return { outcome: 'YES', resolvedAt: raw?.resolutionTime ?? raw?.resolvedTime }
        if (upper.includes('NO')) return { outcome: 'NO', resolvedAt: raw?.resolutionTime ?? raw?.resolvedTime }
    }

    const outcomePrices = raw?.outcomePrices
    if (Array.isArray(outcomePrices) && outcomePrices.length >= 2) {
        if (Number(outcomePrices[0]) === 1) return { outcome: 'YES' }
        if (Number(outcomePrices[0]) === 0) return { outcome: 'NO' }
    }

    return { outcome: null }
}

export async function POST(request: NextRequest) {
    const started = Date.now()
    let success = false
    let metricError: string | undefined
    let metricStats: Record<string, any> | undefined
    try {
    const supabase = ((request as any).__supabase ?? (await createServerClient())) as any
    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')?.trim()
    const started = Date.now()

    const leagueFilter = supabase
        .from('leagues')
        .select('id')
        .eq('mode', 'sim')
        .in('status', ['pending', 'live', 'active', 'finalizing'])

    const { data: leagues, error: leagueError } = leagueId
        ? await leagueFilter.eq('id', leagueId)
        : await leagueFilter

    if (leagueError) {
        metricError = leagueError.message
        return NextResponse.json({ success: false, error: leagueError.message }, { status: 500 })
    }
    const leagueIds = (leagues || []).map((l: any) => l.id)
    if (leagueIds.length === 0) {
        success = true
        metricStats = { leagues: 0 }
        return NextResponse.json({ success: true, leagues: 0, message: 'No eligible leagues' })
    }

    const { data: picks, error: picksError } = await supabase
        .from('picks')
        .select('market_id, market_id_text')
        .in('league_id', leagueIds)

    if (picksError) {
        metricError = picksError.message
        return NextResponse.json({ success: false, error: picksError.message }, { status: 500 })
    }

    const marketIds = Array.from(new Set((picks || []).map((p: any) => p.market_id).filter(Boolean)))
    const marketIdTexts = Array.from(new Set((picks || []).map((p: any) => p.market_id_text).filter(Boolean)))

    const { data: markets, error: marketsError } = await supabase
        .from('markets')
        .select('id, polymarket_id')
        .in('id', marketIds)

    if (marketsError) {
        metricError = marketsError.message
        return NextResponse.json({ success: false, error: marketsError.message }, { status: 500 })
    }

    const polymarketIds = Array.from(
        new Set([
            ...marketIdTexts,
            ...(markets || [])
                .map((m: any) => m.polymarket_id)
                .filter(Boolean),
        ])
    )

    if (polymarketIds.length === 0) {
        return NextResponse.json({ success: true, leagues: leagueIds.length, markets: 0 })
    }

    const marketToPoly = new Map<string, string>()
    const polyToMarket = new Map<string, string>()
    for (const m of (markets || []) as Array<{ id: string; polymarket_id: string | null }>) {
        if (m.id && m.polymarket_id) {
            marketToPoly.set(m.id, m.polymarket_id)
            polyToMarket.set(m.polymarket_id, m.id)
        }
    }

    const nowIso = new Date().toISOString()
    const upserts: ResolutionRow[] = []
    let resolvedCount = 0
    let missingCount = 0

    for (const polyId of polymarketIds) {
        const resData = await fetchResolution(polyId)
        if (!resData) {
            missingCount += 1
            continue
        }
        const parsed = parseWinningOutcome(resData)
        const marketUuid = polyToMarket.get(polyId)
        if (!marketUuid) {
            missingCount += 1
            continue
        }

        const resolvedAt = parsed.resolvedAt ? new Date(parsed.resolvedAt).toISOString() : nowIso

        upserts.push({
            market_id: marketUuid,
            winning_outcome: parsed.outcome,
            final_price_yes: parsed.outcome ? (parsed.outcome === 'YES' ? '1' : '0') : null,
            final_price_no: parsed.outcome ? (parsed.outcome === 'NO' ? '1' : '0') : null,
            resolved_at: resolvedAt,
            resolution_source: 'polymarket',
            notes: resData?.resolutionSource ?? resData?.resolvedOutcome ?? null,
        })
        if (parsed.outcome) resolvedCount += 1
    }

    if (upserts.length > 0) {
        const { error: upsertError } = await supabase
            .from('market_resolutions')
            .upsert(upserts, { onConflict: 'market_id' })

        if (upsertError) {
            metricError = upsertError.message
            return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 })
        }
    }

    success = true
    metricStats = {
        leagues: leagueIds.length,
        markets: polymarketIds.length,
        upserts: upserts.length,
        resolved: resolvedCount,
        missing: missingCount,
        durationMs: Date.now() - started,
    }

    return NextResponse.json({
        success: true,
        stats: {
            leagues: leagueIds.length,
            markets: polymarketIds.length,
            upserts: upserts.length,
            resolved: resolvedCount,
            missing: missingCount,
            durationMs: Date.now() - started,
        },
    })
    } finally {
        recordJobMetric({
            name: 'resolutions',
            success,
            durationMs: Date.now() - started,
            at: new Date().toISOString(),
            error: metricError,
            stats: metricStats,
        })
    }
}
