'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { OutcomeSide } from '@/lib/supabase/database-types'
import { computePeriodIndex } from '@/lib/simulated/periods'
import { getPredixClients } from '@/lib/onchain/predix'
import PredixManagerAbi from '@/contracts/abis/PredixManager.json'
import { keccak256, stringToBytes } from 'viem'
import { checkRateLimit } from '@/lib/rateLimit'

type PickBody = {
  leagueId?: string
  marketId?: string
  marketTitle?: string
  outcomeSide?: OutcomeSide
  price?: number
  endTime?: string
}

function badRequest(message: string, detail?: any) {
  return NextResponse.json({ success: false, error: message, detail }, { status: 400 })
}

async function ensureMarketAndOutcome(
  supabase: any,
  marketId: string,
  outcomeSide: OutcomeSide,
  opts: { title?: string; endTime?: string }
) {
  const { data: existingMarket } = await supabase
    .from('markets')
    .select('id')
    .eq('polymarket_id', marketId)
    .maybeSingle()

  let marketIdUuid = existingMarket?.id as string | undefined

  if (!marketIdUuid) {
    const { data: created, error: marketError } = await supabase
      .from('markets')
      .insert({
        polymarket_id: marketId,
        title: opts.title || marketId,
        end_time: opts.endTime || null,
        is_active: true,
        is_resolved: false,
      })
      .select('id')
      .single()
    if (marketError || !created) {
      throw new Error(marketError?.message || 'Failed to create market')
    }
    marketIdUuid = created.id
  }

  const { data: existingOutcome } = await supabase
    .from('outcomes')
    .select('id')
    .eq('market_id', marketIdUuid)
    .eq('side', outcomeSide)
    .maybeSingle()

  let outcomeId = existingOutcome?.id as string | undefined
  if (!outcomeId) {
    const { data: createdOutcome, error: outcomeError } = await supabase
      .from('outcomes')
      .insert({
        market_id: marketIdUuid,
        side: outcomeSide,
      })
      .select('id')
      .single()
    if (outcomeError || !createdOutcome) {
      throw new Error(outcomeError?.message || 'Failed to create outcome')
    }
    outcomeId = createdOutcome.id
  }

  return { marketIdUuid, outcomeId }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as PickBody
  const leagueId = body.leagueId?.trim()
  const marketId = body.marketId?.trim()
  const outcomeSide = body.outcomeSide as OutcomeSide | undefined
  const price = typeof body.price === 'number' ? body.price : undefined

  if (!leagueId) return badRequest('leagueId is required')
  if (!marketId) return badRequest('marketId is required')
  if (!outcomeSide || !['YES', 'NO'].includes(outcomeSide)) return badRequest('outcomeSide must be YES or NO')

  const supabase = ((request as any).__supabase ?? (await createServerClient())) as any
  const token = request.headers.get('authorization')?.replace(/Bearer\s+/i, '') || undefined
  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData?.user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }
  const user = authData.user

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, mode, status, markets_per_period, start_time, end_time, cadence')
    .eq('id', leagueId)
    .maybeSingle()

  if (leagueError || !league) {
    return NextResponse.json(
      { success: false, error: leagueError?.message || 'League not found' },
      { status: 404 }
    )
  }

  const now = new Date()
  const startTime = league.start_time ? new Date(league.start_time) : null
  const endTime = league.end_time ? new Date(league.end_time) : null

  if (startTime && now < startTime) {
    return badRequest('League has not started yet')
  }
  if (endTime && now > endTime) {
    return badRequest('League is closed for picks')
  }

  if (league.mode !== 'sim') {
    return badRequest('League is not in simulated mode')
  }

  if (['ended', 'cancelled', 'finalizing', 'finalized'].includes(league.status)) {
    return badRequest(`League is not accepting picks (status=${league.status})`)
  }

  const memberWallet =
    (user.user_metadata as any)?.wallet_address ||
    (user.user_metadata as any)?.wallet ||
    user.email ||
    user.id

  const { data: membership } = await supabase
    .from('league_members')
    .select('id')
    .eq('league_id', league.id)
    .or(`user_id.eq.${user.id},wallet_address.eq.${memberWallet}`)
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ success: false, error: 'User is not a member of this league' }, { status: 403 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || (request as any).ip || 'unknown'
  const rate = checkRateLimit(`pick:${user.id}:${ip}`, 15, 60_000)
  const ipRate = checkRateLimit(`pick:ip:${ip}`, 60, 60_000)
  if (!rate.allowed || !ipRate.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded', retryAfter: Math.max(rate.resetAt, ipRate.resetAt) },
      { status: 429 }
    )
  }

  // Ensure market/outcome records exist
  let marketOutcome
  try {
    marketOutcome = await ensureMarketAndOutcome(supabase, marketId, outcomeSide, {
      title: body.marketTitle,
      endTime: body.endTime,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to prepare market/outcome' }, { status: 500 })
  }

  const { data: lastPick } = await supabase
    .from('picks')
    .select('pick_number')
    .eq('league_id', league.id)
    .order('pick_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextPickNumber = (lastPick?.pick_number ?? 0) + 1
  const marketsPerPeriod = league.markets_per_period || 1
  const round = Math.max(1, Math.ceil(nextPickNumber / marketsPerPeriod))

  const currentPeriod = computePeriodIndex(league.start_time, league.cadence, now)

  const { data: priorPicks, error: priorError } = await supabase
    .from('picks')
    .select('picked_at')
    .eq('league_id', league.id)
    .eq('user_id', user.id)

  if (priorError) {
    return NextResponse.json({ success: false, error: priorError.message }, { status: 500 })
  }

  const picksThisPeriod = (priorPicks || []).filter((p: any) => {
    const pickedAt = p.picked_at ? new Date(p.picked_at) : null
    return computePeriodIndex(league.start_time, league.cadence, pickedAt ?? now) === currentPeriod
  }).length

  if (picksThisPeriod >= marketsPerPeriod) {
    return badRequest('Pick limit reached for this period')
  }

  const { data: pick, error: pickError } = await (supabase
    .from('picks') as any)
    .insert({
      league_id: league.id,
      user_id: user.id,
      wallet_address: memberWallet,
      market_id: marketOutcome.marketIdUuid,
      outcome_id: marketOutcome.outcomeId,
      market_id_text: marketId,
      outcome_side: outcomeSide,
      round,
      pick_number: nextPickNumber,
      points_earned: 0,
    })
    .select('id, league_id, user_id, market_id, outcome_id, outcome_side, pick_number, round')
    .single()

  if (pickError || !pick) {
    return NextResponse.json(
      { success: false, error: pickError?.message || 'Failed to record pick' },
      { status: 500 }
    )
  }

  // Append transparency log
  const { data: logRow } = await supabase
    .from('pick_swap_logs')
    .insert({
      league_id: league.id,
      user_id: user.id,
      action: 'pick',
      market_id: marketOutcome.marketIdUuid,
      outcome_id: marketOutcome.outcomeId,
      outcome_side: outcomeSide,
      price: price ?? null,
      tx_status: 'pending',
    })
    .select('id')
    .single()

  if (logRow?.id && /^0x[a-fA-F0-9]{40}$/.test(memberWallet)) {
    appendOnchainLog({
      leagueId: league.id,
      marketId: marketOutcome.marketIdUuid as string,
      outcomeId: marketOutcome.outcomeId as string,
      userAddress: memberWallet,
      logId: logRow.id,
      supabase,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true, pick })
}

async function appendOnchainLog(opts: {
  leagueId: string
  marketId: string
  outcomeId: string
  userAddress: string
  logId: string
  supabase: any
}) {
  try {
    const { walletClient, publicClient, cfg } = getPredixClients()
    const txHash = await walletClient.writeContract({
      address: cfg.managerAddress,
      abi: (PredixManagerAbi as any).abi,
      functionName: 'logPick',
      args: [
        opts.userAddress as `0x${string}`,
        keccak256(stringToBytes(opts.leagueId)),
        keccak256(stringToBytes(opts.marketId)),
        keccak256(stringToBytes(opts.outcomeId)),
      ],
    })
    await publicClient.waitForTransactionReceipt({ hash: txHash })
    await opts.supabase
      .from('pick_swap_logs')
      .update({ tx_hash: txHash, tx_status: 'confirmed', tx_error: null, chain_id: cfg.chainId })
      .eq('id', opts.logId)
  } catch (err: any) {
    const message = err?.shortMessage || err?.message || 'predix log failed'
    await opts.supabase
      .from('pick_swap_logs')
      .update({ tx_status: 'failed', tx_error: message })
      .eq('id', opts.logId)
  }
}

