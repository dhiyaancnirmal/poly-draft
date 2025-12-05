"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from "@/components/ui/Tabs";
import { MatchupCard } from "@/components/features/MatchupCard";
import { TeamNameForm } from "./TeamNameForm";
import { PredixPanel } from "./PredixPanel";
import { AdminJobsPanel } from "./AdminJobsPanel";
import { LeaderboardCard } from "./LeaderboardCard";
import { cn } from "@/lib/utils";
import { 
  Trophy, 
  Users, 
  Copy, 
  Check, 
  Calendar, 
  Swords,
  Medal,
  ScrollText,
  Lock,
} from "lucide-react";

interface LeagueMember {
  teamName: string | null;
  userId: string;
  joinedAt: string | null;
}

interface LeagueData {
  id: string;
  name: string;
  status: string | null;
  joinCode: string | null;
  startDate: string | null;
  endDate: string | null;
  type: string | null;
  durationPeriods: number | null;
  picksPerPeriod: number | null;
  maxPlayers: number | null;
  members: LeagueMember[];
}

interface LeagueDetailTabsProps {
  league: LeagueData;
  currentUserId: string | null;
  userTeamName: string | null;
  userWalletAddress?: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  open: { label: "Open", variant: "success" },
  pending: { label: "Pending", variant: "info" },
  drafting: { label: "Drafting", variant: "info" },
  active: { label: "Live", variant: "info" },
  live: { label: "Live", variant: "info" },
  finalizing: { label: "Finalizing", variant: "warning" },
  finalized: { label: "Finalized", variant: "default" },
  ended: { label: "Ended", variant: "default" },
  cancelled: { label: "Cancelled", variant: "default" },
};

export function LeagueDetailTabs({ league, currentUserId, userTeamName, userWalletAddress }: LeagueDetailTabsProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("matchup");

  const status = statusConfig[league.status || "open"] || statusConfig.open;
  const memberCount = league.members.length;
  const maxPlayers = league.maxPlayers || 12;
  
  // Check if league is in a state that prevents picks/swaps
  const isSettling = league.status === "finalizing" || league.status === "finalized";

  const handleCopyCode = async () => {
    if (league.joinCode) {
      await navigator.clipboard.writeText(league.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Mock matchup data - in real app, this would come from the server
  const userTeam = {
    id: currentUserId || "user",
    name: userTeamName || "Your Team",
    score: 45.5,
    record: { wins: 3, losses: 2 },
    isUser: true,
  };

  const opponentTeam = {
    id: "opponent",
    name: league.members.find(m => m.userId !== currentUserId)?.teamName || "Opponent",
    score: 38.2,
    record: { wins: 2, losses: 3 },
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky League Card Header - positioned below AppLayout header (h-14) */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 py-3 space-y-3">
          {/* League Info */}
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Trophy className="h-6 w-6" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-foreground truncate">
                  {league.name}
                </h1>
                <Badge variant={status.variant} size="sm">
                  {status.label}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {memberCount}/{maxPlayers}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {league.type === "daily" ? "Daily" : "Weekly"}
                </span>
                <span>{league.durationPeriods} periods</span>
              </div>
            </div>

            {/* Join Code */}
            <button
              onClick={handleCopyCode}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                "bg-accent/50 border border-border/50 text-muted-foreground",
                "hover:bg-accent hover:text-foreground"
              )}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {league.joinCode}
            </button>
          </div>

          {/* Team Setup CTA if no team */}
          {!userTeamName && currentUserId && (
            <Card variant="outline" className="border-primary/30 bg-primary/5">
              <CardContent className="p-3">
                <p className="text-sm font-medium text-foreground mb-2">
                  Create your team to start playing
                </p>
                <TeamNameForm leagueId={league.id} />
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsListUnderline className="w-full">
              <TabsTriggerUnderline value="matchup" className="flex-1 gap-1.5">
                <Swords className="h-4 w-4" />
                Matchup
              </TabsTriggerUnderline>
              <TabsTriggerUnderline value="standings" className="flex-1 gap-1.5">
                <Medal className="h-4 w-4" />
                Standings
              </TabsTriggerUnderline>
              <TabsTriggerUnderline value="rules" className="flex-1 gap-1.5">
                <ScrollText className="h-4 w-4" />
                Rules
              </TabsTriggerUnderline>
            </TabsListUnderline>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Matchup Tab */}
          <TabsContent value="matchup" className="mt-0 space-y-4">
            {userTeamName ? (
              <>
                <MatchupCard
                  team1={userTeam}
                  team2={opponentTeam}
                  period={`Period ${1}`}
                  isLive={league.status === "active" || league.status === "live"}
                />
                
                {isSettling ? (
                  <div className="flex items-center gap-3 rounded-xl bg-warning/10 border border-warning/30 p-4">
                    <Lock className="h-5 w-5 text-warning flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {league.status === "finalizing" ? "League is finalizing..." : "League has ended"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Picks and swaps are locked during settlement
                      </p>
                    </div>
                  </div>
                ) : (
                  <Link href={`/app/draft/${league.id}`}>
                    <Button variant="primary" size="lg" className="w-full">
                      <Swords className="h-4 w-4 mr-2" />
                      Edit Picks / Draft
                    </Button>
                  </Link>
                )}

                {/* Predix Settlement Panel */}
                <PredixPanel leagueId={league.id} userWalletAddress={userWalletAddress} />

                {/* Admin Job Controls */}
                <AdminJobsPanel leagueId={league.id} userWalletAddress={userWalletAddress} />
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-semibold text-foreground mb-2">
                    No Active Matchup
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Create your team above to see your matchup
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings" className="mt-0 space-y-4">
            <LeaderboardCard 
              leagueId={league.id} 
              members={league.members} 
              currentUserId={currentUserId} 
            />

            {/* Season Schedule */}
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-base font-semibold text-foreground">Season Schedule</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Schedule will appear once the league starts
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="mt-0 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-base font-semibold text-foreground">League Settings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-accent/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">League Type</p>
                    <p className="font-semibold text-foreground capitalize">
                      {league.type || "Daily"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-accent/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                    <p className="font-semibold text-foreground">
                      {league.durationPeriods} {league.type === "daily" ? "Days" : "Weeks"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-accent/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Picks per Period</p>
                    <p className="font-semibold text-foreground">
                      {league.picksPerPeriod}
                    </p>
                  </div>
                  <div className="rounded-xl bg-accent/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Max Players</p>
                    <p className="font-semibold text-foreground">
                      {league.maxPlayers || 12}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Start Date</span>
                    <span className="text-sm font-medium text-foreground">
                      {league.startDate ? new Date(league.startDate).toLocaleDateString() : "TBD"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">End Date</span>
                    <span className="text-sm font-medium text-foreground">
                      {league.endDate ? new Date(league.endDate).toLocaleDateString() : "TBD"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Join Code</span>
                    <span className="text-sm font-mono font-medium text-foreground">
                      {league.joinCode}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">League ID</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {league.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-base font-semibold text-foreground">Scoring Rules</h3>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Picks are scored based on market resolution</p>
                <p>• Correct YES/NO predictions earn points equal to the odds</p>
                <p>• Higher risk picks = higher potential reward</p>
                <p>• Ties are broken by total pick accuracy percentage</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

