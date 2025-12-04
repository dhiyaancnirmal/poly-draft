'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function startDraft(leagueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // For now, just return success - we'll implement the full logic later
  // This is a placeholder to get the build working
  
  revalidatePath('/app/leagues')
  revalidatePath(`/app/draft/${leagueId}`)

  return { success: true, message: 'Draft functionality coming soon' }
}