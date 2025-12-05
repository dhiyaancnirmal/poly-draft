import { useQuery, UseQueryOptions } from '@tanstack/react-query'

type PredixTransparency = {
  success: boolean
  leagueId?: string | null
  walletAddress?: string
  chain?: {
    chainId: number
    explorerBaseUrl: string
    managerAddress: string
    tokenAddress?: string
  } | null
  onchain?: {
    balance?: { raw?: string; formatted?: string } | null
    events?: any[]
    error?: string | null
  }
  settlements?: any[]
  offchainLogs?: any[]
  combined?: any[]
}

export function usePredixTransparency(
  leagueId?: string,
  options?: Partial<UseQueryOptions<PredixTransparency, Error>>
) {
  return useQuery({
    queryKey: ['predix-transparency', leagueId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (leagueId) params.set('leagueId', leagueId)
      const res = await fetch(
        `/api/leagues/simulated/predix${params.toString() ? `?${params.toString()}` : ''}`,
        { cache: 'no-store' }
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to load Predix transparency')
      }
      return (await res.json()) as PredixTransparency
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    ...options,
  })
}


