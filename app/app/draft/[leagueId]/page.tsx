"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { MarketCard } from "@/components/features";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonText } from "@/components/ui/Skeleton";
import { useDailyMarkets, useMarketSelection, useDraftTimer } from "@/lib/hooks/usePolymarket";
import { useDraftSync } from "@/lib/hooks/useDraftSync";
import { useAuth } from "@/lib/hooks";
import { MarketSelection } from "@/lib/types/polymarket";

export default function DraftRoomPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const { user } = useAuth();

  // Real-time draft sync (NEW)
  const { picks, members, currentTurn, isConnected, makePick } = useDraftSync(leagueId);

  // Market data (from server proxy)
  const { data: marketSelections, isLoading, error } = useDailyMarkets();

  // Local selection state
  const { selectedMarket, selectedSide, selectMarket } = useMarketSelection();

  // Timer
  const { timeLeft, formatTime, startTimer } = useDraftTimer(45);

  // Filter out already-picked markets (NEW)
  const pickedMarketIds = new Set(picks.map(p => p.market_id_text));
  const availableMarkets = marketSelections?.filter(
    selection => !pickedMarketIds.has(selection.market.id)
  ) || [];

  // Determine if it's user's turn (NEW)
  const isMyTurn = user?.id === currentTurn;
  const currentMember = members.find(m => m.user_id === currentTurn);

  // Start timer when markets are loaded and it's user's turn
  useEffect(() => {
    if (!isLoading && marketSelections && marketSelections.length > 0 && isMyTurn) {
      startTimer();
    }
  }, [isLoading, marketSelections, startTimer, isMyTurn]);

  const handleConfirmPick = async () => {
    if (!selectedMarket || !selectedSide || !isMyTurn) {
      alert('Not your turn or no selection made');
      return;
    }

    try {
      await makePick(selectedMarket, selectedSide);
      // Pick saved to Supabase, real-time subscription will update UI
      selectMarket('', 'YES'); // Clear selection
    } catch (error: any) {
      console.error('Failed to make pick:', error);
      alert(error.message || 'Failed to make pick');
    }
  };

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
        {/* Connection Status */}
        {!isConnected && (
          <div className="flex justify-center">
            <Badge variant="warning">Reconnecting...</Badge>
          </div>
        )}

        {/* Draft Status */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-4">
            {isMyTurn ? (
              <Badge variant="success">
                🎯 Your Pick #{picks.length + 1}
              </Badge>
            ) : (
              <Badge variant="outline">
                ⏳ Waiting
              </Badge>
            )}
            <div className="text-2xl font-bold text-text">
              {formatTime()}
            </div>
          </div>
          {isMyTurn ? (
            <p className="text-sm text-muted">
              Make your selection before time runs out
            </p>
          ) : (
            <p className="text-sm text-muted">
              Waiting for {currentMember?.user_id?.slice(0, 8) || 'Player'}&apos;s pick...
            </p>
          )}
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
                      : i === picks.length
                        ? 'border-primary bg-primary/20 animate-pulse'
                        : 'border-surface/20 bg-surface/30'
                    }
                  `}
                >
                  <div className="text-muted mb-1">#{i + 1}</div>
                  {pick ? (
                    <div className="text-center">
                      <div className="font-medium text-xs">{pick.outcome_side}</div>
                      <div className="text-muted text-xs">{pick.market_id_text.slice(0, 8)}...</div>
                    </div>
                  ) : (
                    <div className="text-muted">Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Markets */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted">
            Available Markets ({availableMarkets.length})
          </h3>
          {availableMarkets.length === 0 ? (
            <div className="text-center text-muted py-8">
              <p>All markets have been picked!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableMarkets.map((selection) => (
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
          )}

          {/* Submit Pick Button */}
          <Button
            size="lg"
            className="w-full"
            disabled={!selectedMarket || !selectedSide || !isMyTurn}
            onClick={handleConfirmPick}
          >
            {!isMyTurn
              ? "Not your turn"
              : selectedMarket && selectedSide
                ? `Confirm: ${selectedSide} for selected market`
                : "Select a market and side"
            }
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
