# Project Guide Alignment Report

Source docs reviewed:
- `PROJECT_GUIDE.md` (fantasy league mini app outline + tech stack)
- Repository code as of this report

## What’s Built (mapped to the guide intent)
- **Mobile-first Next.js 16 app router** with Tailwind styling, Inter/Source Code Pro fonts, and SafeArea/PageTransition wrappers; OnchainKit provider configured for Base mini app flows. (see `app/layout.tsx`, `app/rootProvider.tsx`)
- **Farcaster quick auth onboarding** on `/splash`: retrieves Neynar profile, creates/updates a Supabase user via `/api/auth` + `/api/auth/session`, sets a client session, and offers a dev/test bypass to `/app`.
- **App shell & navigation**: landing redirects to splash (`app/page.tsx`), bottom nav across Home/Draft/Leagues (`AppLayout` + `BottomNav`), consistent mobile width container and sticky headers.
- **League lifecycle**: create league form posts to server action `createLeague` (Supabase insert + revalidation); leagues list with search/filter, join, and creator-only “Start Draft” button that shuffles draft order, updates league status, seeds `draft_state`, and revalidates pages.
- **Draft experiences**:
  - `/app/draft`: single-player demo draft using Polymarket “daily markets” feed, timer, pick carousel, and market shuffle.
  - `/app/draft/[leagueId]`: realtime snake draft synced to Supabase (`useDraftSync`), prevents duplicate market picks, enforces turn order, and writes picks table rows; live prices streamed in.
- **Polymarket integration**: Edge API routes proxy daily markets, weekly/daily trending, and live/batch prices with caching and CLOB enrichment; React Query hooks drive MarketCard UI with live price/volume/end-time formatting and user-selectable price/probability/odds display (`PreferencesProvider`).
- **Settings & profile**: settings screen renders Supabase-backed profile stats (wins/leagues/points, wallet/FID display) with Farcaster/Warpcast links; profile page stub exists for future expansion.
- **Manifest & branding**: `minikit.config.ts` declares PolyDraft metadata (icons/hero/splash), accountAssociation, Base game category, and tags aligned with “fantasy leagues for prediction markets.”

## Notable Gaps / Follow-ups
- **Profile page** is empty (`app/app/profile/page.tsx`); no edit flows or social/wallet controls beyond Settings display.
- **Scoring/resolution** logic for picks/leagues isn’t present; no results/leaderboard pages beyond draft boards.
- **Monetization/entry fees** are captured as form inputs but no payment/settlement implementation.
- **README** still reflects a generic “Waitlist Mini App Quickstart,” not PolyDraft; consider updating for current product.
- **Testing & monitoring**: no automated tests or health checks noted.
- **API coverage**: websocket route folder exists but no handler; ensure live updates are handled solely via Supabase/REST.

## Overall Alignment
The codebase implements the guide’s core vision: a mobile-first Base/Farcaster mini app with league creation, drafting, and Polymarket market data + live prices. UX scaffolding, auth, data fetching, and realtime draft mechanics are in place. Remaining work centers on profile/leaderboard polish, payout/scoring mechanics, production hardening (envs, tests), and documentation refresh to replace the legacy waitlist README.

