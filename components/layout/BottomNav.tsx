"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Gamepad2, Home, Settings, Trophy } from "lucide-react";

const navigation = [
  { name: "Home", href: "/app", icon: Home },
  { name: "Draft", href: "/app/draft", icon: Gamepad2 },
  { name: "Leagues", href: "/app/leagues", icon: Trophy },
  { name: "Settings", href: "/app/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const basePath = (() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `/${parts[0]}/${parts[1]}`;
    }
    return pathname || "/app";
  })();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-2">
      <div className="max-w-mobile mx-auto px-4">
        <div className="flex items-center justify-between gap-1 rounded-xl border border-border/70 bg-surface/95 px-2 py-2 shadow-card backdrop-blur">
          {navigation.map((item) => {
            const isActive = basePath === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-1 items-center justify-center rounded-lg px-2 py-2 text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-lg">
                  {isActive && (
                    <span className="absolute inset-0 rounded-lg bg-primary/18 shadow-[0_10px_30px_-14px_rgba(49,114,255,0.5)]" aria-hidden />
                  )}
                  <item.icon
                    className={cn(
                      "relative z-10 h-5 w-5",
                      isActive ? "text-primary" : "text-muted"
                    )}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}