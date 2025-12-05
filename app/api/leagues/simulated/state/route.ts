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
    .select('id, name, mode, status, cadence, markets_per_period, start_time, end_time')
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

  const [{ data: picks }, { data: swaps }, { data: scores }] = await Promise.all([
    supabase
      .from('picks')
      .select('id, user_id, wallet_address, market_id_text, outcome_side, round, pick_number, points_earned, picked_at')
      .eq('league_id', league.id)
      .order('pick_number', { ascending: true }),
    supabase
      .from('swaps')
      .select('id, user_id, wallet_address, to_market_id, to_outcome_id, notional_in, notional_out, executed_price, fee, pnl_delta, created_at')
      .eq('league_id', league.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('scores')
      .select('user_id, wallet_address, points, rank, correct_picks, total_picks, updated_at')
      .eq('league_id', league.id)
      .order('points', { ascending: false }),
  ])

  return NextResponse.json({
    success: true,
    league,
    picks: picks || [],
    swaps: swaps || [],
    scores: scores || [],
  })
}

