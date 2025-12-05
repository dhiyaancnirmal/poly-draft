"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { MarketCard } from "@/components/features";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { SkeletonText } from "@/components/ui/Skeleton";
import { useDailyMarkets, useMarketSelection, useDraftTimer, usePolymarketLivePrices } from "@/lib/hooks/usePolymarket";
import { useDraftSync } from "@/lib/hooks/useDraftSync";
import { useAuth } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Clock, Check, RefreshCw, Zap } from "lucide-react";

export default function DraftRoomPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const { user } = useAuth();

  const { picks, members, currentTurn, isConnected, makePick } = useDraftSync(leagueId);

  const [shuffleSeed, setShuffleSeed] = useState(0);
  const { data: marketSelections, isLoading, error, refetch, isFetching } = useDailyMarkets(undefined, shuffleSeed.toString());
  const { livePrices, status: liveStatus } = usePolymarketLivePrices(marketSelections);

  const { selectedMarket, selectedSide, selectMarket } = useMarketSelection();
  const { timeLeft, formatTime, startTimer } = useDraftTimer(45);

  const pickedMarketIds = new Set(picks.map(p => p.market_id_text));
  const availableMarkets = marketSelections?.filter(
    selection => !pickedMarketIds.has(selection.market.id)
  ) || [];

  const isMyTurn = user?.id === currentTurn;

  useEffect(() => {
    if (!isLoading && marketSelections && marketSelections.length > 0 && isMyTurn) {
      startTimer();
    }
  }, [isLoading, marketSelections, startTimer, isMyTurn]);

  const handleConfirmPick = async () => {
    if (!selectedMarket || !selectedSide || !isMyTurn) return;
    const selection = marketSelections?.find((s) => s.market.id === selectedMarket);
    const prices = selection?.market.outcomePrices?.split(',').map(Number) || [];
    const yesPrice = selection?.market.bestBuyYesPrice ?? prices[0] ?? 0.5;
    const noPrice = selection?.market.bestBuyNoPrice ?? prices[1] ?? (1 - yesPrice);
    const price = selectedSide === "YES" ? yesPrice : noPrice;

    try {
      await makePick(selectedMarket, selectedSide, {
        price,
        marketTitle: selection?.market.question,
        endTime: selection?.event.endDate,
      });
      selectMarket('', 'YES');
    } catch (error: any) {
      alert(error.message || 'Failed to make pick');
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Draft" showInvitesBadge={false}>
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
      <AppLayout title="Draft" showInvitesBadge={false}>
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
      <AppLayout title="Draft" showInvitesBadge={false}>
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
    <AppLayout title="Draft" showInvitesBadge={false}>
      {/* Sticky Draft Status Header */}
      <div className="sticky top-14 z-30 bg-background border-b border-border/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMyTurn ? (
              <Badge variant="success">
                <Zap className="h-3.5 w-3.5 mr-1" />
                Pick #{picks.length + 1}
              </Badge>
            ) : (
              <Badge variant="outline">
                <Clock className="h-3.5 w-3.5 mr-1" />
                Waiting
              </Badge>
            )}
            {!isConnected && <Badge variant="warning">Offline</Badge>}
          </div>
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
        {availableMarkets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Check className="h-8 w-8 mx-auto text-success mb-2" />
              <p className="text-foreground font-medium">All markets picked</p>
            </CardContent>
          </Card>
        ) : (
          availableMarkets.map((selection) => {
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
          })
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            disabled={!selectedMarket || !selectedSide || !isMyTurn}
            onClick={handleConfirmPick}
          >
            {!isMyTurn ? "Not your turn" : selectedMarket ? `Confirm ${selectedSide}` : "Select a market"}
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
