"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeagueCard } from "@/components/features";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";


// Mock data
const allLeagues = [
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
  },
  {
    id: "4",
    name: "DeFi Degens League",
    members: 3,
    maxMembers: 6,
    prizePool: "$300",
    status: "active" as const,
    entryFee: "$50"
  },
  {
    id: "5",
    name: "NFT Predictions",
    members: 6,
    maxMembers: 8,
    prizePool: "$600",
    status: "active" as const,
    entryFee: "$75"
  }
];

export default function LeaguesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "full">("all");
  const [leagues] = useState(allLeagues);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const filteredLeagues = leagues.filter(league => {
    const matchesSearch = league.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || league.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const activeCount = leagues.filter(l => l.status === 'active').length;
  const fullCount = leagues.filter(l => l.status === 'full').length;

  return (
    <AppLayout title="Leagues">
      <div className="p-4 space-y-4">
        {/* Search and Filters */}
        <div className="space-y-3">
          <Input
            placeholder="Search leagues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="flex gap-2">
            <Button
              variant={filterStatus === "all" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              All ({leagues.length})
            </Button>
            <Button
              variant={filterStatus === "active" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("active")}
            >
              Active ({activeCount})
            </Button>
            <Button
              variant={filterStatus === "full" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("full")}
            >
              Full ({fullCount})
            </Button>
          </div>
        </div>

        {/* Create League Button */}
        <Button size="lg" className="w-full">
          🏆 Create New League
        </Button>

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
            filteredLeagues.map((league) => (
              <LeagueCard key={league.id} league={league} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted">No leagues found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}