'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { computeAndStoreScores } from '@/lib/simulated/scoring'
import { recordJobMetric } from '@/lib/jobs/metrics'

export async function POST(request: NextRequest) {
  const started = Date.now()
  let success = false
  let metricError: string | undefined
  let metricStats: Record<string, any> | undefined

  try {
    const supabase = ((request as any).__supabase ?? (await createServerClient())) as any
    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')?.trim()

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

    const results: Array<{ leagueId: string; scores?: number; snapshots?: number; error?: string }> = []
    let failures = 0

    for (const id of leagueIds) {
      try {
        const output = await computeAndStoreScores(supabase, id)
        results.push({
          leagueId: id,
          scores: output.scores?.length ?? 0,
          snapshots: output.snapshots?.length ?? 0,
        })
      } catch (err: any) {
        failures += 1
        const message = err?.message || 'scoring failed'
        results.push({ leagueId: id, error: message })
      }
    }

    success = failures === 0
    metricStats = { leagues: leagueIds.length, failures, results, durationMs: Date.now() - started }

    return NextResponse.json(
      { success, results, failures, durationMs: Date.now() - started },
      { status: success ? 200 : 500 }
    )
  } finally {
    recordJobMetric({
      name: 'score',
      success,
      durationMs: Date.now() - started,
      at: new Date().toISOString(),
      error: metricError,
      stats: metricStats,
    })
  }
}
