"use client";

import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth, useMiniAppUser } from "@/lib/hooks";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  title?: ReactNode;
  rightAction?: ReactNode;
}

export function AppLayout({ children, title, rightAction }: AppLayoutProps) {
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
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="max-w-mobile mx-auto flex min-h-screen flex-col pb-28">
        <header className="sticky top-0 z-40 bg-[#130c0c] py-4 shadow-md/40">
          <div className="mx-4 px-1 flex items-center justify-between gap-3">
            {title ? (
              <div className="flex items-center gap-2">
                {isHomeTitle ? (
                  <Image src="/polydraft.svg" alt="PolyDraft logo" width={32} height={32} priority />
                ) : null}
                <h1 className="text-2xl font-bold text-foreground leading-snug">{title}</h1>
              </div>
            ) : null}
            {rightAction ? (
              <div className="flex-shrink-0">
                {rightAction}
              </div>
            ) : (
              <Link
                href="/app/settings"
                aria-label="Profile"
                className="flex-shrink-0 flex items-center rounded-full bg-surface-highlight/80 border border-border/70 p-1.5 shadow-sm transition hover:border-primary/60 hover:shadow-md"
              >
                <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold text-primary bg-surface-highlight/60">
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
        </header>

        <main className="flex-1 w-full">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}