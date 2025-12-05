import type { Metadata } from "next";
import { Source_Code_Pro, TikTok_Sans } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../minikit.config";
import { RootProvider } from "./rootProvider";
import { PageTransition } from "@/components/layout/PageTransition";
import "./globals.css";

const themeInitializer = `
(function() {
  const storageKey = 'poly-theme';
  try {
    const stored = window.localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = initial;
    document.documentElement.style.colorScheme = initial === 'dark' ? 'dark' : 'light';
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }
})();
`;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: minikitConfig.miniapp.name,
    description: minikitConfig.miniapp.description,
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: `Join the ${minikitConfig.miniapp.name} Waitlist`,
          action: {
            name: `Launch ${minikitConfig.miniapp.name}`,
            type: "launch_frame",
          },
        },
      }),
    },
  };
}

const tikTokSans = TikTok_Sans({
  variable: "--font-tiktok-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootProvider>
      <html lang="en" suppressHydrationWarning data-theme="light">
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        </head>
        <body className={`${tikTokSans.variable} ${sourceCodePro.variable}`}>
          <SafeArea>
            <PageTransition>{children}</PageTransition>
          </SafeArea>
        </body>
      </html>
    </RootProvider>
  );
}
