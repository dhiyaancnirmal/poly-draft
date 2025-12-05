'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database-types'

type JoinBody = {
  joinCode?: string
  leagueId?: string
  walletAddress?: string
}

function badRequest(message: string, detail?: any) {
  return NextResponse.json({ success: false, error: message, detail }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as JoinBody
  const joinCode = body.joinCode?.trim().toUpperCase()
  const leagueId = body.leagueId?.trim()

  if (!joinCode && !leagueId) {
    return badRequest('joinCode or leagueId is required')
  }

  const supabase = (await createServerClient()) as any
  const token = request.headers.get('authorization')?.replace(/Bearer\s+/i, '') || undefined
  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData?.user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  const user = authData.user
  const walletFromBody = body.walletAddress?.trim() || null
  const fallbackWallet =
    walletFromBody ||
    (user.user_metadata as any)?.wallet_address ||
    (user.user_metadata as any)?.wallet ||
    user.email ||
    user.id

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, join_code, mode, status, max_participants, start_time, end_time')
    .match(joinCode ? { join_code: joinCode } : { id: leagueId })
    .maybeSingle()

  if (leagueError || !league) {
    return NextResponse.json(
      { success: false, error: leagueError?.message || 'League not found' },
      { status: 404 }
    )
  }

  if (league.mode !== 'sim') {
    return badRequest('League is not in simulated mode')
  }

  if (['ended', 'cancelled', 'finalizing', 'finalized'].includes(league.status)) {
    return badRequest(`League is not joinable (status=${league.status})`)
  }

  const { count: memberCount } = await supabase
    .from('league_members')
    .select('id', { count: 'exact', head: true })
    .eq('league_id', league.id)

  if (memberCount !== null && league.max_participants && memberCount >= league.max_participants) {
    return badRequest('League is full')
  }

  const { data: existingMember } = await supabase
    .from('league_members')
    .select('id')
    .eq('league_id', league.id)
    .or(`user_id.eq.${user.id},wallet_address.eq.${fallbackWallet}`)
    .maybeSingle()

  if (existingMember) {
    return NextResponse.json({ success: true, joined: false, message: 'Already joined', leagueId: league.id })
  }

  const payload: Database['public']['Tables']['league_members']['Insert'] = {
    league_id: league.id,
    user_id: user.id,
    wallet_address: fallbackWallet,
  }

  const { data: membership, error: insertError } = await (supabase
    .from('league_members') as any)
    .insert(payload)
    .select('id, league_id, user_id')
    .single()

  if (insertError || !membership) {
    return NextResponse.json(
      { success: false, error: insertError?.message || 'Failed to join league' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, joined: true, leagueId: league.id, membershipId: membership.id })
}

