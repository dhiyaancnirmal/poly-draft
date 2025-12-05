'use server'

import { NextRequest, NextResponse } from 'next/server'
import { formatUnits, keccak256, stringToBytes } from 'viem'
import PredixManagerAbi from '@/contracts/abis/PredixManager.json'
import PredixAbi from '@/contracts/abis/Predix.json'
import { createServerClient } from '@/lib/supabase/server'
import { getPredixClients } from '@/lib/onchain/predix'

type OffchainLog = {
  id: string
  action: 'pick' | 'swap'
  league_id: string | null
  market_id: string | null
  outcome_id: string | null
  outcome_side: 'YES' | 'NO' | null
  price: string | null
  tx_hash: string | null
  tx_status: 'pending' | 'sent' | 'confirmed' | 'failed' | null
  tx_error: string | null
  chain_id: number | null
  created_at: string
}

type SettlementRow = {
  league_id: string
  points: number
  predix_settled_points: number
  settlement_status: 'pending' | 'sent' | 'confirmed' | 'failed'
  settlement_tx_hash: string | null
  settlement_error: string | null
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const leagueId = url.searchParams.get('leagueId')?.trim() || null
  const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 100)

  const supabase = ((request as any).__supabase ?? (await createServerClient())) as any
  const token = request.headers.get('authorization')?.replace(/Bearer\s+/i, '') || undefined
  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData?.user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }
  const user = authData.user

  const walletAddress =
    (user.user_metadata as any)?.wallet_address ||
    (user.user_metadata as any)?.wallet ||
    user.email ||
    user.id

  const offchainQuery = supabase
    .from('pick_swap_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (leagueId) {
    offchainQuery.eq('league_id', leagueId)
  }

  const { data: offchainLogs, error: logError } = await offchainQuery

  if (logError) {
    return NextResponse.json({ success: false, error: logError.message }, { status: 500 })
  }

  const settlementQuery = supabase
    .from('scores')
    .select(
      'league_id, points, predix_settled_points, settlement_status, settlement_tx_hash, settlement_error'
    )
    .eq('user_id', user.id)

  if (leagueId) {
    settlementQuery.eq('league_id', leagueId)
  }

  const { data: settlements, error: settlementError } = await settlementQuery

  if (settlementError) {
    return NextResponse.json({ success: false, error: settlementError.message }, { status: 500 })
  }

  let onchainBalance: { raw?: string; formatted?: string } | null = null
  let onchainEvents: Array<{
    source: 'onchain'
    action: 'pick' | 'swap'
    txHash: string
    blockNumber: bigint | null
    leagueHash: string
    marketHash: string
    outcomeHash: string
  }> = []
  let chainMeta:
    | {
        chainId: number
        explorerBaseUrl: string
        managerAddress: string
        tokenAddress?: string
      }
    | null = null
  let onchainError: string | null = null

  const walletIsEvm = /^0x[a-fA-F0-9]{40}$/i.test(String(walletAddress))

  try {
    const { publicClient, cfg } = getPredixClients()
    const latest = await publicClient.getBlockNumber()
    const lookbackBlocks = BigInt(
      Math.max(0, Number(process.env.PREDIX_LOG_LOOKBACK_BLOCKS ?? 20_000))
    )
    const fromBlock = latest > lookbackBlocks ? latest - lookbackBlocks : BigInt(0)

    const tokenAddress =
      (process.env.PREDIX_TOKEN_ADDRESS as `0x${string}` | undefined) ??
      ((await publicClient.readContract({
        address: cfg.managerAddress,
        abi: (PredixManagerAbi as any).abi,
        functionName: 'predix',
      })) as `0x${string}`)

    chainMeta = {
      chainId: cfg.chainId,
      managerAddress: cfg.managerAddress,
      tokenAddress,
      explorerBaseUrl:
        cfg.chainId === 8453
          ? 'https://basescan.org'
          : cfg.chainId === 84532
            ? 'https://sepolia.basescan.org'
            : '',
    }

    if (walletIsEvm) {
      const decimals =
        ((await publicClient
          .readContract({
            address: tokenAddress,
            abi: (PredixAbi as any).abi,
            functionName: 'decimals',
          })
          .catch(() => 18)) as number) ?? 18

      const balanceRaw = (await publicClient.readContract({
        address: tokenAddress,
        abi: (PredixAbi as any).abi,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      })) as bigint

      onchainBalance = {
        raw: balanceRaw.toString(),
        formatted: formatUnits(balanceRaw, decimals),
      }
    }

    if (walletIsEvm) {
      const leagueHash = leagueId ? (keccak256(stringToBytes(leagueId)) as `0x${string}`) : undefined
      const pickEvent = (PredixManagerAbi as any).abi.find(
        (e: any) => e.type === 'event' && e.name === 'PickLogged'
      )
      const swapEvent = (PredixManagerAbi as any).abi.find(
        (e: any) => e.type === 'event' && e.name === 'SwapLogged'
      )

      const pickLogs =
        pickEvent &&
        (await publicClient.getLogs({
          address: cfg.managerAddress,
          event: pickEvent as any,
          args: {
            user: walletAddress as `0x${string}`,
            ...(leagueHash ? { leagueId: leagueHash } : {}),
          },
          fromBlock,
        }))

      const swapLogs =
        swapEvent &&
        (await publicClient.getLogs({
          address: cfg.managerAddress,
          event: swapEvent as any,
          args: {
            user: walletAddress as `0x${string}`,
            ...(leagueHash ? { leagueId: leagueHash } : {}),
          },
          fromBlock,
        }))

      onchainEvents = [
        ...(pickLogs || []).map((log: any) => ({
          source: 'onchain' as const,
          action: 'pick' as const,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber ?? null,
          leagueHash: log.args?.leagueId,
          marketHash: log.args?.marketId,
          outcomeHash: log.args?.outcomeId,
        })),
        ...(swapLogs || []).map((log: any) => ({
          source: 'onchain' as const,
          action: 'swap' as const,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber ?? null,
          leagueHash: log.args?.leagueId,
          marketHash: log.args?.marketId,
          outcomeHash: log.args?.outcomeId,
        })),
      ]
    }
  } catch (err: any) {
    onchainError = err?.message || 'Failed to load on-chain data'
  }

  const offchainEvents =
    (offchainLogs as OffchainLog[] | null)?.map((row) => ({
      source: 'offchain' as const,
      action: row.action,
      leagueId: row.league_id,
      marketId: row.market_id,
      outcomeId: row.outcome_id,
      outcomeSide: row.outcome_side,
      price: row.price,
      txHash: row.tx_hash,
      txStatus: row.tx_status,
      txError: row.tx_error,
      chainId: row.chain_id,
      createdAt: row.created_at,
      id: row.id,
    })) ?? []

  const combined = [
    ...offchainEvents.map((e) => ({
      ...e,
      at: e.createdAt,
      createdAt: e.createdAt,
    })),
    ...onchainEvents.map((e) => ({
      ...e,
      at: e.blockNumber ? Number(e.blockNumber) : undefined,
      createdAt: undefined as string | undefined,
    })),
  ].sort((a, b) => {
    const aTime =
      typeof a.createdAt === 'string'
        ? new Date(a.createdAt).getTime()
        : typeof a.at === 'number'
          ? a.at
          : 0
    const bTime =
      typeof b.createdAt === 'string'
        ? new Date(b.createdAt).getTime()
        : typeof b.at === 'number'
          ? b.at
          : 0
    return bTime - aTime
  })

  return NextResponse.json({
    success: true,
    leagueId,
    walletAddress,
    chain: chainMeta,
    onchain: {
      balance: onchainBalance,
      events: onchainEvents,
      error: onchainError,
    },
    settlements: (settlements || []) as SettlementRow[],
    offchainLogs: offchainEvents,
    combined,
  })
}
