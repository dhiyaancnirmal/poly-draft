"use client";

import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeagueCard } from "@/components/features";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Link2, Trophy, Users } from "lucide-react";
import { useLeagues } from "@/lib/hooks";
import { useAuth } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LeaguesPage() {
  const { user } = useAuth();
  const { leagues, joinLeague: joinLeagueMutation } = useLeagues();
  const [inviteLink, setInviteLink] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
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

  const mockMyLeagueCard = {
    id: "mock-league-preview",
    name: "Signals Syndicate (Mock)",
    members: 8,
    maxMembers: 12,
    prizePool: "Invite-only",
    status: "active" as const,
    entryFee: "Free",
  };

  const myLeagueCards = useMemo(
    () => {
      const source = myLeagues.length ? myLeagues : [mockMyLeagueCard];
      return source.map((league) => {
        const isSupabaseLeague = "league_members" in league;
        const members = isSupabaseLeague ? (league as any).league_members?.length || 0 : (league as any).members;
        const maxMembers = isSupabaseLeague ? (league as any).max_players : (league as any).maxMembers;
        return {
          id: (league as any).id,
          name: (league as any).name,
          members,
          maxMembers,
          isMock: (league as any).id === mockMyLeagueCard.id,
        };
      });
    },
    [myLeagues, mockMyLeagueCard.id]
  );

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

  const handleJoinLeague = async (leagueId: string) => {
    setJoinError("");
    await performJoin(leagueId);
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
    }
  };

  return (
    <AppLayout title="Leagues">
      <div className="p-4 space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <Link href="/app/leagues/create" className="w-full">
            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground border border-primary/30 shadow-[0_18px_50px_-18px_rgba(240,100,100,0.55)] hover:shadow-[0_22px_60px_-18px_rgba(240,100,100,0.65)] hover:-translate-y-0.5 transition-all"
            >
              <Trophy className="w-4 h-4 text-primary-foreground dark:text-white" />
              <span className="font-semibold text-primary-foreground dark:text-white">Create New League</span>
            </Button>
          </Link>
          <Button
            size="lg"
            className="w-full bg-primary/90 text-primary-foreground border border-primary/30 shadow-[0_16px_45px_-20px_rgba(240,100,100,0.5)] hover:shadow-[0_20px_55px_-18px_rgba(240,100,100,0.6)] hover:-translate-y-0.5 transition-all"
            onClick={() => {
              setShowJoinForm(true);
            }}
          >
            <Link2 className="w-4 h-4 text-primary-foreground dark:text-white" />
            <span className="font-semibold text-primary-foreground dark:text-white">Join Existing League</span>
          </Button>
        </div>

        {showJoinForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="w-full max-w-xl">
              <Card className="p-6 space-y-6 bg-surface/95 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.6)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Private only</p>
                    <h2 className="text-2xl font-bold text-text">Join Existing League</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowJoinForm(false);
                      setInviteLink("");
                      setJoinError("");
                    }}
                  >
                    Close
                  </Button>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Invite link or code"
                    placeholder="Paste invite link or league code"
                    value={inviteLink}
                    onChange={(e) => {
                      setInviteLink(e.target.value);
                      setJoinError("");
                    }}
                  />
                  {joinError ? <p className="text-sm text-error">{joinError}</p> : null}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      className="w-full bg-primary text-primary-foreground border border-primary/30 shadow-[0_18px_50px_-18px_rgba(240,100,100,0.55)] hover:shadow-[0_22px_60px_-18px_rgba(240,100,100,0.65)] hover:-translate-y-0.5 transition-all"
                      loading={joinLoading}
                      onClick={handleJoinByLink}
                    >
                      Join League
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setShowJoinForm(false);
                        setInviteLink("");
                        setJoinError("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-text">My Leagues</h3>
            </div>
          </div>
          <div className="grid gap-3">
            {myLeagueCards.map((league) => (
              <div
                key={league.id}
                className="cursor-pointer"
                onClick={() => {
                  if (!league.isMock) {
                    router.push(`/app/draft/${league.id}`);
                  }
                }}
              >
                <LeagueCard
                  league={{
                    id: league.id,
                    name: league.name,
                    members: league.members,
                    maxMembers: league.maxMembers || 12,
                    prizePool: "Invite-only",
                    status: "active",
                    entryFee: "Free",
                  }}
                  action={
                    league.isMock ? (
                      <Badge variant="outline">Mock preview</Badge>
                    ) : (
                      <Button size="sm" variant="primary">
                        Open League
                      </Button>
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}