"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TeamData {
  id: string;
  name: string;
  avatar?: string;
  username?: string;
  score: number;
  record?: { wins: number; losses: number };
  isUser?: boolean;
}

interface Pick {
  id: string;
  marketQuestion: string;
  side: "YES" | "NO";
  price: number;
  status: "pending" | "won" | "lost";
}

interface MatchupCardProps {
  team1: TeamData;
  team2: TeamData;
  team1Picks?: Pick[];
  team2Picks?: Pick[];
  period?: string;
  isLive?: boolean;
  className?: string;
}

export function MatchupCard({
  team1,
  team2,
  team1Picks = [],
  team2Picks = [],
  period,
  isLive = false,
  className,
}: MatchupCardProps) {
  const team1Score = team1.score;
  const team2Score = team2.score;
  const totalScore = team1Score + team2Score;
  
  // Calculate win probability based on current scores
  const team1WinPct = totalScore > 0 
    ? Math.round((team1Score / totalScore) * 100) 
    : 50;
  const team2WinPct = 100 - team1WinPct;
  
  const team1Leading = team1Score > team2Score;
  const team2Leading = team2Score > team1Score;
  const isTied = team1Score === team2Score;

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          {isLive && (
            <Badge variant="success" size="sm">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              Live
            </Badge>
          )}
          {period && (
            <span className="text-xs text-muted-foreground font-medium">
              {period}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          Head-to-Head
        </span>
      </div>

      {/* Win Probability Bar */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
          <span className={cn(team1Leading && "text-primary font-semibold")}>
            {team1WinPct}%
          </span>
          <div className="flex-1" />
          <span className={cn(team2Leading && "text-primary font-semibold")}>
            {team2WinPct}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-accent overflow-hidden flex">
          <div 
            className={cn(
              "h-full transition-all duration-500",
              team1Leading ? "bg-primary" : "bg-muted-foreground/30"
            )}
            style={{ width: `${team1WinPct}%` }}
          />
          <div 
            className={cn(
              "h-full transition-all duration-500",
              team2Leading ? "bg-primary" : "bg-muted-foreground/30"
            )}
            style={{ width: `${team2WinPct}%` }}
          />
        </div>
      </div>

      {/* Teams */}
      <div className="p-4 pt-2">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          {/* Team 1 */}
          <div className="flex flex-col items-center text-center">
            <div className={cn(
              "h-14 w-14 rounded-xl flex items-center justify-center text-lg font-bold mb-2",
              team1.isUser ? "bg-primary/15 text-primary ring-2 ring-primary/30" : "bg-accent text-foreground"
            )}>
              {team1.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={team1.avatar} alt={team1.name} className="h-full w-full rounded-xl object-cover" />
              ) : (
                team1.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <h4 className="font-semibold text-sm text-foreground truncate max-w-full">
              {team1.name}
            </h4>
            {team1.username && (
              <span className="text-[10px] text-muted-foreground">@{team1.username}</span>
            )}
            {team1.record && (
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {team1.record.wins}-{team1.record.losses}
              </span>
            )}
          </div>

          {/* Scores */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-2xl font-bold tabular-nums",
                team1Leading ? "text-primary" : "text-foreground"
              )}>
                {team1Score.toFixed(1)}
              </span>
              <span className="text-muted-foreground text-lg">-</span>
              <span className={cn(
                "text-2xl font-bold tabular-nums",
                team2Leading ? "text-primary" : "text-foreground"
              )}>
                {team2Score.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {team1Leading && <TrendingUp className="h-3.5 w-3.5 text-success" />}
              {team2Leading && <TrendingDown className="h-3.5 w-3.5 text-error" />}
              {isTied && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
              <span className="text-[10px] text-muted-foreground font-medium">
                {team1Leading ? `+${(team1Score - team2Score).toFixed(1)}` : 
                 team2Leading ? `+${(team2Score - team1Score).toFixed(1)}` : 
                 "Tied"}
              </span>
            </div>
          </div>

          {/* Team 2 */}
          <div className="flex flex-col items-center text-center">
            <div className={cn(
              "h-14 w-14 rounded-xl flex items-center justify-center text-lg font-bold mb-2",
              team2.isUser ? "bg-primary/15 text-primary ring-2 ring-primary/30" : "bg-accent text-foreground"
            )}>
              {team2.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={team2.avatar} alt={team2.name} className="h-full w-full rounded-xl object-cover" />
              ) : (
                team2.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <h4 className="font-semibold text-sm text-foreground truncate max-w-full">
              {team2.name}
            </h4>
            {team2.username && (
              <span className="text-[10px] text-muted-foreground">@{team2.username}</span>
            )}
            {team2.record && (
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {team2.record.wins}-{team2.record.losses}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Picks Comparison (if provided) */}
      {(team1Picks.length > 0 || team2Picks.length > 0) && (
        <div className="border-t border-border/40">
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
            Picks
          </div>
          <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
            {team1Picks.map((pick, idx) => {
              const opponentPick = team2Picks[idx];
              return (
                <div key={pick.id} className="flex items-center gap-2 text-xs">
                  {/* Team 1 Pick */}
                  <div className={cn(
                    "flex-1 flex items-center gap-2 rounded-lg p-2",
                    pick.status === "won" ? "bg-success/10" : 
                    pick.status === "lost" ? "bg-error/10" : "bg-accent/50"
                  )}>
                    <Badge 
                      variant={pick.side === "YES" ? "success" : "error"} 
                      size="sm"
                    >
                      {pick.side}
                    </Badge>
                    <span className="truncate text-muted-foreground">
                      {pick.marketQuestion.slice(0, 20)}...
                    </span>
                  </div>
                  
                  <span className="text-muted-foreground/50">vs</span>
                  
                  {/* Team 2 Pick */}
                  {opponentPick ? (
                    <div className={cn(
                      "flex-1 flex items-center gap-2 rounded-lg p-2 justify-end",
                      opponentPick.status === "won" ? "bg-success/10" : 
                      opponentPick.status === "lost" ? "bg-error/10" : "bg-accent/50"
                    )}>
                      <span className="truncate text-muted-foreground">
                        {opponentPick.marketQuestion.slice(0, 20)}...
                      </span>
                      <Badge 
                        variant={opponentPick.side === "YES" ? "success" : "error"} 
                        size="sm"
                      >
                        {opponentPick.side}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex-1 text-muted-foreground/50 text-center">—</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

