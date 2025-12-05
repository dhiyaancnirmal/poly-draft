'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

function badRequest(message: string, detail?: any) {
  return NextResponse.json({ success: false, error: message, detail }, { status: 400 })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const leagueId = searchParams.get('leagueId')?.trim()
  if (!leagueId) return badRequest('leagueId is required')

  const supabase = (await createServerClient()) as any

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, mode, status, name, cadence, markets_per_period')
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

  const { data: scores, error: scoresError } = await supabase
    .from('scores')
    .select('user_id, wallet_address, points, rank, is_winner, correct_picks, total_picks, updated_at')
    .eq('league_id', league.id)
    .order('points', { ascending: false })

  if (scoresError) {
    return NextResponse.json({ success: false, error: scoresError.message }, { status: 500 })
  }

  const { data: snapshots } = await supabase
    .from('score_snapshots')
    .select('user_id, wallet_address, period_index, as_of, points, pnl, portfolio_value, rank, correct_picks, total_picks')
    .eq('league_id', league.id)
    .order('as_of', { ascending: false })
    .limit(200)

  return NextResponse.json({
    success: true,
    league: {
      id: league.id,
      name: league.name,
      status: league.status,
      cadence: league.cadence,
      marketsPerPeriod: league.markets_per_period,
    },
    scores: scores || [],
    snapshots: snapshots || [],
  })
}

