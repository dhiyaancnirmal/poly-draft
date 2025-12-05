# BridgeKit & Paid-Mode Handoff (Person A)

## Goal
Enable paid leagues by bridging USDC from Base to Polygon and funding the user’s Polygon proxy/Safe for Polymarket trades. Expose clean APIs/UI states so the frontend can gate “join paid league” on bridge readiness. LeagueManager/escrow lives on Polygon; Base is only for UX/auth.

## Current Direction
- Deploy LeagueManager on Polygon (same chain as Polymarket). Avoid a Base escrow; bridge straight to Polygon.
- Target address for bridge mint: user’s Polygon proxy/Safe (created via Polymarket relayer). If proxy missing, fallback to a Polygon custody wallet (temporary) but prefer direct-to-proxy.

## Environment & Secrets (expected)
- `BRIDGEKIT_API_KEY`, `BRIDGEKIT_APP_ID`, `BRIDGEKIT_ENV` (testnet/mainnet)
- `BASE_RPC_URL`, `POLYGON_RPC_URL`
- `USDC_BASE_ADDRESS`, `USDC_POLYGON_ADDRESS`
- `WEBHOOK_SECRET` (for Circle webhooks)
- `BRIDGE_CALLBACK_URL` (if using webhooks)
- `NEXT_PUBLIC_` RPC URLs (if needed client-side for status polling)

## API Surface (to build/finish)
- `POST /api/bridge/initiate`
  - Input: amount, maybe leagueId.
  - Steps: ensure user proxy address (from `user_proxies`), call BridgeKit Base→Polygon, store transfer row (`bridge_transfers`), return transferId/state.
- `GET /api/bridge/status?transferId=...`
  - Returns latest state (`pending/attesting/minted/failed`), dest address, amount.
- `POST /api/bridge/webhook`
  - Verify `WEBHOOK_SECRET`; upsert transfer state by transferId; idempotent.
- (Optional) `GET /api/bridge/ready`
  - By user/league: reports if “paid join” can proceed (proxy exists AND transfer minted OR sufficient Polygon balance).

## Data Model (Supabase tables to align on)
- `user_proxies`: `user_id`, `polygon_proxy_address`, `status (pending|ready|error)`, `last_checked_at`, `error`.
- `bridge_transfers`: `id/transfer_id`, `user_id`, `amount`, `token`, `from_chain`, `to_chain`, `dest_address`, `state`, `tx_hash_from`, `tx_hash_to`, `error`, timestamps.
- (For standings) paid-league trades/positions can be mirrored in a simple `paid_positions` table (optional) for UI without hitting Polymarket every time.

## Flow (happy path)
1) User selects paid league → requests join with buy-in amount.
2) Backend ensures proxy exists (create if missing) → has dest address.
3) `initiate` calls BridgeKit: burn USDC on Base, mint on Polygon to proxy.
4) Webhook/polling drives state updates; when `minted`, mark “ready”.
5) Frontend gates “Join” until ready; then paid trades execute via Polymarket relayer using the proxy funds.

## Status / What I pushed
- Branch contains initial BridgeKit scaffolding (you’ll need to wire real SDK calls and envs).
- No DB migrations yet for `user_proxies` / `bridge_transfers` (please add).
- No webhook handler, no status polling responses beyond stubs.

## Next Actions (Person A)
- Add migrations/tables for `user_proxies` and `bridge_transfers`.
- Implement `initiate/status/webhook` endpoints with real BridgeKit calls and signature verification.
- Decide testnet stack: Base Sepolia ↔ Polygon Amoy; set USDC addresses accordingly.
- Create or stub proxy creation (store address per user; allow override for tests).
- Add minimal rate limits and amount caps.
- Log every state change; make responses frontend-friendly (`state`, `message`, `destAddress`, `amount`).

## Open Questions / Assumptions
- LeagueManager contract interface/events (Polygon) still in progress; for now, we fund the proxy directly.
- Buy-in amount fixed per league? (Assume yes; validate on `initiate`.)
- Do we allow re-use of existing Polygon balance if already funded? (Frontend could skip bridge if ready.)
- Circle webhooks reachable? If not, rely on polling BridgeKit API.

## Test Plan (recommend)
- Use testnets; bridge 1 USDC-equivalent from Base Sepolia → Polygon Amoy to your own proxy.
- Capture transferId, timestamps (submit → attesting → minted).
- Verify Polygon balance increment on proxy address.
- Verify webhook signature handling; test idempotency.

