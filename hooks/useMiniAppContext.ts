import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

type MiniAppUser = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
};

export function useMiniAppContext() {
  const [user, setUser] = useState<MiniAppUser | null>(null);
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
          const context = await sdk.context;
          if (cancelled) return;
          setUser(context.user);
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

  return { user, isInMiniApp, loading, error };
}

