"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export type MiniAppUser = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
};

export function useMiniAppUser() {
  const [user, setUser] = useState<MiniAppUser | null>(null);
  const [isInMiniApp, setIsInMiniApp] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const inMiniApp = await sdk.isInMiniApp();
        if (!active) return;
        setIsInMiniApp(inMiniApp);

        if (!inMiniApp) {
          return;
        }

        const context = await sdk.context;
        if (!active) return;
        setUser(context.user);
      } catch (err) {
        console.error("Failed to load mini app context", err);
        if (active) {
          setError("Unable to load Base profile. Please reopen in the Base app.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  return { user, isInMiniApp, loading, error };
}

