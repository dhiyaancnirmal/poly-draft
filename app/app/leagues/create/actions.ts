'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUniqueJoinCode } from '@/lib/leagueCodes'
import { Database } from '@/lib/supabase/database-types'
import { LeagueType, calculateLeagueDates, calculateTotalBuyInCents, formatDateOnly } from '@/lib/leagueDates'

function endOfDayIso(date: Date): string {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return end.toISOString()
}

export type CreateLeagueResult =
  | { success: true; leagueId: string; joinCode: string }
  | { success: false; error: string }

export async function createLeague(formData: FormData): Promise<CreateLeagueResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const name = (formData.get('name') as string | null)?.trim() || ''
  const type = ((formData.get('type') as string) || 'daily').toLowerCase() as LeagueType
  const durationPeriods = Number(formData.get('duration_periods') ?? 0)
  const picksPerPeriod = Number(formData.get('picks_per_period') ?? 0)
  const maxParticipants = Number(formData.get('max_participants') ?? 0)

  if (!name) return { success: false, error: 'Name is required' }
  if (!['daily', 'weekly'].includes(type)) return { success: false, error: 'Type must be daily or weekly' }
  if (!Number.isInteger(durationPeriods) || durationPeriods <= 0) {
    return { success: false, error: 'Duration must be a positive integer' }
  }
  if (!Number.isInteger(picksPerPeriod) || picksPerPeriod <= 0) {
    return { success: false, error: 'Picks per period must be a positive integer' }
  }
  if (!Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 12 || maxParticipants % 2 !== 0) {
    return { success: false, error: 'Max participants must be even and between 2 and 12' }
  }
  if (type === 'daily' && ![1, 2, 3].includes(picksPerPeriod)) {
    return { success: false, error: 'Daily picks must be 1, 2, or 3' }
  }
  if (type === 'weekly' && (picksPerPeriod < 2 || picksPerPeriod > 14)) {
    return { success: false, error: 'Weekly picks must be between 2 and 14' }
  }

  const { startDate, endDate } = calculateLeagueDates(type, durationPeriods)

  const pricePerMarketCents = 100
  const totalBuyInCents = calculateTotalBuyInCents(picksPerPeriod, durationPeriods, pricePerMarketCents)

  const joinCode = await getUniqueJoinCode()

  const creatorWallet =
    (user.user_metadata as any)?.wallet_address ||
    (user.user_metadata as any)?.wallet ||
    user.email ||
    null

  const payload: Database['public']['Tables']['leagues']['Insert'] = {
    name,
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
    status: 'open',
    mode: 'social',
  }

  const { data, error } = await (supabase
    .from('leagues') as any)
    .insert(payload)
    .select('id, join_code')
    .single()

  if (error || !data) {
    console.error('Failed to create league', error)
    return { success: false, error: error?.message || 'Failed to create league' }
  }

  // Auto-add creator as a member for downstream filters/lists
  const walletForMembership = creatorWallet || user.email || user.id
  const { error: memberError } = await (supabase
    .from('league_members') as any)
    .insert({
      league_id: data.id,
      user_id: user.id,
      wallet_address: walletForMembership,
    })

  if (memberError) {
    console.warn('Failed to insert creator as league member (continuing):', memberError)
  }

  revalidatePath('/app/leagues')
  revalidatePath('/app')

  return { success: true, leagueId: data.id, joinCode: data.join_code }
}

