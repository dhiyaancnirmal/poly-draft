"use client";

import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth, useMiniAppUser } from "@/lib/hooks";
import { BottomNav } from "./BottomNav";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  title?: ReactNode;
  rightAction?: ReactNode;
  showInvitesBadge?: boolean;
  invitesCount?: number;
}

export function AppLayout({ 
  children, 
  title, 
  rightAction,
  showInvitesBadge = true,
  invitesCount = 0 
}: AppLayoutProps) {
  const { displayName, username, avatarUrl } = useAuth();
  const { user: miniUser } = useMiniAppUser();
  const isHomeTitle = typeof title === "string" && title.toLowerCase() === "polydraft";

  const profileLabel =
    miniUser?.displayName ||
    miniUser?.username ||
    (miniUser?.fid ? `FID ${miniUser.fid}` : displayName || username || "Guest");
  const profileAvatar = miniUser?.pfpUrl || avatarUrl;
  const profileInitials = (profileLabel || "G").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-mobile mx-auto flex min-h-screen flex-col pb-28">
        {/* Header - fixed height, consistent layout */}
        <header className="sticky top-0 z-40 h-14 border-b border-border/40 bg-card/90 backdrop-blur-xl">
          <div className="flex items-center justify-between h-full px-4">
            {/* Left: Logo (home only) + Title */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {isHomeTitle && (
                <Image 
                  src="/polydraft.svg" 
                  alt="PolyDraft" 
                  width={28} 
                  height={28} 
                  priority 
                  className="rounded-lg flex-shrink-0"
                />
              )}
              {title && (
                <h1 className="text-lg font-bold text-foreground truncate">
                  {title}
                </h1>
              )}
            </div>

            {/* Right: Actions - fixed width area */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {showInvitesBadge && (
                <Link
                  href="/app/invites"
                  className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-accent/50 border border-border/50"
                  aria-label="Invites"
                >
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  {invitesCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {invitesCount > 9 ? "9+" : invitesCount}
                    </span>
                  )}
                </Link>
              )}

              {rightAction ? (
                rightAction
              ) : (
                <Link
                  href="/app/settings"
                  aria-label="Profile"
                  className="flex items-center rounded-xl bg-accent/50 border border-border/50 p-1"
                >
                  <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center text-sm font-semibold text-primary bg-primary/10">
                    {profileAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileAvatar} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span>{profileInitials}</span>
                    )}
                  </div>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
