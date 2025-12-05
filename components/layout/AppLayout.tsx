"use client";

import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  title?: ReactNode;
  rightAction?: ReactNode;
}

export function AppLayout({ children, title, rightAction }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="max-w-mobile mx-auto flex min-h-screen flex-col pb-28">
        <header className="sticky top-0 z-40 bg-[#130c0c] py-4 shadow-md/40">
          <div className="mx-4 px-1 flex items-center justify-between gap-3">
            {title ? (
              <h1 className="text-2xl font-bold text-foreground leading-snug">{title}</h1>
            ) : null}
            {rightAction ? (
              <div className="flex-shrink-0">
                {rightAction}
              </div>
            ) : null}
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