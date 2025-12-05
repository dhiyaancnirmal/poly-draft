# PolyDraft

PolyDraft is a social fantasy app for prediction markets. Leagues are built on real Polymarket yes/no markets; commissioners set rules and budgets, share a join code, and friends draft markets like players. The default mode uses simulated trades; paid leagues in authorized markets (in progress) fund a user’s Polygon proxy/Safe via Base→Polygon USDC bridging for real Polymarket execution.

## Kits and key dependencies

- **MiniKit**: App manifest/config for Base mini app distribution (`minikit.config.ts`).
- **OnchainKit**: Frontend provider and hooks for Base/Farcaster mini app UX.
- **BridgeKit**: Circle bridge client (Base↔Polygon) for USDC funding of paid leagues.
- **Supabase**: Auth, database, and realtime draft sync.
- **Polymarket Gamma APIs**: Market discovery and live prices via edge routes.

## Built on Base

- Deploys to and targets **Base** (testnet: Base Sepolia; mainnet-ready).
- Mini app UX and distribution via Base SDK/**MiniKit/OnchainKit**; Farcaster-compatible.
- Paid leagues leverage Base→Polygon bridging (USDC) to fund execution.
- Smart wallets, paymasters, ERC-4337 account abstraction (Skeleton).
- AgentKit or x402 (Skeleton).
- Onchain data APIs (BaseScan, Dune, Reservoir, etc.) for analytics/telemetry (Skeleton for team feed).

## What’s built today

- Mobile-first Next.js 16 (App Router) with Tailwind, SafeArea/PageTransition, BottomNav.
- Base quick-auth onboarding; `/api/auth` + `/api/auth/session` set Supabase user/session.
- League lifecycle: create, search/filter, join, start draft; server actions handle inserts + revalidation.
- Drafts: single-player demo and realtime multi-user snake draft with Supabase sync (`useDraftSync`), no duplicate picks, enforced turn order.
- Market data: Edge routes proxy Polymarket daily/weekly/trending feeds and live/batch prices with caching and CLOB enrichment; React Query drives UI.
- Settings/profile: stats display (wins/leagues/points, wallet/FID), Farcaster links; profile page stub for future expansion.
- Manifest: `minikit.config.ts` with icons/hero/splash, metadata aligned to PolyDraft.

## Paid leagues & BridgeKit (in progress)

- BridgeKit client configured for Base↔Polygon (testnet: Base Sepolia → Polygon Amoy).
- API stubs: `/api/bridge/initiate`, `/api/bridge/status`, `/api/bridge/webhook` with rate limits, idempotency keys, and fallback destination support.
- Planned Supabase tables: `user_proxies` (Polygon proxy/Safe per user) and `bridge_transfers` (USDC bridge state, tx hashes, errors). Webhook verification + optional polling to be added.
- Proxy strategy: prefer user’s Polymarket proxy; custody fallback possible; to be finalized.

## Tech stack

- **Frontend**: Next.js 16 App Router, TypeScript, Tailwind, React Query, OnchainKit, MiniKit manifest.
- **Backend/Edge**: Next.js route handlers and server actions, Supabase client, Polymarket proxy routes.
- **Auth**: Farcaster via Supabase session.
- **Data**: Supabase (leagues, drafts, picks, users), realtime draft sync.
- **Bridging (WIP)**: BridgeKit + viem adapters, Base/Polygon RPCs from env, USDC addresses per env.
- **Tooling**: ESLint/TypeScript, Vercel-friendly deployment.

## Running locally

```bash
npm install
npm run dev
```

Create `.env.local` with at least:

```
NEXT_PUBLIC_URL=http://localhost:3000
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
NEYNAR_API_KEY=...
```

Paid-league/bridge envs (as needed):

```
BRIDGEKIT_API_KEY=...
BRIDGEKIT_APP_ID=...
BRIDGEKIT_ENV=testnet|mainnet
BRIDGEKIT_BASE_PRIVATE_KEY=0x...
BASE_RPC_URL=...
POLYGON_RPC_URL=...
USDC_BASE_ADDRESS=...
USDC_POLYGON_ADDRESS=...
WEBHOOK_SECRET=...
BRIDGE_CALLBACK_URL=...
BRIDGEKIT_POLYGON_DESTINATION=... # optional fallback
```

## Development status and next steps

- Finish Supabase migrations (`user_proxies`, `bridge_transfers`) and wire API routes to DB instead of in-memory store.
- Add webhook signature verification, status polling, and proxy creation/fallback helpers.
- Gate paid league joins on “ready” (proxy exists + minted funds or sufficient balance).
- Flesh out profile/leaderboard/scoring/resolution; add tests/monitoring; productionize docs.
