import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export type MiniAppUser = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
};

type MiniAppContext = {
  user: MiniAppUser;
  frameId?: string;
  [key: string]: unknown;
};

export function useMiniAppContext() {
  const [user, setUser] = useState<MiniAppUser | null>(null);
  const [context, setContext] = useState<MiniAppContext | null>(null);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        const status = await sdk.isInMiniApp();
        if (cancelled) return;
        setIsInMiniApp(status);

        if (status) {
          const ctx = await sdk.context;
          if (cancelled) return;
          setContext(ctx);
          setUser(ctx.user);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load mini app context");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadContext();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, context, isInMiniApp, loading, error };
}

