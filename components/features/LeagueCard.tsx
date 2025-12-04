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
}

export function LeagueCard({ league, loading }: LeagueCardProps) {
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
    <Card hoverable>
      <CardHeader>
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-text">{league.name}</h3>
          <Badge variant={statusVariant}>
            {league.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Players</span>
            <span className="text-text font-medium">
              {league.members}/{league.maxMembers}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Prize Pool</span>
            <span className="text-text font-medium">{league.prizePool}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Entry Fee</span>
            <span className="text-text font-medium">{league.entryFee}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}