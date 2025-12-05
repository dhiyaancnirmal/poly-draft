/**
 * Profile page pulls user info directly from the Base mini app context.
 * We intentionally avoid persisting profile details; only fid is stored server-side.
 */
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { useMiniAppUser } from "@/lib/hooks";

export default function ProfilePage() {
  const { user, isInMiniApp, loading, error } = useMiniAppUser();

  const renderBody = () => {
    if (error) {
      return <p className="text-destructive text-sm">{error}</p>;
    }

    if (loading || isInMiniApp === null) {
      return <p className="text-muted">Loading profile…</p>;
    }

    if (!isInMiniApp) {
      return (
        <div className="space-y-2">
          <p className="font-semibold">Open in Base</p>
          <p className="text-muted text-sm">
            Profile details are only available when opened as a Base mini app.
          </p>
        </div>
      );
    }

    if (!user) {
      return <p className="text-muted">Loading profile…</p>;
    }

    const name = user.displayName || user.username || `FID ${user.fid}`;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full overflow-hidden border border-border/60 bg-surface-highlight/70 flex items-center justify-center text-lg font-semibold">
            {user.pfpUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.pfpUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span>{name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="leading-tight">
            <div className="text-lg font-semibold">{name}</div>
            {user.username ? (
              <div className="text-muted text-sm">@{user.username}</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
          <div className="text-xs uppercase text-primary font-semibold tracking-wide">FID</div>
          <div className="text-sm font-mono text-primary">{user.fid}</div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout title="Profile">
      <div className="p-4 space-y-4">
        {renderBody()}
      </div>
    </AppLayout>
  );
}

