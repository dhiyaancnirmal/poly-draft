"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonText } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { Trophy, Users } from "lucide-react";

interface LeagueCardProps {
  league?: {
    id: string;
    name: string;
    members: number;
    maxMembers: number;
    status?: string;
  };
  loading?: boolean;
  onClick?: () => void;
  onOpen?: () => void;
  showInfoToggle?: boolean;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  open: { label: "Open", variant: "success" },
  drafting: { label: "Drafting", variant: "info" },
  active: { label: "Live", variant: "info" },
  live: { label: "Live", variant: "info" },
  ended: { label: "Ended", variant: "default" },
  cancelled: { label: "Cancelled", variant: "default" },
  full: { label: "Full", variant: "warning" },
};

export function LeagueCard({
  league,
  loading,
  onClick,
  className,
}: LeagueCardProps) {
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <div className="p-4">
          <SkeletonText lines={2} />
        </div>
      </Card>
    );
  }

  if (!league) return null;

  const status = statusConfig[league.status || "open"] || statusConfig.open;
  const fillPercent = league.maxMembers
    ? Math.min(100, Math.round((league.members / league.maxMembers) * 100))
    : 0;

  return (
    <Card onClick={onClick} className={cn("cursor-pointer", className)}>
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
          <Trophy className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">
              {league.name}
            </h3>
            <Badge variant={status.variant} size="sm">
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{league.members}/{league.maxMembers || "∞"}</span>
          </div>

          {league.maxMembers > 0 && (
            <div className="h-1 w-full rounded-full bg-accent overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
