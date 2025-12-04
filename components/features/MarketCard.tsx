import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonText } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

interface MarketCardProps {
  market?: {
    id: string;
    question: string;
    yesPrice: number;
    noPrice: number;
    volume: string;
    endTime: string;
  };
  loading?: boolean;
}

export function MarketCard({ market, loading }: MarketCardProps) {
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

  const priceChange = 0; // Placeholder for real-time price changes

  return (
    <Card hoverable>
      <CardHeader>
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-text leading-tight">
            {market.question}
          </h3>
          <Badge variant={priceChange > 0 ? 'success' : priceChange < 0 ? 'error' : 'default'}>
            {priceChange > 0 ? '↑' : priceChange < 0 ? '↓' : '→'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* YES/NO Prices */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <div className="text-center">
                <div className="text-xs text-muted">YES</div>
                <div className="font-bold">${market.yesPrice.toFixed(2)}</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <div className="text-center">
                <div className="text-xs text-muted">NO</div>
                <div className="font-bold">${market.noPrice.toFixed(2)}</div>
              </div>
            </Button>
          </div>

          {/* Market Info */}
          <div className="flex justify-between text-xs text-muted">
            <span>Volume: {market.volume}</span>
            <span>Ends: {market.endTime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}