"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type MarketDisplayMode = "price" | "probability" | "odds";

type PreferencesContextValue = {
  marketDisplayMode: MarketDisplayMode;
  setMarketDisplayMode: (mode: MarketDisplayMode) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const STORAGE_KEY = "poly-pref:market-display-mode";

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [marketDisplayMode, setMarketDisplayModeState] = useState<MarketDisplayMode>("price");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as MarketDisplayMode | null;
      if (stored === "price" || stored === "probability" || stored === "odds") {
        setMarketDisplayModeState(stored);
      }
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  const setMarketDisplayMode = (mode: MarketDisplayMode) => {
    setMarketDisplayModeState(mode);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      // ignore storage errors
    }
  };

  const value = useMemo(
    () => ({
      marketDisplayMode,
      setMarketDisplayMode,
    }),
    [marketDisplayMode]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}

