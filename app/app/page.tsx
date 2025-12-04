"use client";

import { useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeagueCard, MarketCard } from "@/components/features";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Trophy } from "lucide-react";

// NOTE: Showing skeleton loaders indefinitely since no real data/API is connected yet
// In production, this would fetch actual data from your backend
export default function HomePage() {
  const [isLoadingLeagues] = useState(true);
  const [isLoadingMarkets] = useState(true);

  return (
    <AppLayout title="PolyDraft">
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/app/create" className="w-full">
            <Button size="lg" className="w-full shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" />
              Create League
            </Button>
          </Link>
          <Link href="/app/leagues" className="w-full">
            <Button variant="secondary" size="lg" className="w-full bg-surface-highlight/30 border-surface-highlight/50">
              <Trophy className="w-5 h-5 mr-2 text-primary" />
              Browse Leagues
            </Button>
          </Link>
        </div>

        {/* Active Leagues */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Active Leagues</h2>
            <Badge variant="info">Loading...</Badge>
          </div>

          <div className="space-y-3">
            {isLoadingLeagues ? (
              <>
                <LeagueCard loading />
                <LeagueCard loading />
                <LeagueCard loading />
              </>
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