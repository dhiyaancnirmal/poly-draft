'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const GAMMA_API = 'https://gamma-api.polymarket.com'
const CACHE_TTL_MS = 60_000

type GammaPrice = {
  yesPrice: number
  noPrice: number
  yesTokenId?: string | null
  noTokenId?: string | null
}

const priceCache = new Map<string, { data: GammaPrice; ts: number }>()

function clampPrice(p: number | undefined): number | null {
  if (p === undefined || Number.isNaN(p)) return null
  const clamped = Math.min(Math.max(p, 0.01), 0.99)
  return clamped
}

function parseOutcomePrices(raw: any): [number, number] | null {
  try {
    const arr =
      typeof raw === 'string'
        ? raw
            .split(',')
            .map((p) => Number(p.trim()))
            .filter((p) => !Number.isNaN(p))
        : Array.isArray(raw)
          ? raw.map((p) => Number(p)).filter((p) => !Number.isNaN(p))
          : null

    if (!arr || arr.length === 0) return null
    const yes = clampPrice(arr[0])
    const no = clampPrice(arr[1] ?? (arr[0] !== null ? 1 - arr[0]! : undefined))
    if (yes === null || no === null) return null
    return [yes, no]
  } catch {
    return null
  }
}

async function fetchGammaPrice(marketId: string): Promise<GammaPrice | null> {
  const cached = priceCache.get(marketId)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const res = await fetch(`${GAMMA_API}/markets/${marketId}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'PolyDraft/1.0' },
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('Gamma fetch failed', marketId, res.status, res.statusText)
      return null
    }
    const data = await res.json()

    const parsed = parseOutcomePrices(data?.outcomePrices)
    if (!parsed) return null

    const tokenIds = (() => {
      const raw = data?.clobTokenIds
      if (Array.isArray(raw)) return raw.map((t: any) => String(t).trim()).filter(Boolean)
      if (typeof raw === 'string') return raw.split(',').map((t: string) => t.trim()).filter(Boolean)
      return []
    })()

    const price: GammaPrice = {
      yesPrice: parsed[0],
      noPrice: parsed[1],
      yesTokenId: tokenIds[0],
      noTokenId: tokenIds[1],
    }
    priceCache.set(marketId, { data: price, ts: Date.now() })
    return price
  } catch (err) {
    console.error('Gamma fetch error', marketId, err)
    return null
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { searchParams } = new URL(request.url)
  const leagueId = searchParams.get('leagueId')?.trim()

  const leagueFilter = supabase
    .from('leagues')
    .select('id')
    .eq('mode', 'sim')
    .in('status', ['pending', 'live', 'active'])

  const { data: leagues, error: leagueError } = leagueId
    ? await leagueFilter.eq('id', leagueId)
    : await leagueFilter

  if (leagueError) {
    return NextResponse.json({ success: false, error: leagueError.message }, { status: 500 })
  }
  const leagueIds = (leagues || []).map((l: any) => l.id)
  if (leagueIds.length === 0) {
    return NextResponse.json({ success: true, leagues: 0, message: 'No eligible leagues' })
  }

  const { data: picks, error: picksError } = await supabase
    .from('picks')
    .select('market_id, market_id_text')
    .in('league_id', leagueIds)

  if (picksError) {
    return NextResponse.json({ success: false, error: picksError.message }, { status: 500 })
  }

  const marketIds = Array.from(new Set((picks || []).map((p: any) => p.market_id).filter(Boolean)))
  const marketIdTexts = Array.from(new Set((picks || []).map((p: any) => p.market_id_text).filter(Boolean)))

  const { data: markets, error: marketsError } = await supabase
    .from('markets')
    .select('id, polymarket_id')
    .in('id', marketIds)

  if (marketsError) {
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

  const marketDbIds = Array.from(new Set([...(markets || []).map((m: any) => m.id), ...marketIds]))
  if (marketDbIds.length === 0) {
    return NextResponse.json({ success: true, leagues: leagueIds.length, markets: 0 })
  }

  const { data: outcomes, error: outcomesError } = await supabase
    .from('outcomes')
    .select('id, market_id, side, token_id, current_price')
    .in('market_id', marketDbIds)

  if (outcomesError) {
    return NextResponse.json({ success: false, error: outcomesError.message }, { status: 500 })
  }

  const marketToPoly = new Map<string, string>()
  for (const m of markets || []) {
    if (m.id && m.polymarket_id) marketToPoly.set(m.id, m.polymarket_id)
  }

  const stats = {
    leagues: leagueIds.length,
    markets: polymarketIds.length,
    updatedOutcomes: 0,
    missingPrices: 0,
    errors: 0,
  }

  const nowIso = new Date().toISOString()
  const outcomeUpdates: Array<{
    id: string
    current_price: string
    token_id?: string | null
    updated_at: string
  }> = []

  for (const outcome of outcomes || []) {
    const polyId = marketToPoly.get(outcome.market_id)
    if (!polyId) continue

    const gammaPrice = await fetchGammaPrice(polyId)
    if (!gammaPrice) {
      stats.missingPrices += 1
      outcomeUpdates.push({
        id: outcome.id,
        current_price: outcome.current_price || '0.5',
        token_id: outcome.token_id ?? null,
        updated_at: nowIso,
      })
      continue
    }

    const price =
      outcome.side === 'YES'
        ? gammaPrice.yesPrice
        : gammaPrice.noPrice ?? 1 - gammaPrice.yesPrice

    outcomeUpdates.push({
      id: outcome.id,
      current_price: price.toFixed(4),
      token_id: outcome.side === 'YES' ? gammaPrice.yesTokenId ?? null : gammaPrice.noTokenId ?? null,
      updated_at: nowIso,
    })
  }

  if (outcomeUpdates.length > 0) {
    const { error: upsertError } = await supabase.from('outcomes').upsert(outcomeUpdates, { onConflict: 'id' })
    if (upsertError) {
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 })
    }
    stats.updatedOutcomes = outcomeUpdates.length
  }

  return NextResponse.json({ success: true, stats })
}

