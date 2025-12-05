import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../minikit.config";
import { RootProvider } from "./rootProvider";
import { PageTransition } from "@/components/layout/PageTransition";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: minikitConfig.miniapp.name,
    description: minikitConfig.miniapp.description,
    openGraph: {
      title: minikitConfig.miniapp.ogTitle,
      description: minikitConfig.miniapp.ogDescription,
      url: minikitConfig.miniapp.homeUrl,
      images: [
        {
          url: minikitConfig.miniapp.ogImageUrl,
          width: 1200,
          height: 630,
          alt: minikitConfig.miniapp.ogTitle,
        },
      ],
    },
    other: {
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl: minikitConfig.miniapp.embedImageUrl,
        button: {
          title: `Join the ${minikitConfig.miniapp.name} Waitlist`,
          action: {
            type: "launch_frame",
            name: `Launch ${minikitConfig.miniapp.name}`,
            url: minikitConfig.miniapp.homeUrl,
          },
        },
      }),
    },
  };
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
      <html lang="en">
        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <SafeArea>
            <PageTransition>{children}</PageTransition>
          </SafeArea>
        </body>
      </html>
    </RootProvider>
  );
}
