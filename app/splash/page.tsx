"use client";

import { useState } from "react";
import Image from "next/image";
import { sdk } from "@farcaster/miniapp-sdk";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/hooks/useTheme";

export default function Splash() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get Farcaster authentication token
      const { token } = await sdk.quickAuth.getToken();

      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      // Step 2: Verify token with backend and get user data
      const response = await sdk.quickAuth.fetch('/api/auth', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Backend authentication failed');
      }

      const authData = await response.json();

      if (!authData.success || !authData.user) {
        throw new Error('Invalid authentication response');
      }

      // Step 3: Reuse/create Supabase user by fid on the server (sets session)
      const supabase = createClient();
      const profileData = authData.user.profile || {};

      const sessionResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: authData.user.fid,
          profile: profileData
        })
      });

      if (!sessionResponse.ok) {
        const errorBody = await sessionResponse.json().catch(() => null);
        throw new Error(errorBody?.message || 'Failed to establish session');
      }

      const sessionData = await sessionResponse.json();

      if (!sessionData.success || !sessionData.session) {
        throw new Error('Invalid session response');
      }

      // Store session locally so the client Supabase instance is aware immediately
      const { access_token, refresh_token } = sessionData.session;
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (setSessionError) {
        throw setSessionError;
      }

      console.log('User authenticated:', {
        userId: sessionData.user?.id,
        fid: authData.user.fid,
        username: profileData.username,
        displayName: profileData.displayName,
        ens: profileData.ensName,
        wallet: profileData.walletAddress
      });

      // Navigate to main app
      router.push("/app");
    } catch (error) {
      console.error("Sign in failed:", error);
      setError(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen bg-background p-6 overflow-hidden">
      {/* Probability rain background constrained to mobile width */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="relative max-w-mobile w-full h-full">
          {Array.from({ length: 24 }).map((_, columnIndex) => {
            const numbers = Array.from({ length: 60 }, (_, idx) => `${(idx * 11 + columnIndex * 17) % 101}%`);
            const left = (columnIndex / 24) * 100;
            const duration = 8 + (columnIndex % 6);
            const delay = columnIndex * 0.35;
            return (
              <div
                key={columnIndex}
                className="absolute top-[-130%] text-[#3B82F6]/80 text-[11px] leading-4 animate-rain"
                style={{
                  left: `${left}%`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                }}
              >
                {numbers.map((num, i) => (
                  <span key={`${columnIndex}-${i}`} className="block">
                    {num}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 top-[35%] -translate-y-1/2 transform flex items-center justify-center pointer-events-none z-10">
        <div className="max-w-mobile w-full pointer-events-auto">
          <div className="flex items-center justify-center gap-3">
            <Image
              src={resolvedTheme === "light" ? "/polydraft-dark.svg" : "/polydraft.svg"}
              alt="PolyDraft logo"
              width={52}
              height={52}
              className="h-[52px] w-auto"
              priority
            />
            <h1 className="text-5xl font-bold text-text tracking-tight">
              PolyDraft
            </h1>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 top-[65%] flex justify-center px-6 z-10">
        <div className="max-w-mobile w-full text-center space-y-4">
          <Button
            onClick={handleSignIn}
            loading={isLoading}
            size="lg"
            className="w-full"
          >
            <div className="flex items-center justify-center space-x-2">
              <span>Sign in with</span>
              <img
                src="https://cdn.brandfetch.io/id6XsSOVVS/theme/light/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1757929761243"
                alt="Base"
                className="h-5 w-auto -mt-1"
              />
            </div>
          </Button>

          <Button
            onClick={() => router.push("/app")}
            size="sm"
            variant="outline"
            className="w-full"
          >
            🧪 Dev/Test Mode (No Auth Required)
          </Button>

          {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error font-semibold">Authentication Error</p>
              <p className="text-xs text-error/80 mt-1">{error}</p>
            </div>
          )}

          <div className="pt-14">
            <p className="text-xs text-muted">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes rain {
          0% {
            transform: translateY(-20%);
            opacity: 0;
          }
          10% {
            opacity: 0.18;
          }
          100% {
            transform: translateY(120%);
            opacity: 0;
          }
        }
        .animate-rain {
          animation-name: rain;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}
