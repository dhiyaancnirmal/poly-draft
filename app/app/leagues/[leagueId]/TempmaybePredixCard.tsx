'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { ExternalLink, AlertCircle, Activity } from 'lucide-react'
import { usePredixTransparency } from '@/lib/hooks/usePredix'

function shortHash(value?: string | null, chars: number = 6) {
  if (!value) return '—'
  if (value.length <= chars * 2) return value
  return `${value.slice(0, chars)}…${value.slice(-chars)}`
}

type Props = {
  leagueId: string
}

// Temporary Predix surfacing for league detail; can be replaced with a richer UI later.
export function TempmaybePredixCard({ leagueId }: Props) {
  const { data: predix, isLoading, error } = usePredixTransparency(leagueId)

  const explorer = predix?.chain?.explorerBaseUrl

  return (
    <Card className="border border-border/60 bg-surface/70">
      <CardHeader className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-foreground">Predix (Base)</p>
          <p className="text-xs text-muted">On-chain balance, settlements, transparency</p>
        </div>
        <Badge variant="outline">Transparency</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error.message}</span>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-surface/80 p-3 space-y-1">
            <p className="text-xs uppercase font-semibold text-muted">Balance</p>
            {isLoading ? (
              <div className="h-6 w-24 rounded bg-surface-highlight animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-foreground">{predix?.onchain?.balance?.formatted ?? '—'}</p>
            )}
            {predix?.chain?.tokenAddress && explorer ? (
              <Link
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                href={`${explorer}/address/${predix.chain.tokenAddress}`}
                target="_blank"
              >
                <ExternalLink className="h-3 w-3" />
                Token on BaseScan
              </Link>
            ) : null}
          </div>

          <div className="rounded-lg border border-border/60 bg-surface/80 p-3 space-y-2">
            <p className="text-xs uppercase font-semibold text-muted">Settlement status</p>
            {isLoading ? (
              <div className="h-10 rounded bg-surface-highlight animate-pulse" />
            ) : predix?.settlements && predix.settlements.length > 0 ? (
              <div className="space-y-1">
                {predix.settlements.slice(0, 3).map((s: any) => (
                  <div key={s.league_id} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{shortHash(s.league_id)}</span>
                    <Badge
                      variant={
                        s.settlement_status === 'confirmed'
                          ? 'success'
                          : s.settlement_status === 'failed'
                            ? 'error'
                            : 'default'
                      }
                    >
                      {s.settlement_status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No settlements yet</p>
            )}
          </div>

          <div className="rounded-lg border border-border/60 bg-surface/80 p-3 space-y-2">
            <p className="text-xs uppercase font-semibold text-muted">Links</p>
            <div className="space-y-1 text-sm">
              {predix?.chain?.managerAddress && explorer ? (
                <Link
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  href={`${explorer}/address/${predix.chain.managerAddress}`}
                  target="_blank"
                >
                  <ExternalLink className="h-3 w-3" />
                  Predix Manager
                </Link>
              ) : (
                <p className="text-muted text-sm">Manager address pending</p>
              )}
              {predix?.combined?.find((e: any) => e.txHash && explorer) ? (
                <Link
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  href={`${explorer}/tx/${predix?.combined?.find((e: any) => e.txHash)?.txHash}`}
                  target="_blank"
                >
                  <ExternalLink className="h-3 w-3" />
                  Latest tx
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Recent Predix events</p>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-10 rounded bg-surface-highlight animate-pulse" />
              <div className="h-10 rounded bg-surface-highlight animate-pulse" />
            </div>
          ) : predix?.combined && predix.combined.length > 0 ? (
            <div className="space-y-2">
              {predix.combined.slice(0, 6).map((event: any, idx: number) => {
                const txLink = explorer && event.txHash ? `${explorer}/tx/${event.txHash}` : null
                const status =
                  event.txStatus ||
                  (event.txHash ? 'confirmed' : event.blockNumber ? 'confirmed' : 'pending')
                const statusVariant =
                  status === 'confirmed'
                    ? 'success'
                    : status === 'failed'
                      ? 'error'
                      : 'default'
                return (
                  <div
                    key={event.id || event.txHash || idx}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-surface/70 px-3 py-2 text-sm"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge variant={event.source === 'onchain' ? 'outline' : 'info'}>
                          {event.source}
                        </Badge>
                        <span className="font-semibold capitalize text-foreground">
                          {event.action}
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        {event.leagueId || event.leagueHash ? shortHash((event.leagueId || event.leagueHash).toString()) : 'league'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant}>{status}</Badge>
                      {txLink ? (
                        <Link href={txLink} target="_blank" className="text-primary hover:underline">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted">No Predix events yet.</p>
          )}
          {predix?.onchain?.error ? (
            <p className="text-xs text-warning">On-chain fetch warning: {predix.onchain.error}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}


