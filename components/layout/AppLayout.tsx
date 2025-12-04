"use client";

import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="max-w-mobile mx-auto flex min-h-screen flex-col pb-28">
        <header className="sticky top-0 z-40 pt-3">
          <div className="mx-4 px-1">
            {title ? (
              <h1 className="text-2xl font-bold text-foreground leading-snug">{title}</h1>
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