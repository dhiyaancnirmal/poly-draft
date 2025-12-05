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

  const applyTheme = useCallback(
    (_next: ThemeChoice) => {
      // Force dark mode; keep API stable.
      setThemeState("dark");
      setDocumentTheme("dark");
      setResolvedTheme("dark");
      window.localStorage.setItem(STORAGE_KEY, "dark");
    },
    [setDocumentTheme]
  );

  useEffect(() => {
    // Force default to dark on mount
    setThemeState("dark");
    setDocumentTheme("dark");
    setResolvedTheme("dark");
    window.localStorage.setItem(STORAGE_KEY, "dark");
    setHydrated(true);
  }, [setDocumentTheme]);

  useEffect(() => {
    if (!hydrated) return;
    // Reinforce dark after hydration
    setDocumentTheme("dark");
    setResolvedTheme("dark");
    window.localStorage.setItem(STORAGE_KEY, "dark");
  }, [hydrated, setDocumentTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme: applyTheme,
  };
}

