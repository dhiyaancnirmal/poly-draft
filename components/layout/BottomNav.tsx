"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/app", icon: "🏠" },
  { name: "Leagues", href: "/app/leagues", icon: "🏆" },
  { name: "Draft", href: "/app/draft", icon: "📊" },
  { name: "Profile", href: "/app/profile", icon: "👤" },
  { name: "Settings", href: "/app/settings", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg border-t border-surface/20 z-50">
      <div className="max-w-mobile mx-auto">
        <div className="flex justify-around items-center h-16">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-colors min-h-touch",
                  isActive
                    ? "text-primary"
                    : "text-muted hover:text-text"
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}