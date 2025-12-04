"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Trophy, User, Settings } from "lucide-react";

const navigation = [
  { name: "Home", href: "/app", icon: Home },
  { name: "Leagues", href: "/app/leagues", icon: Trophy },
  { name: "Profile", href: "/app/profile", icon: User },
  { name: "Settings", href: "/app/settings", icon: Settings },
];

import { motion } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-50">
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-xl border border-surface-highlight/50 rounded-full shadow-2xl" />
      <div className="max-w-mobile mx-auto px-2 relative">
        <div className="flex justify-around items-center h-16">
          {navigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-16 h-full"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary/10 rounded-full my-2"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "relative z-10 flex flex-col items-center space-y-1 transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted hover:text-text"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                  {isActive && (
                    <span className="text-[10px] font-bold animate-fade-in">
                      {item.name}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}