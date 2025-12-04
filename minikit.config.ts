const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: ""
  },
  miniapp: {
    version: "1",
    name: "PolyDraft",
    subtitle: "Fantasy Leagues for Prediction Markets",
    description: "Draft prediction markets, compete with friends, and win on-chain trophies. Fantasy sports meets forecasting on Base.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#1a1b26",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "games",
    tags: ["prediction-markets", "fantasy", "gaming", "polymarket", "base"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Fantasy leagues for prediction markets",
    ogTitle: "PolyDraft - Fantasy Leagues for Prediction Markets",
    ogDescription: "Draft prediction markets, compete with friends, and win on-chain trophies on Base.",
    ogImageUrl: `${ROOT_URL}/og-image.png`,
  },
} as const;

