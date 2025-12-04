"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonText } from "@/components/ui/Skeleton";

// Mock user data
const mockUserData = {
  fid: 12345,
  username: "crypto_drafter",
  displayName: "Crypto Drafter",
  avatar: "👤",
  stats: {
    totalLeagues: 12,
    activeLeagues: 3,
    wins: 4,
    winRate: 33.3,
    totalEarnings: "$1,250",
    bestStreak: 3
  },
  recentLeagues: [
    {
      id: "1",
      name: "Week 12 Predictions",
      position: 2,
      participants: 8,
      earnings: "$200"
    },
    {
      id: "2",
      name: "Crypto Championship", 
      position: 1,
      participants: 6,
      earnings: "$300"
    },
    {
      id: "3",
      name: "Market Masters",
      position: 4,
      participants: 8,
      earnings: "$0"
    }
  ]
};

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData] = useState(mockUserData);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <AppLayout title="Profile">
        <div className="p-4 space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-surface rounded-full mx-auto mb-4 animate-pulse" />
            <SkeletonText lines={2} className="w-32 mx-auto" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-lg p-4">
                <SkeletonText lines={1} />
                <SkeletonText lines={1} className="w-16" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profile">
      <div className="p-4 space-y-6">
        {/* User Info */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto flex items-center justify-center text-3xl">
            {userData.avatar}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">{userData.displayName}</h2>
            <p className="text-sm text-muted">@{userData.username}</p>
            <Badge variant="info">FID: {userData.fid}</Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-text">{userData.stats.totalLeagues}</div>
            <div className="text-xs text-muted">Total Leagues</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{userData.stats.activeLeagues}</div>
            <div className="text-xs text-muted">Active</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success">{userData.stats.wins}</div>
            <div className="text-xs text-muted">Wins</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-text">{userData.stats.winRate}%</div>
            <div className="text-xs text-muted">Win Rate</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{userData.stats.totalEarnings}</div>
            <div className="text-xs text-muted">Total Earnings</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-warning">{userData.stats.bestStreak}</div>
            <div className="text-xs text-muted">Best Streak</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text">Recent Leagues</h3>
          <div className="space-y-3">
            {userData.recentLeagues.map((league) => (
              <div key={league.id} className="bg-surface/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-text">{league.name}</h4>
                    <p className="text-sm text-muted">
                      {league.participants} participants
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={league.position === 1 ? 'success' : league.position <= 3 ? 'warning' : 'default'}
                    >
                      #{league.position}
                    </Badge>
                    <p className="text-sm font-medium text-text mt-1">
                      {league.earnings}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button size="lg" className="w-full">
            🏆 Create New League
          </Button>
          <Button variant="outline" size="lg" className="w-full">
            📊 View History
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}