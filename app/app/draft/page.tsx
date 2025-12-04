"use client";
  
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MarketCard } from "@/components/features";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonText } from "@/components/ui/Skeleton";
// import { useAuth } from "@/lib/hooks";
// import { useRouter } from "next/navigation";
import { useDailyMarkets, useMarketSelection, useDraftTimer } from "@/lib/hooks/usePolymarket";
import { MarketSelection } from "@/lib/types/polymarket";

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
          <div className="text-center">
            <SkeletonText lines={1} className="w-32 mx-auto" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-surface rounded-lg animate-pulse" />
            ))}
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
        {/* Draft Status */}
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
        </div>

        {/* Draft Board */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Draft Board</h3>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const pick = picks[i];
            return (
              <div
                key={i + 1}
                className={`
                  aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center text-xs
                  ${pick 
                    ? 'border-success bg-success/20' 
                    : i === totalPicks 
                      ? 'border-primary bg-primary/20 animate-pulse' 
                      : 'border-surface/20 bg-surface/30'
                  }
                `}
              >
                <div className="text-muted mb-1">#{i + 1}</div>
                <div className="text-muted">
                  {pick ? `${pick.side} - ${pick.marketId.slice(0, 8)}...` : 'Empty'}
                </div>
              </div>
            );
          })}
        </div>
        </div>

        {/* Available Markets */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Available Markets</h3>
          <div className="space-y-3">
            {marketSelections.map((selection, index) => (
              <div key={selection.event.id} className="space-y-2">
                <MarketCard 
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
                  }}
                  onSelect={selectMarket}
                  selectedSide={selectedSide}
                  selectedMarket={selectedMarket}
                />
              </div>
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