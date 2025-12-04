"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "poly-theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const setDocumentTheme = useCallback((value: "light" | "dark") => {
    document.documentElement.dataset.theme = value;
    document.documentElement.style.colorScheme = value === "dark" ? "dark" : "light";
  }, []);

  const applyTheme = useCallback(
    (next: ThemeChoice) => {
      setThemeState(next);
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const resolved = next === "system" ? (mediaQuery.matches ? "dark" : "light") : next;
      setDocumentTheme(resolved);
      setResolvedTheme(resolved);
      window.localStorage.setItem(STORAGE_KEY, next);
    },
    [setDocumentTheme]
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const resolved = stored === "system" ? (mediaQuery.matches ? "dark" : "light") : stored;
      setThemeState(stored);
      setDocumentTheme(resolved);
      setResolvedTheme(resolved);
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      setResolvedTheme(systemTheme);
      setDocumentTheme(systemTheme);
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const resolved = theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;

    setDocumentTheme(resolved);
    setResolvedTheme(resolved);
    window.localStorage.setItem(STORAGE_KEY, theme);

    const listener = (event: MediaQueryListEvent) => {
      if (theme === "system") {
        const next = event.matches ? "dark" : "light";
        setDocumentTheme(next);
        setResolvedTheme(next);
      }
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);

  return {
    theme,
    resolvedTheme,
    setTheme: applyTheme,
  };
}

