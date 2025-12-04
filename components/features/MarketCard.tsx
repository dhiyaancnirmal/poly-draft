import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonText } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { ExtendedMarketCardProps } from "@/lib/types/polymarket";
import { formatVolume, formatEndTime } from "@/lib/api/polymarket";

interface MarketCardProps extends ExtendedMarketCardProps {
  loading?: boolean;
}

export function MarketCard({ market, loading, onSelect, selectedSide, selectedMarket }: MarketCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <SkeletonText lines={2} />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <SkeletonText lines={2} />
            <div className="flex gap-2">
              <div className="flex-1 h-8 bg-surface rounded animate-pulse" />
              <div className="flex-1 h-8 bg-surface rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!market) return null;

  // Parse outcome prices for YES/NO
  const outcomePrices = market.outcomePrices || [];
  const yesPrice = outcomePrices[0] || 0.5;
  const noPrice = outcomePrices[1] || 0.5;
  
  const priceChange = 0; // Placeholder for real-time price changes
  const isSelected = selectedMarket === market.id;

  return (
    <Card hoverable className={`group ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-text leading-tight group-hover:text-primary transition-colors">
              {market.question}
            </h3>
            {market.category && (
              <Badge variant="outline" className="mt-1 text-xs">
                {market.category}
              </Badge>
            )}
          </div>
          <Badge variant={priceChange > 0 ? 'success' : priceChange < 0 ? 'error' : 'default'}>
            {priceChange > 0 ? '↑' : priceChange < 0 ? '↓' : '→'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* YES/NO Prices */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="lg"
              className={`w-full h-auto py-3 flex-col gap-1 bg-surface-highlight/30 hover:bg-success/10 hover:text-success border border-transparent hover:border-success/20 transition-all ${
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
              className={`w-full h-auto py-3 flex-col gap-1 bg-surface-highlight/30 hover:bg-error/10 hover:text-error border border-transparent hover:border-error/20 transition-all ${
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
            <span>Ends: {formatEndTime(market.endTime)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}