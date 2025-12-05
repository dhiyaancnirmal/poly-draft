'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { recordJobMetric } from '@/lib/jobs/metrics'

/**
 * POST /api/leagues/simulated/jobs/finalize-sweep
 * 
 * Iterates all sim-mode leagues past their end_date (or end_time) and triggers
 * finalize for each. Idempotent – already finalized leagues are skipped.
 * 
 * Admin-only endpoint (should be gated at the UI level).
 */
export async function POST(request: NextRequest) {
  const started = Date.now()
  let success = false
  let metricError: string | undefined
  let metricStats: Record<string, any> | undefined

  try {
    const supabase = ((request as any).__supabase ?? (await createServerClient())) as any
    const now = new Date().toISOString()

    // Find all sim leagues that are past their end date and not yet finalized
    const { data: leagues, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name, status, end_date')
      .eq('mode', 'sim')
      .in('status', ['pending', 'live', 'active', 'finalizing'])
      .or(`end_date.lte.${now},end_time.lte.${now}`)
      .order('end_date', { ascending: true })

    if (leagueError) {
      metricError = leagueError.message
      return NextResponse.json({ success: false, error: leagueError.message }, { status: 500 })
    }

    const expiredLeagues = (leagues || []) as Array<{ id: string; name: string; status: string; end_date: string | null }>

    if (expiredLeagues.length === 0) {
      success = true
      metricStats = { processed: 0, message: 'No expired leagues to finalize' }
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No expired leagues to finalize',
        durationMs: Date.now() - started,
      })
    }

    const results: Array<{ leagueId: string; name: string; status: string; error?: string }> = []
    let failures = 0

    // Call the finalize endpoint for each league
    const baseUrl = request.nextUrl.origin
    const finalizeUrl = `${baseUrl}/api/leagues/simulated/jobs/finalize`

    for (const league of expiredLeagues) {
      // Skip if already finalized (extra guard)
      if (league.status === 'finalized') {
        results.push({ leagueId: league.id, name: league.name, status: 'skipped_already_finalized' })
        continue
      }

      try {
        const res = await fetch(`${finalizeUrl}?leagueId=${encodeURIComponent(league.id)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Forward auth cookies if present
            cookie: request.headers.get('cookie') || '',
          },
        })

        const data = await res.json()

        if (res.ok && data.success !== false) {
          results.push({ leagueId: league.id, name: league.name, status: data.status || 'finalized' })
        } else {
          failures += 1
          results.push({ leagueId: league.id, name: league.name, status: 'failed', error: data.error || 'Unknown error' })
        }
      } catch (err: any) {
        failures += 1
        results.push({ leagueId: league.id, name: league.name, status: 'error', error: err?.message || 'Network error' })
      }
    }

    success = failures === 0
    metricStats = {
      processed: expiredLeagues.length,
      finalized: expiredLeagues.length - failures,
      failures,
      durationMs: Date.now() - started,
    }

    return NextResponse.json({
      success,
      processed: expiredLeagues.length,
      finalized: expiredLeagues.length - failures,
      failures,
      results,
      durationMs: Date.now() - started,
    }, { status: success ? 200 : 207 })
  } finally {
    recordJobMetric({
      name: 'finalize-sweep',
      success,
      durationMs: Date.now() - started,
      at: new Date().toISOString(),
      error: metricError,
      stats: metricStats,
    })
  }
}

