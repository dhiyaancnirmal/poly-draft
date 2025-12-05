"use client";
 
import { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeagueCard, MarketCard } from "@/components/features";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Trophy, Wallet, Users, Clock } from "lucide-react";
import { useLeagues } from "@/lib/hooks";
import { useAuth } from "@/lib/hooks";
import { useTrendingMarkets, usePolymarketLivePrices } from "@/lib/hooks/usePolymarket";
 
export default function HomePage() {
  const { user } = useAuth();
  const { leagues, loading: isLoadingLeagues, createLeague, joinLeague } = useLeagues();
  const { data: trendingMarkets, isLoading: isLoadingTrending } = useTrendingMarkets();
  const { livePrices: trendingLivePrices, status: trendingLiveStatus } = usePolymarketLivePrices(trendingMarkets);

  return (
    <AppLayout title="PolyDraft">
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/app/create" className="w-full">
            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground border border-primary/30 shadow-[0_18px_50px_-18px_rgba(240,100,100,0.55)] hover:shadow-[0_22px_60px_-18px_rgba(240,100,100,0.65)] hover:-translate-y-0.5 transition-all"
            >
              <Wallet className="w-5 h-5 mr-2 text-primary-foreground dark:text-white" />
              <span className="font-semibold text-primary-foreground dark:text-white">Create League</span>
            </Button>
          </Link>
          <Link href="/app/leagues" className="w-full">
            <Button
              size="lg"
              className="w-full bg-primary/90 text-primary-foreground border border-primary/30 shadow-[0_16px_45px_-20px_rgba(240,100,100,0.5)] hover:shadow-[0_20px_55px_-18px_rgba(240,100,100,0.6)] hover:-translate-y-0.5 transition-all"
            >
              <Trophy className="w-5 h-5 mr-2 text-primary-foreground dark:text-white" />
              <span className="font-semibold text-primary-foreground dark:text-white">My Leagues</span>
            </Button>
          </Link>
        </div>

        {/* Active Leagues */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Your Leagues</h2>
            <Link href="/app/leagues" className="text-xs font-semibold uppercase text-primary tracking-wide">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {isLoadingLeagues ? (
              <>
                <LeagueCard loading />
                <LeagueCard loading />
                <LeagueCard loading />
              </>
            ) : leagues.length > 0 ? (
              leagues.map((league) => {
                const members = league.league_members?.length || 0;
                const maxMembers = league.max_players || 0;
                const fillPercent = maxMembers ? Math.min(100, Math.round((members / maxMembers) * 100)) : 0;
                const status = league.status;
                const statusMeta: Record<string, { label: string; color: string; pulse?: boolean }> = {
                  open: { label: "Open", color: "bg-green-500/80" },
                  drafting: { label: "Drafting", color: "bg-primary", pulse: true },
                  live: { label: "Live", color: "bg-primary" },
                  ended: { label: "Ended", color: "bg-muted" },
                  cancelled: { label: "Ended", color: "bg-muted" },
                  full: { label: "Full", color: "bg-warning" },
                };
                const meta = statusMeta[status || "open"] || statusMeta.open;

                return (
                  <div
                    key={league.id}
                    className="rounded-2xl border border-border bg-surface/80 p-4 shadow-[0_16px_40px_-24px_rgba(240,100,100,0.4)] hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${meta.color} ${meta.pulse ? "animate-pulse" : ""}`} />
                        <Badge variant="outline" className="border-transparent bg-primary/10 text-primary text-xs">
                          {meta.label}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="bg-primary/15 text-primary border border-primary/30 text-xs">
                        Free Entry
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <Link href={`/app/draft/${league.id}`} className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                        {league.name}
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs text-muted">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-primary/90" />
                        <span className="text-foreground font-semibold">{members}/{maxMembers || "∞"}</span>
                        <span className="text-muted">members</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Trophy className="h-4 w-4 text-primary/90" />
                        <span className="text-foreground font-semibold">Pool: TBD</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary/90" />
                        <span className="text-foreground font-semibold">Live</span>
                      </div>
                    </div>

                    <div className="mt-3 h-2 rounded-full bg-surface-highlight/70 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted py-8">
                No active leagues found. Create one to get started!
              </p>
            )}
          </div>
        </section>

        {/* Trending Markets */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Trending Markets</h2>
            <Badge variant="success">Live</Badge>
          </div>

          <div className="space-y-3">
            {isLoadingTrending ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                <MarketCard loading className="min-w-[320px]" />
              </div>
            ) : trendingMarkets && trendingMarkets.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                {trendingMarkets.map((selection: any) => {
                  const prices = selection.market.outcomePrices
                    ? selection.market.outcomePrices.split(',').map(Number)
                    : [];
                  const yesFallback =
                    selection.market.bestBuyYesPrice ??
                    (!Number.isNaN(Number(selection.market.bestBid)) ? Number(selection.market.bestBid) : undefined) ??
                    (!Number.isNaN(Number(selection.market.lastTradePrice)) ? Number(selection.market.lastTradePrice) : undefined) ??
                    prices[0];
                  const yesPrice = typeof yesFallback === 'number' ? yesFallback : prices[0] ?? 0.5;
                  const noPrice =
                    selection.market.bestBuyNoPrice ??
                    prices[1] ??
                    (1 - yesPrice);

                  return (
                    <div key={selection.event.id} className="snap-start min-w-[320px]">
                      <MarketCard
                        className="h-full"
                        market={{
                          id: selection.market.id,
                          question: selection.market.question,
                          description: selection.event.description,
                          outcomes: selection.market.outcomes.split(','),
                          outcomePrices: [yesPrice, noPrice],
                          yesPrice,
                          noPrice,
                          volume: selection.market.volume,
                          volume24hr: selection.event.volume24hr,
                          endTime: selection.event.endDate,
                          category: selection.category,
                          slug: selection.market.slug,
                          liquidity: selection.market.liquidity,
                          active: selection.market.active,
                          clobTokenIds: selection.market.clobTokenIds?.split(',').map((token: string) => token.trim()),
                        }}
                        livePrice={trendingLivePrices[selection.market.id]}
                        isLive={trendingLiveStatus === 'connected'}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                <MarketCard loading className="min-w-[320px]" />
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}