'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getUniqueJoinCode } from '@/lib/leagueCodes'
import {
  calculateLeagueDates,
  calculateTotalBuyInCents,
  LeagueType,
  formatDateOnly,
} from '@/lib/leagueDates'
import { Database } from '@/lib/supabase/database-types'

type CreateBody = {
  name?: string
  type?: LeagueType
  durationPeriods?: number
  picksPerPeriod?: number
  maxParticipants?: number
  cadence?: 'daily' | 'weekly' | 'custom'
  marketsPerPeriod?: number
  startTime?: string
  description?: string
}

function endOfDayIso(date: Date): string {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return end.toISOString()
}

function badRequest(message: string, detail?: any) {
  return NextResponse.json({ success: false, error: message, detail }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as CreateBody
  const name = body.name?.trim() || ''
  const type = (body.type || 'daily').toLowerCase() as LeagueType
  const durationPeriods = Number(body.durationPeriods ?? 0)
  const picksPerPeriod = Number(body.picksPerPeriod ?? 0)
  const maxParticipants = Number(body.maxParticipants ?? 0)
  const cadence = body.cadence || (type as 'daily' | 'weekly') || 'daily'
  const marketsPerPeriod = Number((body.marketsPerPeriod ?? picksPerPeriod ?? 1))
  const startTimeIso = body.startTime

  if (!name) return badRequest('Name is required')
  if (!['daily', 'weekly'].includes(type)) return badRequest('Type must be daily or weekly')
  if (!Number.isInteger(durationPeriods) || durationPeriods <= 0) {
    return badRequest('durationPeriods must be a positive integer')
  }
  if (!Number.isInteger(picksPerPeriod) || picksPerPeriod <= 0) {
    return badRequest('picksPerPeriod must be a positive integer')
  }
  if (!Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 12 || maxParticipants % 2 !== 0) {
    return badRequest('maxParticipants must be even and between 2 and 12')
  }
  if (!['daily', 'weekly', 'custom'].includes(cadence)) {
    return badRequest('cadence must be daily, weekly, or custom')
  }

  const supabase = (await createServerClient()) as any
  const token = request.headers.get('authorization')?.replace(/Bearer\s+/i, '') || undefined
  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData?.user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  const user = authData.user
  const joinCode = await getUniqueJoinCode()
  const { startDate, endDate } = calculateLeagueDates(type, durationPeriods)
  const pricePerMarketCents = 100
  const totalBuyInCents = calculateTotalBuyInCents(picksPerPeriod, durationPeriods, pricePerMarketCents)

  const creatorWallet =
    (user.user_metadata as any)?.wallet_address ||
    (user.user_metadata as any)?.wallet ||
    user.email ||
    null

  const leaguePayload: Database['public']['Tables']['leagues']['Insert'] = {
    name,
    description: body.description?.trim() || null,
    type,
    start_date: formatDateOnly(startDate),
    end_date: formatDateOnly(endDate),
    duration_periods: durationPeriods,
    picks_per_period: picksPerPeriod,
    max_participants: maxParticipants,
    price_per_market_cents: pricePerMarketCents,
    total_buy_in_cents: totalBuyInCents,
    join_code: joinCode,
    created_by: user.id,
    creator_wallet: creatorWallet,
    creator_address: creatorWallet || user.id,
    max_players: maxParticipants,
    end_time: endOfDayIso(endDate),
    start_time: startTimeIso || new Date().toISOString(),
    status: 'pending' as any,
    mode: 'sim' as any,
    cadence: cadence as any,
    markets_per_period: marketsPerPeriod,
  }

  const { data: league, error } = await (supabase
    .from('leagues') as any)
    .insert(leaguePayload)
    .select('id, join_code, name')
    .single()

  if (error || !league) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create league' }, { status: 500 })
  }

  const walletForMembership = creatorWallet || user.email || user.id
  await (supabase.from('league_members') as any).insert({
    league_id: league.id,
    user_id: user.id,
    wallet_address: walletForMembership,
  })

  return NextResponse.json({
    success: true,
    league: {
      id: league.id,
      joinCode: league.join_code,
      name: league.name,
      mode: 'sim',
      status: 'pending',
      cadence,
      marketsPerPeriod,
    },
  })
}

