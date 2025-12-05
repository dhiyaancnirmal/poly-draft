import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database-types'

type League = Database['public']['Tables']['leagues']['Row']

export async function getLeagueByCode(joinCode: string): Promise<League | null> {
  const normalized = joinCode.trim().toUpperCase()
  if (!normalized) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('join_code', normalized)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch league by code: ${error.message}`)
  }

  return data ?? null
}

