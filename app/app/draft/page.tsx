"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MarketCard } from "@/components/features";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { SkeletonText } from "@/components/ui/Skeleton";
import { useDailyMarkets, useMarketSelection, useDraftTimer, usePolymarketLivePrices } from "@/lib/hooks/usePolymarket";
import { cn } from "@/lib/utils";
import { Clock, Check, RefreshCw, Zap } from "lucide-react";

export default function DraftPage() {
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const { data: marketSelections, isLoading, error, refetch, isFetching } = useDailyMarkets(undefined, shuffleSeed.toString());
  const {
    selectedMarket,
    selectedSide,
    selectMarket,
    confirmPick,
    totalPicks,
  } = useMarketSelection();

  const { timeLeft, formatTime, startTimer } = useDraftTimer(45);
  const { livePrices, status: liveStatus } = usePolymarketLivePrices(marketSelections);

  useEffect(() => {
    if (!isLoading && marketSelections && marketSelections.length > 0) {
      startTimer();
    }
  }, [isLoading, marketSelections, startTimer]);

  const handleMakePick = () => {
    const newPick = confirmPick();
    if (newPick) {
      console.log(`Confirmed: ${newPick.side} for ${newPick.marketId}`);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Draft">
        <div className="p-4 space-y-4">
          <Card><CardContent className="py-6"><SkeletonText lines={2} /></CardContent></Card>
          <MarketCard loading />
          <MarketCard loading />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Draft">
        <div className="p-4">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-error mb-4">{error.message}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!marketSelections || marketSelections.length === 0) {
    return (
      <AppLayout title="Draft">
        <div className="p-4">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No markets available</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Draft">
      {/* Sticky Draft Status Header */}
      <div className="sticky top-14 z-30 bg-background border-b border-border/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <Badge variant="success">
            <Zap className="h-3.5 w-3.5 mr-1" />
            Pick #{totalPicks + 1}
          </Badge>
          <span className={cn(
            "text-2xl font-bold tabular-nums",
            timeLeft <= 10 ? "text-error" : "text-foreground"
          )}>
            {formatTime()}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {/* Markets */}
        {marketSelections.map((selection) => {
          const prices = selection.market.outcomePrices?.split(',').map(Number) || [];
          const yesPrice = selection.market.bestBuyYesPrice ?? prices[0] ?? 0.5;
          const noPrice = selection.market.bestBuyNoPrice ?? prices[1] ?? (1 - yesPrice);

          return (
            <MarketCard
              key={selection.event.id}
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
                clobTokenIds: selection.market.clobTokenIds?.split(',').map((t) => t.trim()),
              }}
              onSelect={selectMarket}
              selectedSide={selectedSide}
              selectedMarket={selectedMarket}
              livePrice={livePrices[selection.market.id]}
              isLive={liveStatus === 'connected'}
            />
          );
        })}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            disabled={!selectedMarket || !selectedSide}
            onClick={handleMakePick}
          >
            {selectedMarket ? `Confirm ${selectedSide}` : "Select a market"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => { setShuffleSeed(s => s + 1); refetch(); }}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
            Refresh Markets
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
