"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeagueCard, MarketCard } from "@/components/features";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Trophy, User } from "lucide-react";
import { useLeagues } from "@/lib/hooks";
import { useTheme } from "@/lib/hooks/useTheme";
import { useMiniAppContext } from "@/hooks/useMiniAppContext";
 
export default function HomePage() {
  const { leagues, loading: isLoadingLeagues, createLeague, joinLeague } = useLeagues();
  const { resolvedTheme } = useTheme();
  const [isLoadingMarkets] = useState(true); // Keep this for now until Polymarket integration
  const { user: miniUser, isInMiniApp, loading: miniLoading } = useMiniAppContext();

  const avatarInitial = (miniUser?.displayName || miniUser?.username || "U")[0]?.toUpperCase();

  return (
    <AppLayout
      title={
        <div className="flex items-center gap-2">
          <Image
            src={resolvedTheme === "light" ? "/polydraft-dark.svg" : "/polydraft.svg"}
            alt="PolyDraft logo"
            width={41}
            height={41}
            className="h-[41px] w-auto"
            priority
          />
          <span>PolyDraft</span>
        </div>
      }
      rightAction={
        <Link
          href="/app/profile"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface/80 text-muted shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 overflow-hidden"
        >
          {miniUser?.pfpUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={miniUser.pfpUrl}
              alt={miniUser.displayName || miniUser.username || "User avatar"}
              className="h-10 w-10 object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-semibold">
              {miniLoading ? <User className="h-5 w-5" /> : avatarInitial}
            </span>
          )}
        </Link>
      }
    >
      <div className="p-4 space-y-7">
        {!miniLoading && !isInMiniApp && (
          <div className="p-3 rounded-xl border border-border/60 bg-surface-highlight/40 text-sm text-muted">
            Open in the Base or Farcaster client to load your profile and avatar.
          </div>
        )}
        {/* Quick Actions */}
        <div className="flex flex-col gap-4">
          <Link href="/app/create" className="w-full">
            <Button size="lg" className="w-full shadow-lg shadow-primary/25 py-3">
              <Plus className="w-5 h-5 mr-2" />
              Create League
            </Button>
          </Link>
          <Link href="/app/leagues" className="w-full">
            <Button
            variant="outline"
              size="lg"
            className="w-full border border-border/80 bg-surface/70 text-foreground shadow-card py-3"
            >
              <Trophy className="w-5 h-5 mr-2 text-primary" />
              Browse Leagues
            </Button>
          </Link>
        </div>

        {/* Active Leagues */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Active Leagues</h2>
            <Badge variant={isLoadingLeagues ? "info" : "default"}>
              {isLoadingLeagues ? "Loading..." : `${leagues.filter((l) => l.status !== 'ended' && l.status !== 'cancelled').length} live`}
            </Badge>
          </div>

          <div className="space-y-3">
            {isLoadingLeagues ? (
              <>
                <LeagueCard loading />
                <LeagueCard loading />
                <LeagueCard loading />
              </>
            ) : leagues.length > 0 ? (
              leagues.map((league) => {
                // Map database status to component status
                const getDisplayStatus = (): 'active' | 'full' | 'completed' => {
                  if (league.status === 'ended' || league.status === 'cancelled') return 'completed';
                  const isFull = (league.league_members?.length || 0) >= league.max_players;
                  if (isFull) return 'full';
                  return 'active';
                };
                const modeLabel = league.mode === 'live' ? 'Polymarket routing' : league.mode === 'competitive' ? 'Competitive' : 'Simulated picks';

                return (
                  <LeagueCard
                    key={league.id}
                    league={{
                      id: league.id,
                      name: league.name,
                      members: league.league_members?.length || 0,
                      maxMembers: league.max_players,
                      prizePool: modeLabel,
                      status: getDisplayStatus(),
                      entryFee: modeLabel === 'Polymarket routing' ? 'On-chain' : 'Free'
                    }}
                  />
                );
              })
            ) : (
              <p className="text-center text-muted py-8">
                No active leagues found. Create one to get started!
              </p>
            )}
          </div>
        </section>

        {/* Trending Markets */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Trending Markets</h2>
            <Badge variant="success">Live</Badge>
          </div>

          <div className="space-y-3">
            {isLoadingMarkets ? (
              <>
                <MarketCard loading />
                <MarketCard loading />
              </>
            ) : (
              <p className="text-center text-muted py-8">
                Markets will appear here once connected
              </p>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}