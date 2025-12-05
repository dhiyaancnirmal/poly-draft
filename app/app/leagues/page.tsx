"use client";
 
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeagueCard } from "@/components/features";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Trophy } from "lucide-react";
import { useLeagues } from "@/lib/hooks";
import { useAuth } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createLeague, joinLeague } from "@/app/actions/leagues";
import { startDraft } from "@/app/actions/draft";

export default function LeaguesPage() {
  const { user } = useAuth();
  const { leagues, loading: isLoading, joinLeague } = useLeagues();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "full">("all");
  const router = useRouter();

  const counts = {
    all: leagues.length,
    active: leagues.filter((l) => l.status !== "ended" && l.status !== "cancelled" && (l.league_members?.length || 0) < l.max_players).length,
    full: leagues.filter((l) => (l.league_members?.length || 0) >= l.max_players).length,
  };

  const filteredLeagues = leagues.filter(league => {
    const matchesSearch = league.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || league.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleJoinLeague = async (leagueId: string) => {
    if (!user) {
      alert('Please sign in to join a league');
      return;
    }

    try {
      await joinLeague(leagueId);
      alert('Successfully joined league!');
    } catch (error) {
      console.error('Error joining league:', error);
      alert('Failed to join league. Please try again.');
    }
  };

  const handleStartDraft = async (leagueId: string) => {
    if (!user) {
      alert('Please sign in to start a draft');
      return;
    }

    if (!confirm('Start the draft? This will lock the league and assign random draft order to all members.')) {
      return;
    }

    try {
      await startDraft(leagueId);
      alert('Draft started!');
      router.push(`/app/draft/${leagueId}`);
    } catch (error: any) {
      console.error('Error starting draft:', error);
      alert(error.message || 'Failed to start draft. Please try again.');
    }
  };

  return (
    <AppLayout title="Leagues">
      <div className="p-4 space-y-6 pb-20">
        <div className="space-y-1 px-1">
          <p className="text-sm text-muted">Find and join leagues to start drafting.</p>
        </div>
        {/* Search and Filters */}
        <div className="space-y-3">
          <Input
            placeholder="Search leagues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === "all" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              All ({counts.all})
            </Button>
            <Button
              variant={filterStatus === "active" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("active")}
            >
              Active ({counts.active})
            </Button>
            <Button
              variant={filterStatus === "full" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("full")}
            >
              Full ({counts.full})
            </Button>
          </div>
        </div>

        {/* Create League Button */}
        <div className="pt-1">
          <Link href="/app/create" className="w-full block">
            <Button size="lg" className="w-full">
              <Trophy className="w-4 h-4 mr-2" />
              Create New League
            </Button>
          </Link>
        </div>

        {/* Leagues List */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              <LeagueCard loading />
              <LeagueCard loading />
              <LeagueCard loading />
              <LeagueCard loading />
            </>
          ) : filteredLeagues.length > 0 ? (
            filteredLeagues.map((league) => {
              // Map database status to component status
              const getDisplayStatus = (): 'active' | 'full' | 'completed' => {
                if (league.status === 'ended' || league.status === 'cancelled') return 'completed';
                const isFull = (league.league_members?.length || 0) >= league.max_players;
                if (isFull) return 'full';
                return 'active';
              };

              const displayStatus = getDisplayStatus();
              const modeLabel = league.mode === 'live' ? 'Polymarket routing' : league.mode === 'competitive' ? 'Competitive' : 'Simulated picks';

              return (
                <div
                  key={league.id}
                  onClick={(e) => {
                    // Don't navigate if clicking on a button
                    if ((e.target as HTMLElement).closest('button, a')) {
                      return;
                    }
                    // Navigate to draft page
                    router.push(`/app/draft/${league.id}`);
                  }}
                  className="cursor-pointer"
                >
                  <LeagueCard
                    league={{
                      id: league.id,
                      name: league.name,
                      members: league.league_members?.length || 0,
                      maxMembers: league.max_players,
                      prizePool: modeLabel,
                      status: displayStatus,
                      entryFee: modeLabel === 'Polymarket routing' ? 'On-chain' : 'Free'
                    }}
                    action={
                    <>
                      {league.status === 'drafting' && (
                        <Link href={`/app/draft/${league.id}`}>
                          <Button size="sm" variant="primary">
                            View Draft
                          </Button>
                        </Link>
                      )}
                      {league.status === 'open' && user?.id === league.creator_id && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleStartDraft(league.id)}
                        >
                          Start Draft
                        </Button>
                      )}
                      {user && !league.league_members?.some((m) => m.user_id === user.id) ? (
                        <Button
                          size="sm"
                          onClick={() => handleJoinLeague(league.id)}
                          disabled={displayStatus === 'full' || displayStatus === 'completed'}
                        >
                          {displayStatus === 'full' ? 'Full' : displayStatus === 'completed' ? 'Ended' : 'Join'}
                        </Button>
                      ) : null}
                    </>
                  }
                />
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-muted">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No leagues found matching your criteria.' 
                  : 'No leagues found. Create one to get started!'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}