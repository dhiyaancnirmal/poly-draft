"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Gamepad2, Home, Trophy, Wallet, LucideIcon } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavItem[] = [
  { name: "Home", href: "/app", icon: Home },
  { name: "Draft", href: "/app/draft", icon: Gamepad2 },
  { name: "Leagues", href: "/app/leagues", icon: Trophy },
  { name: "Wallet", href: "/app/wallet", icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();
  
  const getBasePath = (path: string) => {
    const parts = path.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `/${parts[0]}/${parts[1]}`;
    }
    return path || "/app";
  };

  const basePath = getBasePath(pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe-bottom">
      <div className="max-w-mobile mx-auto px-4 pb-3">
        <div className="flex h-14 items-center rounded-2xl border border-border/40 bg-card/95 backdrop-blur-xl px-1 shadow-nav">
          {navigation.map((item) => {
            const isActive =
              basePath === item.href ||
              (item.href !== "/app" && basePath.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center h-full rounded-xl",
                  "transition-none", // no hover/scale to avoid shifting
                  isActive ? "bg-primary/12" : "bg-transparent"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={2}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium mt-1",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
