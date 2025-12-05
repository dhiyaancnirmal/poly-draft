"use client";

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeagueCard } from "@/components/features";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Link2, Trophy, Plus, X } from "lucide-react";
import { useLeagues } from "@/lib/hooks";
import { useAuth } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { CreateLeagueForm } from "./create/CreateLeagueForm";
import { createClient } from "@/lib/supabase/client";

export default function LeaguesPage() {
  const { user } = useAuth();
  const { leagues, joinLeague: joinLeagueMutation } = useLeagues();
  const [inviteLink, setInviteLink] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [picksByLeague, setPicksByLeague] = useState<Record<string, any[]>>({});
  const [loadingPicks, setLoadingPicks] = useState(false);
  const router = useRouter();

  const myLeagues = useMemo(
    () =>
      leagues.filter(
        (league) =>
          (league as any).created_by === user?.id ||
          (league as any).creator_id === user?.id ||
          league.league_members?.some((member) => member.user_id === user?.id)
      ),
    [leagues, user?.id]
  );

  const myLeagueCards = useMemo(
    () => {
      return myLeagues.map((league) => {
        const isSupabaseLeague = "league_members" in league;
        const members = isSupabaseLeague ? (league as any).league_members?.length || 0 : 0;
        const maxMembers = isSupabaseLeague ? (league as any).max_players : 12;
        return {
          id: (league as any).id,
          name: (league as any).name,
          members,
          maxMembers,
          status: (league as any).status || "active",
        };
      });
    },
    [myLeagues]
  );

  useEffect(() => {
    const fetchPicks = async () => {
      if (!user?.id || !myLeagues.length) return;

      const supabase = createClient();
      const leagueIds = myLeagues.map((league: any) => league.id).filter(Boolean);

      setLoadingPicks(true);
      const { data, error } = await supabase
        .from("picks")
        .select("id, league_id, market_id_text, outcome_side, created_at, pick_number")
        .in("league_id", leagueIds as any)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching picks:", error);
        setLoadingPicks(false);
        return;
      }

      const grouped = (data || []).reduce((acc: Record<string, any[]>, pick: any) => {
        const key = pick.league_id;
        acc[key] = acc[key] || [];
        acc[key].push(pick);
        return acc;
      }, {});

      setPicksByLeague(grouped);
      setLoadingPicks(false);
    };

    fetchPicks();
  }, [user?.id, myLeagues]);

  const parseLeagueIdFromInvite = (value: string) => {
    if (!value) return "";
    try {
      const maybeUrl = new URL(value);
      const segments = maybeUrl.pathname.split("/").filter(Boolean);
      return segments[segments.length - 1] || "";
    } catch {
      return value.trim();
    }
  };

  const performJoin = async (leagueId: string) => {
    if (!user) {
      alert('Please sign in to join a league');
      return false;
    }

    if (!leagueId) {
      setJoinError("Paste a valid invite link or league code.");
      return false;
    }

    try {
      await joinLeagueMutation(leagueId);
      alert('Successfully joined league!');
      setJoinError("");
      return true;
    } catch (error: any) {
      console.error('Error joining league:', error);
      const message = error?.message || 'Failed to join league. Please try again.';
      setJoinError(message);
      alert(message);
      return false;
    }
  };

  const handleJoinByLink = async () => {
    setJoinError("");
    const leagueId = parseLeagueIdFromInvite(inviteLink);
    if (!leagueId) {
      setJoinError("Paste a valid invite link or code.");
      return;
    }

    setJoinLoading(true);
    const success = await performJoin(leagueId);
    setJoinLoading(false);

    if (success) {
      setInviteLink("");
      setShowJoinForm(false);
    }
  };

  return (
    <AppLayout title="Leagues">
      <div className="p-4 space-y-5">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => setShowCreateSheet(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create League
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => setShowJoinForm(true)}
          >
            <Link2 className="w-4 h-4 mr-2" />
            Join League
          </Button>
        </div>

        {/* Leagues List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">My Leagues</h2>
            {myLeagueCards.length > 0 && (
              <Badge variant="secondary" size="sm">
                {myLeagueCards.length}
              </Badge>
            )}
          </div>

          {myLeagueCards.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-semibold text-foreground mb-2">
                  No Leagues Yet
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new league or join one with an invite code
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myLeagueCards.map((league) => {
                const leaguePicks = picksByLeague[league.id] || [];

                return (
                  <div key={league.id} className="space-y-2">
                    <LeagueCard
                      league={{
                        id: league.id,
                        name: league.name,
                        members: league.members,
                        maxMembers: league.maxMembers || 12,
                        status: league.status,
                      }}
                      onClick={() => router.push(`/app/leagues/${league.id}`)}
                      onOpen={() => router.push(`/app/leagues/${league.id}`)}
                      showInfoToggle
                    />

                    {/* Picks preview carousel */}
                    {leaguePicks.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 pl-12">
                        {leaguePicks.slice(0, 3).map((pick, idx) => (
                          <div
                            key={pick.id || `${league.id}-pick-${idx}`}
                            className="snap-start min-w-[200px] rounded-xl border border-border/50 bg-accent/30 px-3 py-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Pick #{pick.pick_number || idx + 1}
                              </span>
                              <Badge 
                                variant={pick.outcome_side === "YES" ? "success" : "error"} 
                                size="sm"
                              >
                                {pick.outcome_side || "YES"}
                              </Badge>
                            </div>
                            <p className="text-xs font-medium text-foreground mt-1 truncate">
                              {pick.market_id_text || "Market pending"}
                            </p>
                          </div>
                        ))}
                        {leaguePicks.length > 3 && (
                          <div className="snap-start min-w-[80px] rounded-xl border border-border/50 bg-accent/30 px-3 py-2 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                              +{leaguePicks.length - 3} more
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Join League Modal */}
        {showJoinForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <Card className="w-full max-w-md animate-scale-in">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Join League</h2>
                  <p className="text-xs text-muted-foreground">Enter an invite code or link</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowJoinForm(false);
                    setInviteLink("");
                    setJoinError("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Paste invite link or code"
                  value={inviteLink}
                  onChange={(e) => {
                    setInviteLink(e.target.value);
                    setJoinError("");
                  }}
                  error={joinError || undefined}
                />
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1"
                    loading={joinLoading}
                    onClick={handleJoinByLink}
                  >
                    Join League
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setShowJoinForm(false);
                      setInviteLink("");
                      setJoinError("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create League Sheet */}
        {showCreateSheet && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateSheet(false)}
          >
            <div
              className="w-full max-w-lg transform rounded-t-3xl bg-card shadow-2xl animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-4">
                <h2 className="text-lg font-bold text-foreground">Create League</h2>
              </div>
              <div className="max-h-[75vh] overflow-y-auto px-4 py-4 pb-24">
                <CreateLeagueForm />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
