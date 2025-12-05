import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase'

type MakePickOptions = {
  price?: number
  marketTitle?: string
  endTime?: string
}

export function useDraftSync(leagueId: string) {
  const [picks, setPicks] = useState<Database['public']['Tables']['picks']['Row'][]>([])
  const [members, setMembers] = useState<Database['public']['Tables']['league_members']['Row'][]>([])
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!leagueId) return

    const supabase = createClient()

    // Initial data fetch
    const fetchDraftData = async () => {
      const { data: picksData } = await supabase
        .from('picks')
        .select('*')
        .eq('league_id', leagueId as any)

      const { data: membersData } = await supabase
        .from('league_members')
        .select('*')
        .eq('league_id', leagueId as any)

      const picksRes = { data: picksData }
      const membersRes = { data: membersData }

      setPicks((picksRes.data || []) as any)
      setMembers((membersRes.data || []) as any)
      
      // Calculate current turn based on snake draft logic
      calculateCurrentTurn(picksRes.data || [], membersRes.data || [])
    }

    fetchDraftData()

    // Realtime subscriptions
    const channel = supabase
      .channel(`draft-${leagueId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'picks', filter: `league_id=eq.${leagueId}` },
        (payload) => {
          setPicks((currentPicks) => {
            const newPicks = [...currentPicks, payload.new as any]
            setMembers((currentMembers) => {
              calculateCurrentTurn(newPicks, currentMembers)
              return currentMembers
            })
            return newPicks
          })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'league_members', filter: `league_id=eq.${leagueId}` },
        (payload: any) => {
          const updatedMembers = members.map(member =>
            member.id === payload.new.id ? payload.new : member
          )
          setMembers(updatedMembers as any)
          calculateCurrentTurn(picks, updatedMembers)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
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
      .sort((a, b) => (a.draft_order || 0) - (b.draft_order || 0))
      [currentPickIndex]
    
    setCurrentTurn(currentMember?.user_id || null)
  }

  const makePick = async (marketId: string, outcomeSide: 'YES' | 'NO', opts?: MakePickOptions) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')
    if (user.id !== currentTurn) throw new Error('Not your turn')

    const res = await fetch('/api/leagues/simulated/pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leagueId,
        marketId,
        outcomeSide,
        price: opts?.price,
        marketTitle: opts?.marketTitle,
        endTime: opts?.endTime,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok || data?.success === false) {
      const message = data?.error || data?.message || 'Failed to make pick'
      throw new Error(message)
    }

    // Optimistically append pick while realtime catches up
    if (data?.pick) {
      setPicks((current) => {
        const next = [...current, data.pick]
        calculateCurrentTurn(next, members)
        return next
      })
    }

    return data?.pick
  }

  return { picks, members, currentTurn, isConnected, makePick }
}