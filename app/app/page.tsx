"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeagueCard, MarketCard } from "@/components/features";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";


// Mock data - replace with real API calls
const mockLeagues = [
  {
    id: "1",
    name: "Week 12 Predictions",
    members: 4,
    maxMembers: 8,
    prizePool: "$800",
    status: "active" as const,
    entryFee: "$100"
  },
  {
    id: "2", 
    name: "Crypto Championship",
    members: 7,
    maxMembers: 8,
    prizePool: "$700",
    status: "active" as const,
    entryFee: "$100"
  },
  {
    id: "3",
    name: "Market Masters",
    members: 8,
    maxMembers: 8,
    prizePool: "$800",
    status: "full" as const,
    entryFee: "$100"
  }
];

const mockMarkets = [
  {
    id: "1",
    question: "Will Bitcoin exceed $100k by end of year?",
    yesPrice: 0.65,
    noPrice: 0.35,
    volume: "$2.5M",
    endTime: "2d 14h"
  },
  {
    id: "2",
    question: "Will ETH 2.0 upgrade complete this quarter?",
    yesPrice: 0.78,
    noPrice: 0.22,
    volume: "$1.8M",
    endTime: "5d 8h"
  }
];

export default function HomePage() {
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(true);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(true);
  const [leagues] = useState(mockLeagues);
  const [markets] = useState(mockMarkets);

  // Simulate loading
  useEffect(() => {
    const timer1 = setTimeout(() => setIsLoadingLeagues(false), 1500);
    const timer2 = setTimeout(() => setIsLoadingMarkets(false), 2000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <AppLayout title="PolyDraft">
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" className="w-full">
            🏆 Create League
          </Button>
          <Button variant="outline" size="lg" className="w-full">
            📊 Join Draft
          </Button>
        </div>

        {/* Active Leagues */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Active Leagues</h2>
            <Badge variant="info">{leagues.filter(l => l.status === 'active').length} active</Badge>
          </div>
          
          <div className="space-y-3">
            {isLoadingLeagues ? (
              <>
                <LeagueCard loading />
                <LeagueCard loading />
                <LeagueCard loading />
              </>
            ) : (
              leagues.map((league) => (
                <LeagueCard key={league.id} league={league} />
              ))
            )}
          </div>

          {!isLoadingLeagues && (
            <Button variant="ghost" className="w-full">
              View All Leagues →
            </Button>
          )}
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
              markets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))
            )}
          </div>

          {!isLoadingMarkets && (
            <Button variant="ghost" className="w-full">
              Explore Markets →
            </Button>
          )}
        </section>
      </div>
    </AppLayout>
  );
}