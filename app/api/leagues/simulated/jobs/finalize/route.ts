'use server'

import { NextRequest, NextResponse } from 'next/server'
import { parseUnits } from 'viem'
import PredixManagerAbi from '@/contracts/abis/PredixManager.json'
import { createServerClient } from '@/lib/supabase/server'
import { computeAndStoreScores } from '@/lib/simulated/scoring'
import { getPredixClients } from '@/lib/onchain/predix'
import { recordJobMetric } from '@/lib/jobs/metrics'

export async function POST(request: NextRequest) {
  const started = Date.now()
  let success = false
  let metricError: string | undefined
  let metricStats: Record<string, any> | undefined

  try {
    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')?.trim()
    if (!leagueId) {
      return NextResponse.json({ success: false, error: 'leagueId is required' }, { status: 400 })
    }

    const supabase = ((request as any).__supabase ?? (await createServerClient())) as any

    let clients
    try {
      clients = getPredixClients()
    } catch (err: any) {
      metricError = err?.message
      return NextResponse.json({ success: false, error: err?.message || 'Predix config error' }, { status: 500 })
    }

    const { walletClient, publicClient, cfg } = clients
    const manager = {
      address: cfg.managerAddress,
      abi: (PredixManagerAbi as any).abi,
    }

    try {
      await computeAndStoreScores(supabase as any, leagueId)
    } catch (err: any) {
      metricError = err?.message
      return NextResponse.json({ success: false, error: err?.message || 'Scoring failed' }, { status: 500 })
    }

    const { error: finalizingError } = await supabase.from('leagues').update({ status: 'finalizing' }).eq('id', leagueId)
    if (finalizingError) {
      return NextResponse.json({ success: false, error: finalizingError.message }, { status: 500 })
    }

    const { data: scores, error: scoreError } = (await supabase
      .from('scores')
      .select('user_id, wallet_address, points, predix_settled_points, settlement_status, settlement_tx_hash')
      .eq('league_id', leagueId)) as any

    if (scoreError) {
      metricError = scoreError.message
      return NextResponse.json({ success: false, error: scoreError.message }, { status: 500 })
    }

    const settlements = (scores || []) as Array<{
      user_id: string
      wallet_address: string
      points: number
      predix_settled_points?: number | null
      settlement_status?: string | null
      settlement_tx_hash?: string | null
    }>

    const results: Array<{ userId: string; delta: number; txHash?: string; error?: string }> = []

    async function sendWithRetry(
      fn: () => Promise<`0x${string}`>,
      attempts = 3,
      delayMs = 750
    ): Promise<`0x${string}`> {
      let lastError: any
      for (let i = 0; i < attempts; i++) {
        try {
          return await fn()
        } catch (err: any) {
          lastError = err
          if (i < attempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)))
          }
        }
      }
      throw lastError
    }

    let failed = 0

    for (const row of settlements) {
      const settled = row.predix_settled_points ?? 0
      const delta = (row.points ?? 0) - settled

      if ((row.settlement_status === 'confirmed' || row.settlement_status === 'sent') && delta === 0) {
        results.push({ userId: row.user_id, delta: 0, txHash: row.settlement_tx_hash ?? undefined })
        continue
      }

      if (delta === 0) {
        results.push({ userId: row.user_id, delta: 0 })
        continue
      }

      const amount = parseUnits(Math.abs(delta).toString(), 18)
      const isMint = delta > 0

      try {
        const txHash = await sendWithRetry(async () => {
          if (isMint) {
            return await walletClient.writeContract({
              ...manager,
              functionName: 'mint',
              args: [row.wallet_address as `0x${string}`, amount],
            })
          }
          return await walletClient.writeContract({
            ...manager,
            functionName: 'burn',
            args: [row.wallet_address as `0x${string}`, amount],
          })
        })

        await publicClient.waitForTransactionReceipt({ hash: txHash })

        await supabase
          .from('scores')
          .update({
            predix_settled_points: row.points ?? 0,
            settlement_tx_hash: txHash,
            settlement_status: 'confirmed',
            settlement_error: null,
            settlement_updated_at: new Date().toISOString(),
          })
          .eq('league_id', leagueId)
          .eq('user_id', row.user_id)

        results.push({ userId: row.user_id, delta, txHash })
      } catch (err: any) {
        failed += 1
        const message = err?.shortMessage || err?.message || 'settlement failed'
        await supabase
          .from('scores')
          .update({
            settlement_status: 'failed',
            settlement_error: message,
            settlement_updated_at: new Date().toISOString(),
          })
          .eq('league_id', leagueId)
          .eq('user_id', row.user_id)

        results.push({ userId: row.user_id, delta, error: message })
      }
    }

    const finalStatus = failed === 0 ? 'finalized' : 'finalizing'

    const { error: updateError } = await (supabase.from('leagues') as any)
      .update({ status: finalStatus })
      .eq('id', leagueId)

    if (updateError) {
      metricError = updateError.message
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    if (failed > 0) {
      metricError = 'One or more settlements failed'
      return NextResponse.json(
        { success: false, error: 'One or more settlements failed', results, status: finalStatus, durationMs: Date.now() - started },
        { status: 500 }
      )
    }

    success = true
    metricStats = {
      leagueId,
      status: finalStatus,
      failed,
      processed: settlements.length,
      durationMs: Date.now() - started,
    }

    return NextResponse.json({ success: true, leagueId, status: finalStatus, results, durationMs: Date.now() - started })
  } finally {
    recordJobMetric({
      name: 'finalize',
      success,
      durationMs: Date.now() - started,
      at: new Date().toISOString(),
      error: metricError,
      stats: metricStats,
    })
  }
}

