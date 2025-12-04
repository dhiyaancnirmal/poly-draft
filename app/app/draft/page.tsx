"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MarketCard } from "@/components/features";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonText } from "@/components/ui/Skeleton";

// Data will be fetched from API - showing skeleton loaders initially

export default function DraftPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(45);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<"YES" | "NO" | null>(null);

  // Simulate timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 45; // Reset for demo
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleMakePick = () => {
    if (selectedMarket && selectedSide) {
      console.log(`Picked ${selectedSide} for market ${selectedMarket}`);
      setSelectedMarket(null);
      setSelectedSide(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Draft Room">
        <div className="p-4 space-y-6">
          <div className="text-center">
            <SkeletonText lines={1} className="w-32 mx-auto" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-surface rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Draft Room">
      <div className="p-4 space-y-6">
        {/* Draft Status */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="success">
              🎯 Your Pick #5
            </Badge>
            <div className="text-2xl font-bold text-text">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <p className="text-sm text-muted">
            Make your selection before time runs out
          </p>
        </div>

        {/* Draft Board */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Draft Board</h3>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i + 1}
              className={`
                aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center text-xs
                ${i === 4 
                  ? 'border-primary bg-primary/20 animate-pulse' 
                  : 'border-surface/20 bg-surface/30'
                }
              `}
            >
              <div className="text-muted mb-1">#{i + 1}</div>
              <div className="text-muted">Empty</div>
            </div>
          ))}
        </div>
        </div>

        {/* Available Markets */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted">Available Markets</h3>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <MarketCard loading />
                
                {/* Selection Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedMarket === `market-${i}` && selectedSide === "YES" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedMarket(`market-${i}`);
                      setSelectedSide("YES");
                    }}
                  >
                    Select YES
                  </Button>
                  <Button
                    variant={selectedMarket === `market-${i}` && selectedSide === "NO" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedMarket(`market-${i}`);
                      setSelectedSide("NO");
                    }}
                  >
                    Select NO
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Pick Button */}
          <Button
            size="lg"
            className="w-full"
            disabled={!selectedMarket || !selectedSide}
            onClick={handleMakePick}
          >
            {selectedMarket && selectedSide 
              ? `Confirm: ${selectedSide} for Market ${selectedMarket}`
              : "Select a market and side"
            }
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}