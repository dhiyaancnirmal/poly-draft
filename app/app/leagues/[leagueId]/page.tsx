import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/database-types";
import { LeagueDetailTabs } from "./LeagueDetailTabs";

type Props = {
  params: { leagueId: string };
};

export default async function LeagueDashboardPage({ params }: Props) {
  const leagueId = params.leagueId;

  // Demo league shortcut for UI testing
  if (leagueId === "demo-league-123") {
    const demoMembers = [
      { teamName: "Alpha Squad", userId: "user-1", joinedAt: new Date().toISOString() },
      { teamName: "Beta Bulls", userId: "user-2", joinedAt: new Date().toISOString() },
      { teamName: "Gamma Grit", userId: "user-3", joinedAt: new Date().toISOString() },
      { teamName: "You", userId: "demo-user", joinedAt: new Date().toISOString() },
    ];

    const leagueData = {
      id: leagueId,
      name: "Demo League",
      status: "active",
      joinCode: "DEMO1234",
      startDate: new Date().toISOString(),
      endDate: null,
      type: "weekly",
      durationPeriods: 6,
      picksPerPeriod: 3,
      maxPlayers: 8,
      members: demoMembers,
    };

    return (
      <AppLayout title={leagueData.name} showInvitesBadge={false}>
        <LeagueDetailTabs
          league={leagueData}
          currentUserId={"demo-user"}
          userTeamName={"You"}
        />
      </AppLayout>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: league, error } = await supabase
    .from("leagues")
    .select(
      `
        id,
        name,
        status,
        join_code,
        start_date,
        end_date,
        type,
        duration_periods,
        picks_per_period,
        max_players,
        league_members(team_name,user_id,joined_at)
      `
    )
    .or(`id.eq.${leagueId},join_code.eq.${leagueId}`)
    .maybeSingle();

  if (error || !league) {
    return (
      <AppLayout title="League">
        <div className="p-4">
          <Card>
            <CardContent className="space-y-3 py-6">
              <p className="text-lg font-semibold text-foreground">Unable to load league</p>
              <p className="text-sm text-muted-foreground">
                {error?.message || "This league could not be found or you may not have access."}
              </p>
              <Link
                href="/app/leagues"
                className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition"
              >
                Back to Leagues
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  type Member = { team_name: string | null; user_id: string; joined_at: string | null };
  type LeagueWithMembers = Database["public"]["Tables"]["leagues"]["Row"] & { league_members: Member[] };

  const typed = league as unknown as LeagueWithMembers;
  const membership = typed.league_members?.find((m) => m.user_id === user?.id) || null;

  // Serialize for client component
  const leagueData = {
    id: typed.id,
    name: typed.name,
    status: typed.status,
    joinCode: typed.join_code,
    startDate: typed.start_date,
    endDate: typed.end_date,
    type: typed.type,
    durationPeriods: typed.duration_periods,
    picksPerPeriod: typed.picks_per_period,
    maxPlayers: typed.max_players,
    members: typed.league_members?.map((m) => ({
      teamName: m.team_name,
      odisplayName: m.team_name,
      userId: m.user_id,
      joinedAt: m.joined_at,
    })) || [],
  };

  const currentUserId = user?.id || null;
  const userTeamName = membership?.team_name || null;
  const userWalletAddress = (user?.user_metadata as any)?.wallet_address || 
    (user?.user_metadata as any)?.wallet || 
    null;

  return (
    <AppLayout title={typed.name} showInvitesBadge={false}>
      <LeagueDetailTabs 
        league={leagueData} 
        currentUserId={currentUserId}
        userTeamName={userTeamName}
        userWalletAddress={userWalletAddress}
      />
    </AppLayout>
  );
}
