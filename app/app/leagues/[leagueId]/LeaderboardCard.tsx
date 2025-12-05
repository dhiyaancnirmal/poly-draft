"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePredixTransparency } from "@/lib/hooks/usePredix";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Wallet,
} from "lucide-react";

interface LeagueMember {
  teamName: string | null;
  userId: string;
  joinedAt: string | null;
}

interface LeaderboardCardProps {
  leagueId: string;
  members: LeagueMember[];
  currentUserId: string | null;
}

type ScoreData = {
  user_id: string;
  points: number;
  predix_settled_points: number | null;
  settlement_status: string | null;
  settlement_tx_hash: string | null;
};

function SettlementBadge({ status, txHash, explorerBase }: { status: string | null; txHash: string | null; explorerBase: string }) {
  if (!status) return null;

  const config: Record<string, { label: string; variant: "success" | "warning" | "error" | "info" | "default"; icon: React.ReactNode }> = {
    confirmed: { label: "Settled", variant: "success", icon: <CheckCircle2 className="h-2.5 w-2.5" /> },
    sent: { label: "Pending", variant: "warning", icon: <Clock className="h-2.5 w-2.5" /> },
    pending: { label: "Queued", variant: "info", icon: <Clock className="h-2.5 w-2.5" /> },
    failed: { label: "Failed", variant: "error", icon: <XCircle className="h-2.5 w-2.5" /> },
  };

  const cfg = config[status] || { label: status, variant: "default" as const, icon: null };

  if (txHash && explorerBase) {
    return (
      <a
        href={`${explorerBase}/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex"
      >
        <Badge variant={cfg.variant} size="sm" className="gap-0.5 cursor-pointer hover:brightness-110">
          {cfg.icon}
          <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
        </Badge>
      </a>
    );
  }

  return (
    <Badge variant={cfg.variant} size="sm" className="gap-0.5">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

export function LeaderboardCard({ leagueId, members, currentUserId }: LeaderboardCardProps) {
  // Fetch scores for this league
  const { data: scoresData, isLoading: scoresLoading } = useQuery({
    queryKey: ["league-scores", leagueId],
    queryFn: async () => {
      const res = await fetch(`/api/leagues/simulated/leaderboard?leagueId=${encodeURIComponent(leagueId)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.scores || []) as ScoreData[];
    },
    staleTime: 30_000,
  });

  // Get Predix transparency data for current user's balance and chain info
  const { data: predixData } = usePredixTransparency(leagueId);
  
  const explorerBase = predixData?.chain?.explorerBaseUrl || "https://sepolia.basescan.org";
  const userBalance = predixData?.onchain?.balance?.formatted;

  // Create a map of userId to score data
  const scoreMap = new Map<string, ScoreData>();
  (scoresData || []).forEach((s) => scoreMap.set(s.user_id, s));

  // Sort members by score (descending)
  const sortedMembers = [...members].sort((a, b) => {
    const scoreA = scoreMap.get(a.userId)?.points ?? 0;
    const scoreB = scoreMap.get(b.userId)?.points ?? 0;
    return scoreB - scoreA;
  });

  if (members.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-base font-semibold text-foreground">Leaderboard</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            No members yet. Be the first to join!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Leaderboard</h3>
          {currentUserId && userBalance && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              <span className="font-medium">{parseFloat(userBalance).toFixed(2)} PREDIX</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {scoresLoading ? (
          <>
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </>
        ) : (
          sortedMembers.map((member, idx) => {
            const isCurrentUser = member.userId === currentUserId;
            const scoreData = scoreMap.get(member.userId);
            const points = scoreData?.points ?? 0;
            const settlementStatus = scoreData?.settlement_status;
            const txHash = scoreData?.settlement_tx_hash;

            return (
              <div
                key={`${member.userId}-${idx}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 transition-colors",
                  isCurrentUser ? "bg-primary/10 border border-primary/30" : "bg-accent/30"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold",
                  idx === 0 ? "bg-warning/20 text-warning" :
                  idx === 1 ? "bg-muted-foreground/20 text-muted-foreground" :
                  idx === 2 ? "bg-warning/10 text-warning/70" :
                  "bg-accent text-muted-foreground"
                )}>
                  {idx + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-semibold text-sm truncate",
                      isCurrentUser ? "text-primary" : "text-foreground"
                    )}>
                      {member.teamName || "Team TBD"}
                      {isCurrentUser && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          (You)
                        </span>
                      )}
                    </p>
                    <SettlementBadge status={settlementStatus || null} txHash={txHash || null} explorerBase={explorerBase} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "—"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-foreground">{points.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground">pts</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

