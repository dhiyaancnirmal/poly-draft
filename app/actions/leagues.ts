'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createLeague(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const maxPlayersValue = parseInt(formData.get('max_players') as string) || 10
  const leagueMode = (formData.get('league_mode') as string) === 'simulated' ? 'social' : 'live'
  const cadenceType = (formData.get('cadence_type') as string) === 'weekly' ? 'weekly' : 'daily'
  const seasonLengthDays = cadenceType === 'daily' ? 7 : 28
  const endTime = new Date(Date.now() + seasonLengthDays * 24 * 60 * 60 * 1000).toISOString()

  const leagueData: any = {
    name: (formData.get('name') as string)?.trim(),
    description: (formData.get('description') as string)?.trim() || null,
    max_players: maxPlayersValue,
    creator_id: user.id,
    creator_address: user.email || (user.user_metadata as any)?.wallet_address || user.id,
    end_time: endTime,
    status: 'open',
    mode: leagueMode
  }

  const { data, error } = await supabase
    .from('leagues')
    .insert(leagueData)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/app')
  revalidatePath('/app/leagues')
  return data
}

export async function joinLeague(leagueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const memberData: any = {
    league_id: leagueId,
    user_id: user.id
  }

  const { data, error } = await supabase
    .from('league_members')
    .insert(memberData)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/app/leagues')
  return data
}