"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useMiniAppContext } from "@/hooks/useMiniAppContext";

export default function ProfilePage() {
  const { user, isInMiniApp, loading } = useMiniAppContext();

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

        {loading && (
          <Card className="p-4 text-sm text-muted">
            Loading mini app context...
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

