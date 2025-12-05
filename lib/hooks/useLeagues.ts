import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase'

type League = Database['public']['Tables']['leagues']['Row'] & {
  league_members?: Array<{ id: string; user_id: string }>;
}

type LeagueInsert = Database['public']['Tables']['leagues']['Insert']

export function useLeagues() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLeagues = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leagues')
      .select(`
        *,
        league_members(id, user_id)
      `)
      .eq('mode', 'sim')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching leagues:', error)
      throw error
    }

    setLeagues((data as any) || [])
  }

  useEffect(() => {
    const supabase = createClient()

    const hydrate = async () => {
      setLoading(true)
      try {
        await fetchLeagues()
      } finally {
        setLoading(false)
      }
    }

    hydrate()

    // Realtime subscription scoped to sim leagues only
    const channel = supabase
      .channel('leagues-sim')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leagues', filter: "mode=eq.sim" },
        hydrate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const createLeague = async (leagueData: LeagueInsert) => {
    const payload = {
      name: (leagueData as any)?.name,
      type: (leagueData as any)?.type || 'daily',
      durationPeriods: (leagueData as any)?.duration_periods,
      picksPerPeriod: (leagueData as any)?.picks_per_period,
      maxParticipants: (leagueData as any)?.max_participants,
      cadence: (leagueData as any)?.cadence || (leagueData as any)?.type || 'daily',
      marketsPerPeriod: (leagueData as any)?.markets_per_period || (leagueData as any)?.picks_per_period,
    }

    const res = await fetch('/api/leagues/simulated/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok || data?.success === false) {
      const message = data?.error || 'Failed to create league'
      throw new Error(message)
    }

    await fetchLeagues()
    return data?.league
  }

  const joinLeague = async (leagueIdOrCode: string) => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/leagues/simulated/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId: leagueIdOrCode, joinCode: leagueIdOrCode }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        const message = data?.error || data?.message || 'Failed to join league'
        throw new Error(message)
      }
      await fetchLeagues()
      return data
    } finally {
      setRefreshing(false)
    }
  }

  return { leagues, loading, refreshing, createLeague, joinLeague, refetch: fetchLeagues }
}