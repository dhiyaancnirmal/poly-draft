"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonText } from "@/components/ui/Skeleton";
import { ExtendedMarketCardProps } from "@/lib/types/polymarket";
import { formatVolume, formatEndTime } from "@/lib/api/polymarket";
import { usePreferences } from "@/lib/providers/PreferencesProvider";
import { cn } from "@/lib/utils";
import { TrendingUp, Clock } from "lucide-react";

interface MarketCardProps extends ExtendedMarketCardProps {
  loading?: boolean;
  className?: string;
}

export function MarketCard({ 
  market, 
  loading, 
  onSelect, 
  selectedSide, 
  selectedMarket, 
  livePrice, 
  isLive, 
  className 
}: MarketCardProps) {
  const { marketDisplayMode } = usePreferences();

  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <SkeletonText lines={2} />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 bg-accent/50 rounded-xl animate-pulse" />
              <div className="h-16 bg-accent/50 rounded-xl animate-pulse" />
            </div>
            <SkeletonText lines={1} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!market) return null;

  const outcomePrices = market.outcomePrices || [];
  const yesPrice = livePrice?.yesPrice ?? outcomePrices[0] ?? 0.5;
  const noPrice = livePrice?.noPrice ?? outcomePrices[1] ?? 0.5;

  const categoryLabel = market.categoryLabel || market.category || 'Uncategorized';

  const isSelected = selectedMarket === market.id;
  const isYesSelected = isSelected && selectedSide === 'YES';
  const isNoSelected = isSelected && selectedSide === 'NO';

  const formatDisplay = (value: number) => {
    const clamp = Math.min(Math.max(value, 0), 1);
    if (marketDisplayMode === "probability") {
      return `${(clamp * 100).toFixed(0)}%`;
    }
    if (marketDisplayMode === "odds") {
      const decimalOdds = clamp > 0 ? (1 / clamp) : Infinity;
      return `${decimalOdds === Infinity ? "—" : decimalOdds.toFixed(2)}x`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <Card className={cn("overflow-hidden rounded-xl", isSelected && "ring-2 ring-primary/50", className)}>
      <CardHeader className="pb-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-foreground text-[13px] leading-snug line-clamp-2">
              {market.question}
            </h3>
            <Badge variant="outline" size="sm" className="text-[9px] uppercase tracking-wide">
              {categoryLabel}
            </Badge>
          </div>
          {isLive && (
            <Badge variant="success" size="sm" className="flex-shrink-0">Live</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSelect?.(market.id, 'YES')}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl p-2.5 border",
                isYesSelected 
                  ? "border-success bg-success/15" 
                  : "border-border/50 bg-accent/30"
              )}
            >
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">YES</span>
              <span className={cn("font-bold text-lg", isYesSelected ? "text-success" : "text-success/80")}>
                {formatDisplay(yesPrice)}
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => onSelect?.(market.id, 'NO')}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl p-2.5 border",
                isNoSelected 
                  ? "border-error bg-error/15" 
                  : "border-border/50 bg-accent/30"
              )}
            >
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">NO</span>
              <span className={cn("font-bold text-lg", isNoSelected ? "text-error" : "text-error/80")}>
                {formatDisplay(noPrice)}
              </span>
            </button>
          </div>

          <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-2 border-t border-border/40">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {formatVolume(market.volume24hr || market.volume)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatEndTime(market.endTime)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
