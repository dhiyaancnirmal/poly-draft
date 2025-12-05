"use client";
 
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeagueCard, MarketCard } from "@/components/features";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Trophy } from "lucide-react";
import { useLeagues } from "@/lib/hooks";
import { useAuth } from "@/lib/hooks";
import { usePolymarketLivePrices, useTrendingMarketsDaily, useTrendingMarketsWeekly } from "@/lib/hooks/usePolymarket";
 
export default function HomePage() {
  const { user } = useAuth();
  const { leagues, loading: isLoadingLeagues, createLeague, joinLeague } = useLeagues();
  const { data: trendingToday, isLoading: loadingToday, error: errorToday } = useTrendingMarketsDaily();
  const { data: trendingWeek, isLoading: loadingWeek, error: errorWeek } = useTrendingMarketsWeekly();
  const { livePrices: livePricesToday, status: liveStatusToday } = usePolymarketLivePrices(trendingToday);
  const { livePrices: livePricesWeek, status: liveStatusWeek } = usePolymarketLivePrices(trendingWeek);

  const renderTrendingRow = (
    title: string,
    markets: any[] | undefined,
    livePrices: Record<string, any>,
    liveStatus: 'idle' | 'connecting' | 'connected' | 'error',
    loading: boolean,
    error?: Error | null,
    emptyMessage?: string
  ) => {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <Badge variant="success">{liveStatus === 'connected' ? 'Live' : 'Top Volume'}</Badge>
        </div>

        {error ? (
          <div className="text-center text-error bg-error/10 border border-error/20 rounded-lg p-3 text-sm">
            Failed to load markets: {error.message}
          </div>
        ) : null}

        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {loading ? (
            <>
              <MarketCard loading className="w-[320px] flex-shrink-0 snap-start" />
              <MarketCard loading className="w-[320px] flex-shrink-0 snap-start" />
            </>
          ) : markets && markets.length > 0 ? (
            markets.map((selection: any) => {
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
                <MarketCard
                  key={selection.event.id}
                  className="w-[320px] flex-shrink-0 snap-start"
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
                  livePrice={livePrices[selection.market.id]}
                  isLive={liveStatus === 'connected'}
                />
              );
            })
          ) : (
            <div className="text-muted text-sm py-6 px-3">{emptyMessage || 'No markets available.'}</div>
          )}
        </div>
      </section>
    );
  };

  return (
    <AppLayout title="PolyDraft">
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/app/create" className="w-full">
            <Button size="lg" className="w-full shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" />
              Create League
            </Button>
          </Link>
          <Link href="/app/leagues" className="w-full">
            <Button variant="secondary" size="lg" className="w-full bg-surface-highlight/30 border-surface-highlight/50">
              <Trophy className="w-5 h-5 mr-2 text-primary" />
              Browse Leagues
            </Button>
          </Link>
        </div>

        {/* Active Leagues */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Active Leagues</h2>
            <Badge variant="info">Loading...</Badge>
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
                // Map database status to component status
                const getDisplayStatus = (): 'active' | 'full' | 'completed' => {
                  if (league.status === 'ended' || league.status === 'cancelled') return 'completed';
                  const isFull = (league.league_members?.length || 0) >= league.max_players;
                  if (isFull) return 'full';
                  return 'active';
                };

                return (
                  <LeagueCard
                    key={league.id}
                    league={{
                      id: league.id,
                      name: league.name,
                      members: league.league_members?.length || 0,
                      maxMembers: league.max_players,
                      prizePool: league.mode === 'competitive' ? 'TBD' : 'Social',
                      status: getDisplayStatus(),
                      entryFee: 'Free'
                    }}
                  />
                );
              })
            ) : (
              <p className="text-center text-muted py-8">
                No active leagues found. Create one to get started!
              </p>
            )}
          </div>
        </section>

        {/* Trending Markets Today */}
        {renderTrendingRow(
          "Trending Markets Today",
          trendingToday,
          livePricesToday,
          liveStatusToday,
          loadingToday,
          errorToday,
          "No trending markets today."
        )}

        {/* Trending Markets Weekly */}
        {renderTrendingRow(
          "Trending Markets Weekly",
          trendingWeek,
          livePricesWeek,
          liveStatusWeek,
          loadingWeek,
          errorWeek,
          "No weekly trending markets yet."
        )}
      </div>
    </AppLayout>
  );
}