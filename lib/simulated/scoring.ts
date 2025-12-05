import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database-types'
import { computePeriodIndex } from './periods'

type TypedClient = SupabaseClient<Database>

type PickWithOutcome = {
  user_id: string
  wallet_address: string
  outcome_side: 'YES' | 'NO'
  market_id: string
  market_id_text: string
  outcome_id: string
  outcome?: { current_price?: string }
}

type MarketResolution = {
  market_id: string
  winning_outcome: 'YES' | 'NO' | null
}

type LeagueMeta = {
  id: string
  start_time: string | null
  cadence: 'daily' | 'weekly' | 'custom' | null
}

export async function computeAndStoreScores(supabase: TypedClient, leagueId: string) {
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, start_time, cadence')
    .eq('id', leagueId)
    .maybeSingle()

  if (leagueError) throw new Error(leagueError.message)
  if (!league) throw new Error('League not found')

  const { data: picks, error: picksError } = await supabase
    .from('picks')
    .select('user_id, wallet_address, outcome_side, market_id, market_id_text, outcome_id, outcomes:outcome_id(current_price)')
    .eq('league_id', leagueId)

  if (picksError) throw new Error(picksError.message)
  const parsedPicks = (picks || []) as PickWithOutcome[]
  if (parsedPicks.length === 0) {
    return { scores: [], snapshots: [] }
  }

  const marketIds = Array.from(new Set(parsedPicks.map((p) => p.market_id).filter(Boolean)))

  const { data: resolutions, error: resError } = await supabase
    .from('market_resolutions')
    .select('market_id, winning_outcome')
    .in('market_id', marketIds)

  if (resError) throw new Error(resError.message)
  const resMap = new Map<string, MarketResolution>()
  for (const res of resolutions || []) {
    resMap.set(res.market_id, res)
  }

  const perUser: Record<
    string,
    {
      wallet: string
      totalValue: number
      totalPicks: number
      correctPicks: number
      pnl: number
    }
  > = {}

  for (const pick of parsedPicks) {
    const resolution = resMap.get(pick.market_id)
    const resolvedPrice =
      resolution && resolution.winning_outcome
        ? resolution.winning_outcome === 'YES'
          ? 1
          : 0
        : null

    const priceNum = (() => {
      if (resolvedPrice !== null) return resolvedPrice
      const raw = pick.outcome?.current_price
      const parsed = raw ? Number(raw) : NaN
      if (!Number.isNaN(parsed)) return parsed
      return 0.5
    })()

    const value = pick.outcome_side === 'YES' ? priceNum : 1 - priceNum
    const pnl = (value - 0.5) * 100

    if (!perUser[pick.user_id]) {
      perUser[pick.user_id] = {
        wallet: pick.wallet_address,
        totalValue: 0,
        totalPicks: 0,
        correctPicks: 0,
        pnl: 0,
      }
    }

    perUser[pick.user_id].totalValue += value
    perUser[pick.user_id].totalPicks += 1
    perUser[pick.user_id].pnl += pnl
    if (resolution?.winning_outcome && resolution.winning_outcome === pick.outcome_side) {
      perUser[pick.user_id].correctPicks += 1
    }
  }

  const now = new Date()
  const nowIso = now.toISOString()
  const periodIndex = computePeriodIndex((league as LeagueMeta).start_time, (league as LeagueMeta).cadence, now)

  const scoreRows = Object.entries(perUser).map(([userId, agg]) => ({
    league_id: leagueId,
    user_id: userId,
    wallet_address: agg.wallet,
    points: Math.round(agg.totalValue * 100),
    rank: null as number | null,
    is_winner: false,
    correct_picks: agg.correctPicks,
    total_picks: agg.totalPicks,
    updated_at: nowIso,
  }))

  // Rank by points desc
  scoreRows.sort((a, b) => b.points - a.points)
  scoreRows.forEach((row, idx) => {
    row.rank = idx + 1
    row.is_winner = idx === 0
  })

  if (scoreRows.length > 0) {
    const { error: upsertError } = await supabase
      .from('scores')
      .upsert(scoreRows, { onConflict: 'league_id,user_id' })
    if (upsertError) throw new Error(upsertError.message)
  }

  const snapshotRows = scoreRows.map((row) => {
    const agg = perUser[row.user_id]
    const portfolioValue = agg.totalValue * 100
    return {
      league_id: leagueId,
      user_id: row.user_id,
      wallet_address: row.wallet_address,
      period_index: periodIndex,
      as_of: nowIso,
      points: row.points,
      pnl: Number(agg.pnl.toFixed(4)),
      portfolio_value: Number(portfolioValue.toFixed(4)),
      rank: row.rank,
      correct_picks: row.correct_picks,
      total_picks: row.total_picks,
      markets_held: row.total_picks,
    }
  })

  if (snapshotRows.length > 0) {
    const { error: snapshotError } = await supabase.from('score_snapshots').upsert(snapshotRows, {
      onConflict: 'league_id,user_id,period_index',
    })
    if (snapshotError) throw new Error(snapshotError.message)
  }

  return { scores: scoreRows, snapshots: snapshotRows }
}

