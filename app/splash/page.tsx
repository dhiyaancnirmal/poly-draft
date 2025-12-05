"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useMiniKit, useAddFrame, useOpenUrl } from "@coinbase/onchainkit/minikit";
import { useMiniAppContext } from "@/hooks/useMiniAppContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Trophy, Users, TrendingUp, Zap, ArrowRight } from "lucide-react";

export default function SplashPage() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();
  const router = useRouter();
  const { isInMiniApp, user, context, loading: contextLoading, error: contextError } = useMiniAppContext();
  const [signupInProgress, setSignupInProgress] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [frameAdded, setFrameAdded] = useState(false);
  const [notificationState, setNotificationState] = useState<"on" | "off" | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Signal frame readiness
  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [setFrameReady, isFrameReady]);

  // Add frame action
  const handleAddFrame = useCallback(async () => {
    const result = await addFrame();
    if (result) {
      setFrameAdded(true);
      // Check if notification was enabled based on result
      const hasNotification = (result as { notificationDetails?: { url?: string } }).notificationDetails?.url;
      setNotificationState(hasNotification ? "on" : "off");
    }
  }, [addFrame]);

  // Handle quick auth signup
  const handleQuickAuthSignup = useCallback(async () => {
    if (!user?.fid) {
      setAuthError("Missing Farcaster ID");
      return;
    }

    setSignupInProgress(true);
    setAuthError(null);

    try {
      // Call Supabase sign-in with Farcaster ID
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "farcaster",
        token: String(user.fid),
        nonce: context?.frameId || "miniapp-nonce",
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      // Navigate to the app
      router.push("/app");
    } catch (err: any) {
      setAuthError(err?.message || "An error occurred");
    } finally {
      setSignupInProgress(false);
    }
  }, [user?.fid, context?.frameId, supabase, router]);

  // Auto-login if already signed in
  useEffect(() => {
    if (user?.fid && isInMiniApp && !contextLoading && !signupInProgress) {
      handleQuickAuthSignup();
    }
  }, [user?.fid, isInMiniApp, contextLoading, signupInProgress, handleQuickAuthSignup]);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-background">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100% 100% at 50% -20%, hsl(var(--primary) / 0.25), transparent 60%),
              radial-gradient(ellipse 80% 60% at 80% 50%, hsl(var(--primary) / 0.1), transparent 50%),
              radial-gradient(ellipse 80% 60% at 20% 80%, hsl(var(--primary) / 0.1), transparent 50%)
            `
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative">
            <Image
              src="/polydraft.svg"
              alt="PolyDraft"
              width={80}
              height={80}
              priority
              className="rounded-2xl"
            />
            <div className="absolute -bottom-2 -right-2">
              <Badge variant="success" size="sm">Live</Badge>
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            PolyDraft
          </h1>
          <p className="text-muted-foreground">
            Fantasy Prediction Markets
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full space-y-3 mb-8"
        >
          {[
            { icon: Trophy, text: "Draft markets. Compete. Win." },
            { icon: Users, text: "Play head-to-head or in leagues" },
            { icon: TrendingUp, text: "Live Polymarket prices" },
            { icon: Zap, text: "Powered by Base" },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 border border-border/30"
            >
              <feature.icon className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground">{feature.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Error display */}
        {(authError || contextError) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full mb-4"
          >
            <Card variant="outline" className="border-error/30 bg-error/5">
              <CardContent className="py-3 text-center">
                <p className="text-sm text-error">{authError || contextError}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full space-y-3"
        >
          {isInMiniApp && user ? (
            <Button
              size="lg"
              className="w-full"
              loading={signupInProgress || contextLoading}
              onClick={handleQuickAuthSignup}
            >
              {signupInProgress ? "Signing in..." : "Continue as "}
              {user.displayName || user.username || `FID ${user.fid}`}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full"
              loading={contextLoading}
              onClick={() => router.push("/app")}
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {isInMiniApp && !frameAdded && (
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleAddFrame}
            >
              Add to Favorites
            </Button>
          )}

          {frameAdded && (
            <div className="text-center">
              <Badge variant="success" size="sm">
                {notificationState === "on" ? "✓ Added with notifications" : "✓ Added to favorites"}
              </Badge>
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 p-6 text-center">
        <p className="text-xs text-muted-foreground">
          Built on Base • Powered by Polymarket
        </p>
      </div>
    </div>
  );
}
