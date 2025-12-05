'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { computeAndStoreScores } from '@/lib/simulated/scoring'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const leagueId = searchParams.get('leagueId')?.trim()
  if (!leagueId) {
    return NextResponse.json({ success: false, error: 'leagueId is required' }, { status: 400 })
  }

  const supabase = (await createServerClient()) as any

  try {
    await computeAndStoreScores(supabase as any, leagueId)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Scoring failed' }, { status: 500 })
  }

  const { error: updateError } = await (supabase
    .from('leagues') as any)
    .update({ status: 'finalized' })
    .eq('id', leagueId)

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, leagueId, status: 'finalized' })
}

