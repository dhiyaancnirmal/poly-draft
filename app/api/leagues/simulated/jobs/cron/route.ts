'use server'

import { NextRequest, NextResponse } from 'next/server'
import { recordJobMetric } from '@/lib/jobs/metrics'

type StepResult = {
  name: string
  status: number
  ok: boolean
  body?: any
  error?: string
}

export async function POST(request: NextRequest) {
  const started = Date.now()
  const { searchParams } = new URL(request.url)
  const leagueId = searchParams.get('leagueId')?.trim()

  let success = false
  let metricError: string | undefined
  let metricStats: Record<string, any> | undefined

  const baseUrl = new URL(request.url)
  const steps: Array<{ name: string; path: string; enabled: boolean }> = [
    { name: 'refresh-prices', path: '/api/leagues/simulated/jobs/refresh-prices', enabled: true },
    { name: 'score', path: '/api/leagues/simulated/jobs/score', enabled: true },
    { name: 'resolutions', path: '/api/leagues/simulated/jobs/resolutions', enabled: true },
    {
      name: 'finalize',
      path: '/api/leagues/simulated/jobs/finalize',
      enabled: Boolean(leagueId),
    },
  ]

  const results: StepResult[] = []
  let failures = 0

  for (const step of steps) {
    if (!step.enabled) continue
    const qs = leagueId ? `?leagueId=${encodeURIComponent(leagueId)}` : ''
    const url = `${baseUrl.origin}${step.path}${qs}`
    try {
      const res = await fetch(url, { method: 'POST' })
      const body = await res
        .json()
        .catch(() => ({ message: 'non-JSON response', text: undefined }))
      const ok = res.ok
      if (!ok) failures += 1
      results.push({ name: step.name, status: res.status, ok, body })
    } catch (err: any) {
      failures += 1
      const message = err?.message || 'request failed'
      results.push({ name: step.name, status: 500, ok: false, error: message })
    }
  }

  success = failures === 0
  metricStats = {
    leagueId,
    steps: results,
    failures,
    durationMs: Date.now() - started,
  }

  try {
    return NextResponse.json(
      { success, results, failures, durationMs: Date.now() - started },
      { status: success ? 200 : 500 }
    )
  } finally {
    recordJobMetric({
      name: 'cron',
      success,
      durationMs: Date.now() - started,
      at: new Date().toISOString(),
      error: metricError,
      stats: metricStats,
    })
  }
}

