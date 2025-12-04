"use client";

import { useState } from "react";
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
        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create League
          </Button>
          <Button variant="outline" size="lg" className="w-full">
            <Trophy className="w-4 h-4 mr-2" />
            Browse Leagues
          </Button>
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