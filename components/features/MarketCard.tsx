"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonText } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { ExtendedMarketCardProps } from "@/lib/types/polymarket";
import { formatVolume, formatEndTime, formatLocalEndDate } from "@/lib/api/polymarket";
import { usePreferences } from "@/lib/providers/PreferencesProvider";

interface MarketCardProps extends ExtendedMarketCardProps {
  loading?: boolean;
  className?: string;
}

export function MarketCard({ market, loading, onSelect, selectedSide, selectedMarket, livePrice, isLive, className }: MarketCardProps) {
  const { marketDisplayMode } = usePreferences();

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <SkeletonText lines={2} />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <SkeletonText lines={2} />
            <div className="flex gap-2">
              <div className="flex-1 h-8 bg-surface rounded-md animate-pulse" />
              <div className="flex-1 h-8 bg-surface rounded-md animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!market) return null;

  // Parse outcome prices for YES/NO
  const outcomePrices = market.outcomePrices || [];
  const yesPrice = livePrice?.yesPrice ?? outcomePrices[0] ?? 0.5;
  const noPrice = livePrice?.noPrice ?? outcomePrices[1] ?? 0.5;

  const endDateValue = market.endTime;
  
  const isSelected = selectedMarket === market.id;
  const selectionGlow =
    isSelected && selectedSide === 'YES'
      ? 'ring-2 ring-success shadow-[0_0_0_10px_rgba(74,222,128,0.12)] bg-success/5'
      : isSelected && selectedSide === 'NO'
        ? 'ring-2 ring-error shadow-[0_0_0_10px_rgba(244,63,94,0.12)] bg-error/5'
        : isSelected
          ? 'ring-2 ring-primary shadow-[0_0_0_10px_rgba(240,100,100,0.12)]'
          : '';

  const valueLabel =
    marketDisplayMode === "probability"
      ? "Probability"
      : marketDisplayMode === "odds"
        ? "Odds"
        : "Price";

  const formatDisplay = (value: number) => {
    const clamp = Math.min(Math.max(value, 0), 1);
    if (marketDisplayMode === "probability") {
      return `${(clamp * 100).toFixed(1)}%`;
    }
    if (marketDisplayMode === "odds") {
      const decimalOdds = clamp > 0 ? (1 / clamp) : Infinity;
      return `${decimalOdds === Infinity ? "—" : decimalOdds.toFixed(2)}x`;
    }
    // price
    return `$${value.toFixed(2)}`;
  };

  return (
    <Card
      className={`relative h-full overflow-hidden border border-surface-highlight/60 bg-surface/70 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg/40 hover:ring-1 hover:ring-primary/40 ${selectionGlow} ${className ?? ''}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
        style={{
          background: `radial-gradient(50% 40% at 20% 0%, rgba(240,100,100,0.12), transparent 55%), radial-gradient(40% 35% at 80% 5%, rgba(74,222,128,0.12), transparent 55%)`
        }}
      />
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-text leading-tight text-[15px] sm:text-base line-clamp-2">
              {market.question}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-2">
            {market.category && (
              <Badge variant="outline" className="text-[11px] uppercase tracking-wide bg-surface/60 border-surface-highlight/80">
                {market.category}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-3">
          {/* YES/NO Prices */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="lg"
              className={`w-full h-auto py-3 flex-col gap-1 rounded-xl bg-surface-highlight/30 border border-surface-highlight/70 shadow-inner hover:border-success/60 hover:bg-success/15 ${
                isSelected && selectedSide === 'YES' ? 'bg-success/20 text-success border-success/40 shadow-[0_10px_30px_-12px_rgba(74,222,128,0.35)]' : ''
              }`}
              onClick={() => onSelect?.(market.id, 'YES')}
            >
              <span className="text-[11px] font-semibold text-muted tracking-wide">YES</span>
              <span className="font-bold text-xl leading-tight text-success">{formatDisplay(yesPrice)}</span>
              <span className="text-[11px] text-muted">{valueLabel}</span>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className={`w-full h-auto py-3 flex-col gap-1 rounded-xl bg-surface-highlight/30 border border-surface-highlight/70 shadow-inner hover:border-error/60 hover:bg-error/15 ${
                isSelected && selectedSide === 'NO' ? 'bg-error/20 text-error border-error/40 shadow-[0_10px_30px_-12px_rgba(244,63,94,0.35)]' : ''
              }`}
              onClick={() => onSelect?.(market.id, 'NO')}
            >
              <span className="text-[11px] font-semibold text-muted tracking-wide">NO</span>
              <span className="font-bold text-xl leading-tight text-error">{formatDisplay(noPrice)}</span>
              <span className="text-[11px] text-muted">{valueLabel}</span>
            </Button>
          </div>

          {/* Market Info */}
          <div className="flex justify-between items-center text-xs font-medium text-muted border-t border-surface-highlight/50 pt-3">
            <span className="flex items-center gap-1">Vol {formatVolume(market.volume24hr || market.volume)}</span>
            <span className="flex items-center gap-1">⏱ Ends {formatEndTime(endDateValue)} ({formatLocalEndDate(endDateValue)})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}