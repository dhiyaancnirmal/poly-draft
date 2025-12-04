import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [fid, setFid] = useState<number | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [ensName, setEnsName] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setFid(session?.user?.user_metadata?.fid ?? null)
      setUsername(session?.user?.user_metadata?.username ?? null)
      setDisplayName(session?.user?.user_metadata?.display_name ?? null)
      setAvatarUrl(session?.user?.user_metadata?.avatar_url ?? null)
      setEnsName(session?.user?.user_metadata?.ens_name ?? null)
      setWalletAddress(session?.user?.user_metadata?.wallet_address ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setFid(session?.user?.user_metadata?.fid ?? null)
        setUsername(session?.user?.user_metadata?.username ?? null)
        setDisplayName(session?.user?.user_metadata?.display_name ?? null)
        setAvatarUrl(session?.user?.user_metadata?.avatar_url ?? null)
        setEnsName(session?.user?.user_metadata?.ens_name ?? null)
        setWalletAddress(session?.user?.user_metadata?.wallet_address ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setFid(null)
    setUsername(null)
    setDisplayName(null)
    setAvatarUrl(null)
    setEnsName(null)
    setWalletAddress(null)
  }

  return { user, loading, fid, username, displayName, avatarUrl, ensName, walletAddress, signOut }
}