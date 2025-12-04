import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase'

export function useDraftSync(leagueId: string) {
  const [picks, setPicks] = useState<Database['public']['Tables']['picks']['Row']>([])
  const [members, setMembers] = useState<Database['public']['Tables']['league_members']['Row']>([])
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!leagueId) return

    const supabase = createClient()

    // Initial data fetch
    const fetchDraftData = async () => {
      const [picksRes, membersRes] = await Promise.all([
        supabase.from('picks').select('*').eq('league_id', leagueId),
        supabase.from('league_members').select('*').eq('league_id', leagueId)
      ])

      setPicks(picksRes.data || [])
      setMembers(membersRes.data || [])
      
      // Calculate current turn based on snake draft logic
      calculateCurrentTurn(picksRes.data || [], membersRes.data || [])
    }

    fetchDraftData()

    // Realtime subscriptions
    const channel = supabase
      .channel(`draft-${leagueId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'picks' },
        (payload) => {
          const newPicks = [...picks, payload.new as any]
          setPicks(newPicks)
          calculateCurrentTurn(newPicks, members)
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'league_members' },
        (payload) => {
          const updatedMembers = members.map(member => 
            member.id === payload.new.id ? payload.new as any : member
          )
          setMembers(updatedMembers)
          calculateCurrentTurn(picks, updatedMembers)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => supabase.removeChannel(channel)
  }, [leagueId])

  const calculateCurrentTurn = (currentPicks: any[], currentMembers: any[]) => {
    if (currentMembers.length === 0) return
    
    const totalPicks = currentPicks.length
    const totalMembers = currentMembers.length
    
    // Snake draft logic: calculate whose turn it is
    const round = Math.floor(totalPicks / totalMembers) + 1
    const pickInRound = totalPicks % totalMembers
    
    let currentPickIndex = pickInRound
    if (round % 2 === 0) {
      // Even round: reverse order
      currentPickIndex = totalMembers - 1 - pickInRound
    }
    
    const currentMember = currentMembers
      .sort((a, b) => (a.draft_position || 0) - (b.draft_position || 0))
      [currentPickIndex]
    
    setCurrentTurn(currentMember?.user_id || null)
  }

  const makePick = async (marketId: string, outcomeSide: 'YES' | 'NO') => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Not authenticated')
    if (user.id !== currentTurn) throw new Error('Not your turn')

    const { data, error } = await supabase
      .from('picks')
      .insert({
        league_id: leagueId,
        market_id: marketId,
        outcome_side: outcomeSide,
        round: Math.floor(picks.length / members.length) + 1,
        pick_number: picks.length + 1
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  return { picks, members, currentTurn, isConnected, makePick }
}