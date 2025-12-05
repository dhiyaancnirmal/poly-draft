# Simulated Trading & Predix Settlement – Current State

## What’s built
- **Schema & RLS**: sim fields on `leagues`; tables `swaps`, `score_snapshots`, `user_proxies`, `bridge_transfers`, `pick_swap_logs`; picks unique constraint; RLS blocks picks/swaps in `finalizing/finalized` (20251206_predix_settlement).
- **APIs (simulated)**: create/join/pick/swap/leaderboard/state; jobs (refresh-prices, score, resolutions, finalize); Predix transparency `/api/leagues/simulated/predix`.
- **Pricing job**: Gamma fetch, 60s cache, price clamp, token ids, fallback to prior/0.5; stats returned.
- **Scoring**: YES price / NO (1-price); PnL vs 0.5; uses `market_resolutions`; period_index via cadence; upserts `scores` and `score_snapshots`.
- **Resolutions job**: fetch Gamma winner → upsert `market_resolutions`.
- **Finalize/settlement**: rerun scoring, set league to `finalizing`, mint/burn via PredixManager, retry/wait receipt, write tx hash/status/error, set `finalized` or remain `finalizing` on failure.
- **Predix contracts (Base Sepolia)**: Predix `0x7C59388c626B01341ff123033718C64BA9C16F14`; PredixManager `0x2028eA6aAeaCcB46C9274487Ed2D8c3a0308Dd7B`.
- **Hooks/UI**: `usePredixTransparency`; Wallet page shows Predix balance/settlements/logs; league detail has temporary Predix card (`TempmaybePredixCard`).
- **Tests**: Pricing, scoring, resolutions, swap/pick validation, finalize/settlement, docs alignment, team name validation (34 passing).
- **Build**: `npm run build` passes; polymarket trending routes marked dynamic.

## Known behaviors
- Scoring returns “No eligible leagues” if status not in pending/live/active or no picks exist; finalize then settles nothing.
- Finalize requires Predix envs at runtime: `PREDIX_MANAGER_PRIVATE_KEY`, `PREDIX_MANAGER_ADDRESS`, `PREDIX_TOKEN_ADDRESS`, `PREDIX_RPC_URL`, `PREDIX_CHAIN_ID`.

## BridgeKit / paid-mode (not finished)
- No implemented BridgeKit calls; `initiate/status/webhook` stubs only.
- No paid-mode UI gating or proxy creation flow; no amount caps/rate limits for bridge.
- Need migrations for paid-mode tables if separate from sim usage; decide testnet stack (Base Sepolia ↔ Polygon Amoy) and USDC addresses.
- Circle webhook verification and bridge state polling not wired.

## UI gaps
- Job triggers (refresh/score/resolutions/finalize) are cron/manual only; not exposed in UI.
- Predix status only in Wallet + temp card; no BaseScan links in standings/leaderboards; no per-league job controls.

## Next steps (suggested)
- Add admin/test UI to trigger jobs per league.
- Surface Predix balance/settlement/tx status on league/leaderboard views.
- Implement BridgeKit migrations + endpoints + webhook verification + proxy handling + UI gating for paid leagues.
- Add amount caps/rate limits for bridge endpoints; error/resilience polish.

