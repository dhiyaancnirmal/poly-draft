"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeChoice, useTheme } from "@/lib/hooks/useTheme";

const options: { value: ThemeChoice; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface/85 px-1.5 py-1 shadow-card backdrop-blur">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            aria-pressed={isActive}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isActive && "bg-primary/12 text-primary shadow-inner"
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2.5} />
          </button>
        );
      })}
    </div>
  );
}

