'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function startDraft(leagueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  try {
    // 1. Verify user is league creator
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .select('creator_id, status')
      .eq('id', leagueId)
      .single()

    if (leagueError || !leagueData) throw new Error('League not found')
    
    const league = leagueData as any
    if (league.creator_id !== user.id) throw new Error('Only creator can start draft')
    if (league.status !== 'open') throw new Error('Draft already started')

    // 2. Get members and shuffle for draft order
    const { data: members, error: membersError } = await supabase
      .from('league_members')
      .select('*')
      .eq('league_id', leagueId)
      .order('joined_at', { ascending: true })

    if (membersError || !members || members.length < 2) {
      throw new Error('Need at least 2 members to start draft')
    }

    // Fisher-Yates shuffle
    const shuffled = [...members]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // 3. Assign draft_order to members
    for (let i = 0; i < shuffled.length; i++) {
      await supabase
        .from('league_members')
        .update({ draft_order: i + 1 })
        .eq('id', (shuffled[i] as any).id)
    }

    // 4. Update league status
    await supabase
      .from('leagues')
      .update({
        status: 'drafting',
        draft_started_at: new Date().toISOString()
      })
      .eq('id', leagueId)

    // 5. Create draft_state
    await supabase
      .from('draft_state')
      .insert({
        league_id: leagueId,
        current_pick_number: 1,
        current_round: 1,
        current_user_id: (shuffled[0] as any).user_id,
        picks_per_round: shuffled.length,
        draft_type: 'snake',
        is_paused: false,
        is_completed: false
      } as any)

    revalidatePath('/app/leagues')
    revalidatePath(`/app/draft/${leagueId}`)

    return { success: true }
  } catch (error) {
    console.error('Draft start error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}