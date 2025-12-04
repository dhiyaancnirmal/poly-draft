"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MarketCard } from "@/components/features";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";
// import { useAuth } from "@/lib/hooks";
// import { useRouter } from "next/navigation";
import { useDailyMarkets, useMarketSelection, useDraftTimer, usePolymarketLivePrices } from "@/lib/hooks/usePolymarket";

export default function DraftPage() {
  // const { user } = useAuth();
  // const router = = useRouter();

  // Use real market data
  const { data: marketSelections, isLoading, error } = useDailyMarkets();
  const {
    selectedMarket,
    selectedSide,
    picks,
    selectMarket,
    confirmPick,
    clearSelection,
    totalPicks,
    hasSelection
  } = useMarketSelection();

  const { timeLeft, formatTime, startTimer, resetTimer } = useDraftTimer(45);
  const { livePrices, status: liveStatus } = usePolymarketLivePrices(marketSelections);

  // Start timer when markets are loaded
  useEffect(() => {
    if (!isLoading && marketSelections && marketSelections.length > 0) {
      startTimer();
    }
  }, [isLoading, marketSelections, startTimer]);

  const handleMakePick = () => {
    const newPick = confirmPick();
    if (newPick) {
      console.log(`Confirmed pick: ${newPick.side} for market ${newPick.marketId}`);
    }
  };

  // Bypass auth check for testing
  // if (!user) {
  //   return (
  //     <AppLayout title="Draft Room">
  //       <div className="p-4 space-y-6">
  //         <div className="text-center">
  //           <p className="text-muted">Please sign in to join the draft.</p>
  //           <Button onClick={() => router.push('/splash')} className="mt-4">
  //             Sign In
  //           </Button>
  //         </div>
  //       </div>
  //     </AppLayout>
  //   );
  // }

  if (isLoading) {
    return (
      <AppLayout title="Draft Room">
        <div className="p-4 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
            <SkeletonText lines={1} className="w-40 mx-auto" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 rounded-full" />
            <div className="flex items-stretch gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-36 rounded-full" />
            <div className="flex gap-3 overflow-hidden">
              <SkeletonCard className="min-w-[320px] h-52" />
              <SkeletonCard className="min-w-[320px] h-52" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Draft Room">
        <div className="p-4 space-y-6">
          <div className="text-center">
            <p className="text-error">Error loading markets: {error.message}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!marketSelections || marketSelections.length === 0) {
    return (
      <AppLayout title="Draft Room">
        <div className="p-4 space-y-6">
          <div className="text-center">
            <p className="text-muted">No markets available for today. Check back later!</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Draft Room">
      <div className="p-4 space-y-6">
        {/* Draft Status + Order (sticky) */}
        <div className="sticky top-[88px] z-20">
          <div className="rounded-2xl border border-border/60 bg-surface/80 px-4 py-3 shadow-card backdrop-blur">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-4">
                <Badge variant="success">
                  🎯 Your Pick #{totalPicks + 1}
                </Badge>
                <div className="text-2xl font-bold text-text">
                  {formatTime()}
                </div>
              </div>
              <p className="text-sm text-muted">
                Make your selection before time runs out
              </p>
              <div className="flex items-center justify-center">
                <Badge variant={liveStatus === 'connected' ? 'success' : liveStatus === 'connecting' ? 'info' : 'default'}>
                  Live prices: {liveStatus}
                </Badge>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium text-muted">Pick Order</h3>
              <div className="flex items-stretch gap-3 overflow-hidden rounded-xl border border-border/60 bg-surface/60 px-3 py-3">
                {([totalPicks - 1, totalPicks, totalPicks + 1] as const)
                  .filter((i) => i >= 0 && i < 12)
                  .map((i) => {
                    const pick = picks[i];
                    const isCurrent = i === totalPicks;
                    return (
                      <div
                        key={i}
                        className={`
                          flex-1 min-w-0 rounded-xl border-2 p-3 flex flex-col items-center justify-center text-xs text-center
                          ${pick
                            ? 'border-success bg-success/15'
                            : isCurrent
                              ? 'border-primary bg-primary/15'
                              : 'border-border/60 bg-surface/70'
                          }
                        `}
                      >
                        <div className="text-[11px] font-semibold text-muted mb-1">
                          #{i + 1} {isCurrent ? '(Now)' : i < totalPicks ? '(Prev)' : '(Next)'}
                        </div>
                        <div className="text-sm text-foreground font-medium truncate max-w-[160px]">
                          {pick ? `${pick.side} - ${pick.marketId.slice(0, 8)}...` : 'Waiting'}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Available Markets */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Available Markets</h3>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {marketSelections.map((selection) => (
              <MarketCard
                key={selection.event.id}
                className="min-h-[240px]"
                market={{
                  id: selection.market.id,
                  question: selection.market.question,
                  description: selection.event.description,
                  outcomes: selection.market.outcomes.split(','),
                  outcomePrices: selection.market.outcomePrices.split(',').map(Number),
                  yesPrice: Number(selection.market.outcomePrices.split(',')[0]),
                  noPrice: Number(selection.market.outcomePrices.split(',')[1]),
                  volume: selection.market.volume,
                  volume24hr: selection.event.volume24hr,
                  endTime: selection.event.endDate,
                  category: selection.category,
                  slug: selection.market.slug,
                  liquidity: selection.market.liquidity,
                  active: selection.market.active,
                  clobTokenIds: selection.market.clobTokenIds?.split(',').map((token) => token.trim()),
                }}
                onSelect={selectMarket}
                selectedSide={selectedSide}
                selectedMarket={selectedMarket}
                livePrice={livePrices[selection.market.id]}
                isLive={liveStatus === 'connected'}
              />
            ))}
          </div>

          {/* Submit Pick Button */}
          <Button
            size="lg"
            className="w-full"
            disabled={!hasSelection}
            onClick={handleMakePick}
          >
            {hasSelection
              ? `Confirm: ${selectedSide} for selected market`
              : "Select a market and side"
            }
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}