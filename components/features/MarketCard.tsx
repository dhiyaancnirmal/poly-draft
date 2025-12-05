import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonText } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { ExtendedMarketCardProps } from "@/lib/types/polymarket";
import { formatVolume, formatEndTime, formatLocalEndDate } from "@/lib/api/polymarket";

interface MarketCardProps extends ExtendedMarketCardProps {
  loading?: boolean;
  className?: string;
}

export function MarketCard({ market, loading, onSelect, selectedSide, selectedMarket, livePrice, isLive, className }: MarketCardProps) {
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
  
  const priceChange = livePrice?.priceChange ?? 0;
  const priceChangeLabel = priceChange !== 0 ? `${priceChange > 0 ? '+' : ''}${(priceChange * 100).toFixed(1)}%` : '—';
  const isSelected = selectedMarket === market.id;
  const liveDot = isLive ? 'bg-success shadow-[0_0_0_6px_rgba(52,211,153,0.18)]' : 'bg-error shadow-[0_0_0_6px_rgba(244,114,182,0.18)]';

  return (
    <Card className={`h-full ${isSelected ? 'ring-2 ring-primary' : ''} ${className ?? ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-text leading-tight">
              {market.question}
            </h3>
            {market.category && (
              <Badge variant="outline" className="mt-1 text-xs">
                {market.category}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${liveDot}`} aria-label={isLive ? "Live" : "Disconnected"} />
            <Badge variant={priceChange > 0 ? 'success' : priceChange < 0 ? 'error' : 'default'}>
              {priceChange > 0 ? '↑' : priceChange < 0 ? '↓' : '→'} {priceChangeLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* YES/NO Prices */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="lg"
              className={`w-full h-auto py-3 flex-col gap-1 bg-surface-highlight/30 border border-transparent ${
                isSelected && selectedSide === 'YES' ? 'bg-success/20 text-success border-success/30' : ''
              }`}
              onClick={() => onSelect?.(market.id, 'YES')}
            >
              <span className="text-xs font-medium text-muted">YES</span>
              <span className="font-bold text-xl text-success">${yesPrice.toFixed(2)}</span>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className={`w-full h-auto py-3 flex-col gap-1 bg-surface-highlight/30 border border-transparent ${
                isSelected && selectedSide === 'NO' ? 'bg-error/20 text-error border-error/30' : ''
              }`}
              onClick={() => onSelect?.(market.id, 'NO')}
            >
              <span className="text-xs font-medium text-muted">NO</span>
              <span className="font-bold text-xl text-error">${noPrice.toFixed(2)}</span>
            </Button>
          </div>

          {/* Market Info */}
          <div className="flex justify-between text-xs font-medium text-muted border-t border-surface-highlight/50 pt-3">
            <span>Vol: {formatVolume(market.volume24hr || market.volume)}</span>
            <span>Ends: {formatEndTime(endDateValue)} ({formatLocalEndDate(endDateValue)})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}