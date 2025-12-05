"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "poly-theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [hydrated, setHydrated] = useState(false);

  const setDocumentTheme = useCallback((value: "light" | "dark") => {
    document.documentElement.dataset.theme = value;
    document.documentElement.style.colorScheme = value === "dark" ? "dark" : "light";
  }, []);

  const resolveChoice = useCallback((choice: ThemeChoice) => {
    if (choice === "system") {
      if (typeof window === "undefined") return "dark";
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    }
    return choice;
  }, []);

  const applyTheme = useCallback(
    (next: ThemeChoice) => {
      const applied = resolveChoice(next);
      setThemeState(next);
      setResolvedTheme(applied);
      setDocumentTheme(applied);
      window.localStorage.setItem(STORAGE_KEY, next);
    },
    [resolveChoice, setDocumentTheme]
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
    const initial = stored === "light" || stored === "dark" || stored === "system" ? stored : "dark";
    applyTheme(initial);
    setHydrated(true);
  }, [applyTheme]);

  useEffect(() => {
    if (!hydrated || theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => {
      const applied = event.matches ? "dark" : "light";
      setResolvedTheme(applied);
      setDocumentTheme(applied);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [hydrated, theme, setDocumentTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme: applyTheme,
  };
}

