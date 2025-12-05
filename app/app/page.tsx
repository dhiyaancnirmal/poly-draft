"use client";

import { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeagueCard, MarketCard } from "@/components/features";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Plus, Trophy, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLeagues } from "@/lib/hooks";
import { useTrendingMarkets, usePolymarketLivePrices } from "@/lib/hooks/usePolymarket";
import { CreateLeagueForm } from "./leagues/create/CreateLeagueForm";

// Demo league for testing UI
const DEMO_LEAGUE = {
  id: "demo-league-123",
  name: "Demo League",
  members: 4,
  maxMembers: 8,
  status: "active" as const,
};

export default function HomePage() {
  const { leagues, loading: isLoadingLeagues } = useLeagues();
  const { data: trendingMarkets, isLoading: isLoadingTrending } = useTrendingMarkets();
  const { livePrices: trendingLivePrices, status: trendingLiveStatus } = usePolymarketLivePrices(trendingMarkets);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const router = useRouter();

  // Include demo league if no real leagues exist
  const displayLeagues = leagues.length > 0 ? leagues : [];
  const showDemoLeague = leagues.length === 0;

  return (
    <AppLayout title="PolyDraft">
      <div className="p-4 space-y-6 pb-32">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="w-full h-auto py-4 flex-col gap-2"
            onClick={() => setShowCreateSheet(true)}
          >
            <Plus className="h-5 w-5" />
            <span className="font-semibold">Create League</span>
          </Button>
          <Link href="/app/leagues" className="w-full">
            <Button
              variant="secondary"
              size="lg"
              className="w-full h-auto py-4 flex-col gap-2"
            >
              <Trophy className="h-5 w-5" />
              <span className="font-semibold">My Leagues</span>
            </Button>
          </Link>
        </div>

        {/* Active Leagues */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Leagues</h2>
            <Link href="/app/leagues" className="text-xs text-primary">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {isLoadingLeagues ? (
              <>
                <LeagueCard loading />
                <LeagueCard loading />
              </>
            ) : (
              <>
                {/* Demo league for testing */}
                {showDemoLeague && (
                  <LeagueCard
                    league={DEMO_LEAGUE}
                    onClick={() => router.push(`/app/leagues/${DEMO_LEAGUE.id}`)}
                    onOpen={() => router.push(`/app/leagues/${DEMO_LEAGUE.id}`)}
                    showInfoToggle={false}
                  />
                )}
                {displayLeagues.slice(0, 3).map((league) => (
                  <LeagueCard
                    key={league.id}
                    league={{
                      id: league.id,
                      name: league.name,
                      members: league.league_members?.length || 0,
                      maxMembers: league.max_players || 8,
                      status: league.status || "open",
                    }}
                    onClick={() => router.push(`/app/leagues/${league.id}`)}
                    onOpen={() => router.push(`/app/leagues/${league.id}`)}
                    showInfoToggle={false}
                  />
                ))}
              </>
            )}
          </div>
        </section>

        {/* Trending Markets */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Trending</h2>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>

          {isLoadingTrending ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              <MarketCard loading className="min-w-[280px] flex-shrink-0" />
              <MarketCard loading className="min-w-[280px] flex-shrink-0" />
            </div>
          ) : trendingMarkets && trendingMarkets.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
              {trendingMarkets.map((selection: any) => {
                const prices = selection.market.outcomePrices
                  ? selection.market.outcomePrices.split(',').map(Number)
                  : [];
                const yesPrice = selection.market.bestBuyYesPrice ?? prices[0] ?? 0.5;
                const noPrice = selection.market.bestBuyNoPrice ?? prices[1] ?? (1 - yesPrice);

                return (
                  <div key={selection.event.id} className="snap-start min-w-[280px] flex-shrink-0">
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
                        categoryLabel: selection.categoryLabel,
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
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted-foreground">No trending markets</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Create League Sheet */}
        {showCreateSheet && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
            onClick={() => setShowCreateSheet(false)}
          >
            <div
              className="w-full max-w-mobile rounded-t-2xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                <h2 className="text-base font-bold text-foreground">Create League</h2>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-4 pb-24">
                <CreateLeagueForm />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
