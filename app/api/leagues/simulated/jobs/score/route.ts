'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { computeAndStoreScores } from '@/lib/simulated/scoring'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const leagueId = searchParams.get('leagueId')?.trim()

  const supabase = (await createServerClient()) as any

  let leagueIds: string[] = []
  if (leagueId) {
    leagueIds = [leagueId]
  } else {
    const { data, error } = await supabase
      .from('leagues')
      .select('id')
      .eq('mode', 'sim')
      .in('status', ['pending', 'live', 'active'])
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    leagueIds = (data || []).map((l: any) => l.id)
  }

  const results: Array<{ leagueId: string; scores: number }> = []
  for (const id of leagueIds) {
    try {
      const result = await computeAndStoreScores(supabase as any, id)
      results.push({ leagueId: id, scores: result.scores.length })
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err?.message || 'Scoring failed', leagueId: id }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, processed: results })
}

