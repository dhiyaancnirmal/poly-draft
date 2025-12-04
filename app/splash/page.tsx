"use client";
 
import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function Splash() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use Farcaster Quick Auth to get authentication token
      const { token } = await sdk.quickAuth.getToken();

      if (token) {
        // Create Supabase client
        const supabase = createClient();
        
        // For now, we'll create a simple user profile
        // In production, you'd verify the Farcaster token and extract user info
        const { data: { user }, error: authError } = await supabase.auth.signInAnonymously({
          options: {
            data: {
              farcaster_token: token,
              username: `User_${Date.now().toString(36).slice(0, 8)}`
            }
          }
        });

        if (authError) {
          throw authError;
        }

        if (user) {
          // TODO: Create user profile later
          console.log('User authenticated:', user.id);
          
          // Navigate to main app
          router.push("/app");
        }
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      setError("Authentication failed. Please try again.");
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
            <div className="flex items-center justify-center space-x-2">
              <span>Sign in with</span>
              <img
                src="https://cdn.brandfetch.io/id6XsSOVVS/theme/light/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1757929761243"
                alt="Base"
                className="h-5 w-auto"
              />
            </div>
          </Button>

          {error && (
            <p className="text-xs text-warning">
              {error}
            </p>
          )}

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