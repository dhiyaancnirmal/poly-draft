import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase'

type League = Database['public']['Tables']['leagues']['Row']
type LeagueInsert = Database['public']['Tables']['leagues']['Insert']

export function useLeagues() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    const fetchLeagues = async () => {
      const { data, error } = await supabase
        .from('leagues')
        .select(`
          *,
          creator:profiles(username, avatar_url),
          league_members(count)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching leagues:', error)
      } else {
        setLeagues(data || [])
      }
      setLoading(false)
    }

    fetchLeagues()

    // Realtime subscription
    const channel = supabase
      .channel('leagues')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leagues' },
        fetchLeagues
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const createLeague = async (leagueData: LeagueInsert) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leagues')
      .insert(leagueData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const joinLeague = async (leagueId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('league_members')
      .insert({
        league_id: leagueId,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  return { leagues, loading, createLeague, joinLeague }
}