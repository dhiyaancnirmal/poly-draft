'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validateTeamName } from '@/lib/validation/teamName'

export type UpsertTeamNameResult =
  | { success: true; teamName: string }
  | { success: false; error: string }

export async function upsertTeamName(leagueId: string, teamNameRaw: string): Promise<UpsertTeamNameResult> {
  const valid = validateTeamName(teamNameRaw)
  if (!valid.ok || !valid.value) return { success: false, error: valid.error || 'Invalid team name' }
  const teamName = valid.value

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const wallet =
    (user.user_metadata as any)?.wallet_address ||
    (user.user_metadata as any)?.wallet ||
    user.email ||
    user.id

  const { error } = await (supabase.from('league_members') as any)
    .upsert(
      {
        league_id: leagueId,
        user_id: user.id,
        team_name: teamName,
        wallet_address: wallet,
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'league_id,user_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Failed to upsert team name', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/app/leagues/${leagueId}`)
  return { success: true, teamName }
}

