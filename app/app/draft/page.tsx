"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Use real market data with shuffle support
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const { data: marketSelections, isLoading, error, refetch, isFetching } = useDailyMarkets(undefined, shuffleSeed.toString());
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

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isCondensed, setIsCondensed] = useState(false);

  // Auto-advance carousel
  useEffect(() => {
    const totalSlots = 12;
    const interval = setInterval(() => {
      setDirection(1);
      setCarouselIndex((prev) => (prev + 1) % totalSlots);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // Condense header on scroll
  useEffect(() => {
    const onScroll = () => {
      setIsCondensed(window.scrollY > 32);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visibleIndices = useMemo(() => {
    const totalSlots = 12;
    const wrap = (n: number) => (n + totalSlots) % totalSlots;
    return [wrap(carouselIndex - 1), wrap(carouselIndex), wrap(carouselIndex + 1)];
  }, [carouselIndex]);

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
      <div className="p-4 space-y-4">
        {/* Draft Status + Carousel (sticky, compact header) */}
        <div className="sticky top-0 z-30 pt-2 pb-2 bg-background/90 backdrop-blur">
          <div
            className={`mx-1 space-y-2 rounded-lg border border-border/60 bg-surface/85 shadow-card px-3 transition-all ${
              isCondensed ? "py-2" : "py-3"
            }`}
          >
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <Badge variant="success" className="whitespace-nowrap px-3 py-1 text-xs">
                🎯 Pick #{totalPicks + 1}
              </Badge>
              <div className={`text-center font-semibold text-foreground tabular-nums transition-all ${isCondensed ? "text-base" : "text-lg"}`}>
                {formatTime()}
              </div>
              <div className="flex items-center justify-end">
                <Badge variant="success" className="whitespace-nowrap px-3 py-1 text-xs opacity-0">
                  spacer
                </Badge>
              </div>
            </div>

            <div className="relative h-[84px] overflow-hidden px-1 py-1">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={carouselIndex}
                  custom={direction}
                  initial={{ x: direction * 80, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction * -80, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-stretch gap-2"
                >
                  {visibleIndices.map((i) => {
                    const pick = picks[i];
                    const isCurrent = i === totalPicks;
                    return (
                      <div
                        key={i}
                        className={`
                          flex-1 min-w-0 rounded-md border px-3 py-2 flex flex-col items-center justify-center text-center
                          ${pick
                            ? 'border-success/60 bg-success/12'
                            : isCurrent
                              ? 'border-primary/70 bg-primary/12'
                              : 'border-border/40 bg-surface/70'
                          }
                        `}
                      >
                        <div className="text-sm font-semibold text-foreground">
                          #{i + 1}
                        </div>
                        {pick ? (
                          <div className="text-xs text-muted truncate max-w-[140px]">
                            {pick.side} · {pick.marketId.slice(0, 8)}...
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Markets & action (no extra section header) */}
        <div className="space-y-3">
          <div className="space-y-3">
            {marketSelections.map((selection) => {
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
                  className="min-h-[240px]"
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
                    clobTokenIds: selection.market.clobTokenIds?.split(',').map((token) => token.trim()),
                  }}
                  onSelect={selectMarket}
                  selectedSide={selectedSide}
                  selectedMarket={selectedMarket}
                  livePrice={livePrices[selection.market.id]}
                  isLive={liveStatus === 'connected'}
                />
              );
            })}
          </div>

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

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              setShuffleSeed((s) => s + 1);
              refetch();
            }}
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing...' : 'Change markets'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}