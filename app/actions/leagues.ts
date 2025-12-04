'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createLeague(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const leagueData: any = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    entry_fee: parseFloat(formData.get('entry_fee') as string),
    max_players: parseInt(formData.get('max_players') as string),
    creator_id: user.id
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