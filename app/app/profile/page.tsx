"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useMiniAppContext } from "@/hooks/useMiniAppContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { usePreferences } from "@/lib/providers/PreferencesProvider";
import { Radio } from "lucide-react";

export default function ProfilePage() {
  const { user, isInMiniApp, loading } = useMiniAppContext();
  const { marketDisplayMode, setMarketDisplayMode } = usePreferences();

  const avatarInitial = (user?.displayName || user?.username || "U")[0]?.toUpperCase();

  if (!loading && !isInMiniApp) {
    return (
      <AppLayout title="Profile">
        <div className="p-4">
          <Card className="p-6 space-y-3">
            <p className="text-base font-semibold text-text">Open in Base or Farcaster</p>
            <p className="text-sm text-muted">
              This profile uses the mini app context. Launch from a Base or Farcaster client to load your
              avatar and account details.
            </p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profile">
      <div className="p-4 space-y-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-full overflow-hidden border border-border/70 bg-surface-highlight flex items-center justify-center text-xl font-semibold text-primary">
              {user?.pfpUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.pfpUrl}
                  alt={user.displayName || user.username || "User avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                avatarInitial
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xl font-bold text-text">{user?.displayName || user?.username || "Loading..."}</p>
              {user?.username && <p className="text-sm text-muted">@{user.username}</p>}
              {user?.fid && (
                <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                  FID: {user.fid}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <div className="space-y-1">
            <p className="text-base font-semibold text-text">Settings</p>
            <p className="text-sm text-muted">Personalize how PolyDraft looks and shows markets.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-surface-highlight/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-text">Theme</p>
                <p className="text-xs text-muted">Switch between light and dark.</p>
              </div>
              <ThemeToggle />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-text">Market numbers</p>
                  <p className="text-xs text-muted">Choose how prices are displayed in markets.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {([
                  { id: "price", title: "Price", desc: "$0.62 per share" },
                  { id: "probability", title: "Probability", desc: "62% implied" },
                  { id: "odds", title: "Odds", desc: "1.6x decimal" },
                ] as const).map((opt) => {
                  const isActive = marketDisplayMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMarketDisplayMode(opt.id)}
                      className={`
                        text-left rounded-xl border px-3 py-3 transition-all
                        ${isActive ? "border-primary bg-primary/10 shadow-card" : "border-border/70 bg-surface/70 hover:border-primary/60"}
                      `}
                    >
                      <p className="text-sm font-semibold text-text">{opt.title}</p>
                      <p className="text-xs text-muted mt-1">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {loading && (
          <Card className="p-4 text-sm text-muted">
            Loading mini app context...
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

