"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
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
      <div className="p-4 space-y-6 pb-24">
        {/* User Info */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent h-32 rounded-t-3xl -z-10" />
          <div className="pt-8 text-center space-y-3">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-surface-highlight rounded-full p-1 shadow-xl">
                <div className="w-full h-full bg-surface rounded-full flex items-center justify-center overflow-hidden">
                  <span className="text-4xl">👻</span>
                </div>
              </div>
              <Badge variant="success" className="absolute bottom-0 right-0 shadow-lg border-2 border-surface">
                PRO
              </Badge>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text">CryptoKing.eth</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Badge variant="default" className="bg-surface-highlight/50 backdrop-blur-md">
                  0x1234...5678
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center space-y-1 bg-gradient-to-br from-surface/60 to-surface/40">
            <div className="text-xs font-bold text-muted uppercase tracking-wider">Earnings</div>
            <div className="text-2xl font-bold text-success">$12,450</div>
          </Card>
          <Card className="p-4 text-center space-y-1 bg-gradient-to-br from-surface/60 to-surface/40">
            <div className="text-xs font-bold text-muted uppercase tracking-wider">Win Rate</div>
            <div className="text-2xl font-bold text-primary">68%</div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-text">Recent Activity</h3>
            <Button variant="ghost" size="sm" className="text-primary">View All</Button>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-3 flex items-center justify-between hover:bg-surface-highlight/20 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 1 ? 'bg-success/20 text-success' : 'bg-surface-highlight text-muted'}`}>
                    {i === 1 ? '🏆' : '⚔️'}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-text">Won League #{100 + i}</div>
                    <div className="text-xs text-muted">2 hours ago</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-success">+$450</div>
                  <div className="text-xs text-muted">ETH</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}