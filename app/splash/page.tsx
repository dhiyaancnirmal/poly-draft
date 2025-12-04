"use client";

import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function Splash() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Initialize miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      // For now, just navigate to main app
      // In production, this would handle Base authentication
      setTimeout(() => {
        router.push("/app");
      }, 1000);
    } catch (error) {
      console.error("Sign in failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-mobile w-full space-y-8 text-center">
        {/* Logo and Title */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-text tracking-tight">
            PolyDraft
          </h1>
          <p className="text-lg text-muted">
            Fantasy League Platform for Prediction Markets
          </p>
        </div>

        {/* Sign In Button */}
        <div className="space-y-4">
          <Button
            onClick={handleSignIn}
            loading={isLoading}
            size="lg"
            className="w-full"
          >
            <div className="flex items-center justify-center space-x-3">
              <img
                src="https://cdn.brandfetch.io/id6XsSOVVS/theme/light/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1757929761243"
                alt="Base Logo"
                className="h-5 w-5"
              />
              <span>Sign in with Base</span>
            </div>
          </Button>
          
          <p className="text-xs text-muted">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Features Preview */}
        <div className="space-y-4 pt-8 border-t border-surface/20">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-8 h-8 mx-auto bg-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-primary text-sm">🏆</span>
              </div>
              <p className="text-xs text-muted">Fantasy Leagues</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 mx-auto bg-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-primary text-sm">📊</span>
              </div>
              <p className="text-xs text-muted">Live Markets</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 mx-auto bg-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-primary text-sm">🎯</span>
              </div>
              <p className="text-xs text-muted">Draft Strategy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}