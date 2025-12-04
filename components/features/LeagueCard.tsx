import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonText } from "@/components/ui/Skeleton";

interface LeagueCardProps {
  league?: {
    id: string;
    name: string;
    members: number;
    maxMembers: number;
    prizePool: string;
    status: 'active' | 'full' | 'completed';
    entryFee: string;
  };
  loading?: boolean;
  action?: React.ReactNode;
}

export function LeagueCard({ league, loading, action }: LeagueCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <SkeletonText lines={2} />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <SkeletonText lines={3} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!league) return null;

  const statusVariant = league.status === 'active' ? 'success' :
    league.status === 'full' ? 'warning' : 'default';

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-lg text-text">{league.name}</h3>
          <Badge variant={statusVariant}>
            {league.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm border-b border-surface-highlight/50 pb-3">
            <span className="text-muted font-medium">Players</span>
            <span className="text-text font-bold bg-surface-highlight/30 px-2 py-1 rounded-md">
              {league.members}/{league.maxMembers}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-surface-highlight/50 pb-3">
            <span className="text-muted font-medium">Prize Pool</span>
            <span className="text-primary font-bold">{league.prizePool}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted font-medium">Entry Fee</span>
            <span className="text-text font-bold">{league.entryFee}</span>
          </div>
          {action && (
            <div className="mt-4 pt-4 border-t border-surface-highlight/50">
              {action}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}