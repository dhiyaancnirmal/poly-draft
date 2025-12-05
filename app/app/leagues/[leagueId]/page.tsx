import { notFound } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import { TeamNameForm } from "./TeamNameForm";
import { Database } from "@/lib/supabase/database-types";

type Props = {
  params: { leagueId: string };
};

const statusMeta: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-green-500/80" },
  drafting: { label: "Drafting", color: "bg-primary" },
  active: { label: "Live", color: "bg-primary" },
  ended: { label: "Ended", color: "bg-muted" },
  cancelled: { label: "Cancelled", color: "bg-muted" },
};

export default async function LeagueDashboardPage({ params }: Props) {
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
        league_members(team_name,user_id,joined_at)
      `
    )
    .eq("id", params.leagueId)
    .single();

  if (error || !league) return notFound();

  type Member = { team_name: string | null; user_id: string; joined_at: string | null };
  type LeagueWithMembers = Database["public"]["Tables"]["leagues"]["Row"] & { league_members: Member[] };

  const typed = league as unknown as LeagueWithMembers;

  const membership = typed.league_members?.find((m) => m.user_id === user?.id) || null;
  const standings = typed.league_members || [];
  const meta = statusMeta[typed.status] || { label: typed.status || "Open", color: "bg-primary" };

  return (
    <AppLayout title="League">
      <div className="p-4 space-y-5">
        <Card className="border border-border/60 bg-surface/70">
          <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
                  <Badge variant="outline" className="border-transparent bg-primary/10 text-primary text-xs">
                    {meta.label}
                  </Badge>
                </div>
                <Badge variant="info" className="text-xs">
                  Code: {typed.join_code}
                </Badge>
              </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted">League</p>
                <h1 className="text-2xl font-bold text-foreground">{typed.name}</h1>
                <p className="text-xs text-muted">
                  {typed.type === "daily" ? "Daily" : "Weekly"} • {typed.duration_periods} periods • {typed.picks_per_period} picks/period
                </p>
              </div>
                <div className="flex gap-2">
                  <Link
                    href={`/app/draft/${typed.id}`}
                    className="inline-flex items-center rounded-lg border border-border/80 px-3 py-1.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    Edit picks / Draft
                  </Link>
                  <span className="inline-flex items-center rounded-lg border border-border/60 px-3 py-1.5 text-sm text-muted">⋯</span>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {membership?.team_name ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Your team</p>
                  <p className="text-lg font-semibold text-foreground">{membership.team_name}</p>
                </div>
                <Link
                  href={`/app/draft/${typed.id}`}
                  className="inline-flex items-center rounded-lg border border-border/80 px-3 py-1.5 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  Manage team
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Create your team for this league</p>
                <TeamNameForm leagueId={typed.id} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-surface/70">
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Standings</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {standings.length === 0 ? (
              <p className="text-sm text-muted">No members yet.</p>
            ) : (
              <div className="space-y-2">
                {standings.map((m: any, idx) => (
                  <div key={`${m.user_id}-${idx}`} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{m.team_name || "Team TBD"}</p>
                      <p className="text-xs text-muted">User: {m.user_id.slice(0, 6)}…</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Joined {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : ""}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-surface/70">
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">League Info</h3>
          </CardHeader>
          <CardContent className="text-sm text-foreground space-y-2">
            <p>Start: {typed.start_date}</p>
            <p>End: {typed.end_date}</p>
            <p>Join code: {typed.join_code}</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

