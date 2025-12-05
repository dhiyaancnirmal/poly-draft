"use client";
import { ReactNode } from "react";
import { base } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { PreferencesProvider } from "@/lib/providers/PreferencesProvider";
import { useTheme } from "@/lib/hooks/useTheme";

export function RootProvider({ children }: { children: ReactNode }) {
  useTheme(); // hydrate theme on load

  return (
    <QueryProvider>
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={base}
        config={{
          appearance: {
            mode: "auto",
          },
          wallet: {
            display: "modal",
            preference: "all",
          },
        }}
        miniKit={{
          enabled: true,
          autoConnect: true,
          notificationProxyUrl: undefined,
        }}
      >
        <PreferencesProvider>{children}</PreferencesProvider>
      </OnchainKitProvider>
    </QueryProvider>
  );
}
