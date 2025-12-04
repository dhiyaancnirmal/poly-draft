"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeagueCard } from "@/components/features";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

import { Trophy } from "lucide-react";

// NOTE: Showing skeleton loaders indefinitely since no real data/API is connected yet
// In production, this would fetch actual data from your backend
export default function LeaguesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "full">("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

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
              All (0)
            </Button>
            <Button
              variant={filterStatus === "active" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("active")}
            >
              Active (0)
            </Button>
            <Button
              variant={filterStatus === "full" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("full")}
            >
              Full (0)
            </Button>
          </div>
        </div>

        {/* Create League Button */}
        <Button size="lg" className="w-full">
          <Trophy className="w-4 h-4 mr-2" />
          Create New League
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
          ) : (
            <div className="text-center py-8">
              <p className="text-muted">No leagues found. Create one to get started!</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}