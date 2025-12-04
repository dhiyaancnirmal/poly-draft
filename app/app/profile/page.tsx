"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonText } from "@/components/ui/Skeleton";

// User data will be fetched from API - showing skeleton loaders initially

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);

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
          <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
            <span className="text-3xl">User</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">Welcome</h2>
            <p className="text-sm text-muted">Connect wallet to continue</p>
            <Badge variant="info">Not Connected</Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-text">0</div>
            <div className="text-xs text-muted">Total Leagues</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">0</div>
            <div className="text-xs text-muted">Active</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success">0</div>
            <div className="text-xs text-muted">Wins</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-text">0%</div>
            <div className="text-xs text-muted">Win Rate</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">$0</div>
            <div className="text-xs text-muted">Total Earnings</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-warning">0</div>
            <div className="text-xs text-muted">Best Streak</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button size="lg" className="w-full">
            Create New League
          </Button>
          <Button variant="outline" size="lg" className="w-full">
            View History
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}