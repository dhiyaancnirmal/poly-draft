# BridgeKit integration (Base ↔ Polygon)

Status: test-mode wiring for Base → Polygon with a single env-configured Polygon destination (no LeagueManager yet).

## Required dependencies
- `@circle-fin/bridge-kit`
- `@circle-fin/adapter-viem-v2` (uses `viem` already in the repo)

## Env vars
- `BRIDGEKIT_API_KEY`
- `BRIDGEKIT_APP_ID`
- `BRIDGEKIT_ENV` — `testnet` or `mainnet`
- `BASE_RPC_URL`
- `POLYGON_RPC_URL`
- `USDC_BASE_ADDRESS`
- `USDC_POLYGON_ADDRESS`
- `BRIDGEKIT_POLYGON_DESTINATION` — single Polygon address to receive bridged USDC during tests
- Optional (for server-initiated test flows): `BRIDGEKIT_BASE_PRIVATE_KEY` (private key that owns USDC on Base/Base Sepolia for test transfers)
- Optional: `WEBHOOK_SECRET`, `BRIDGE_CALLBACK_URL` (if using webhooks/polling callback)

## Flow (current phase)
1) Frontend calls `/api/bridge/initiate` with amount (league buy-in) → validates caps, requires destination (for now the env-configured address), calls BridgeKit, stores transferId/state.
2) Frontend polls `/api/bridge/status?transferId=...` for states: `pending` → `attesting` → `minted` (or `failed`).
3) Optional webhook `/api/bridge/webhook` can push state updates (verifies `WEBHOOK_SECRET`).

## Chains/routes
- Testnet: Base Sepolia → Polygon Amoy
- Mainnet: Base → Polygon

## Safety notes
- Never log secrets. Cap max bridge amount. Persist audit trail of `userId/transferId/state`.
- Destination is temporary test address; when LeagueManager or per-user Safes are ready, swap to per-user destination resolution.

