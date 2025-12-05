# Simulated Mode (Predix) API & Jobs

## Core endpoints
- `POST /api/leagues/simulated/create` – create sim league (fields: `name`, `type` daily|weekly, `durationPeriods`, `picksPerPeriod`, `maxParticipants` even 2-12, optional `cadence`, `marketsPerPeriod`, `startTime`, `description`).
- `POST /api/leagues/simulated/join` – join by `joinCode` or `leagueId`; uses auth user wallet/email fallback.
- `POST /api/leagues/simulated/pick` – body: `leagueId`, `marketId` (Polymarket id), `outcomeSide` YES|NO, optional `marketTitle`, `price`, `endTime`. Enforces league start/end window and per-period cap (`markets_per_period`), upserts market/outcome, records pick, logs to `pick_swap_logs`.
- `POST /api/leagues/simulated/swap` – body: `leagueId`, `toMarketId`, `toOutcomeSide`, optional `fromMarketId`, `fromOutcomeSide`, `notionalIn`, `notionalOut`, `fee`, `pnlDelta`, `metadata`, `marketTitle`, `endTime`, required `price`. Enforces start/end window, per-period swap cap (3), slippage ±5% vs current price, and blocks opposite-side conflicts; records swap and logs.
- `GET /api/leagues/simulated/leaderboard?leagueId=` – returns league meta, `scores`, `score_snapshots`.
- `GET /api/leagues/simulated/state?leagueId=` – returns league meta + `picks`, `swaps`, `scores`.

## Jobs / cron-friendly
- `POST /api/leagues/simulated/jobs/refresh-prices` – Gamma-only price refresh; batch fetch YES/NO prices per Polymarket market, cache ~60s, and upsert `outcomes.current_price`/`token_id`. Keeps prior price (fallback 0.5) when feeds are missing; returns stats (counts, missing).
- `POST /api/leagues/simulated/jobs/score?[leagueId=]` – recompute scores/snapshots for one or all sim leagues (`pending|live|active`) using refreshed prices and market resolutions.
- `POST /api/leagues/simulated/jobs/finalize?leagueId=` – recompute scores then set status `finalized` (prep for Predix settlement).

## Env vars
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` – client Supabase.
- `SUPABASE_SECRET_KEY` – service role for server routes (required).
- `POLYMARKET_API` (optional) – Gamma base when overriding default.

## Cadence suggestions
- Price refresh: every 1–5 minutes while leagues are live.
- Scoring refresh: every 5–10 minutes (or aligned to cadence periods).
- Finalize: at league end_time or after market resolutions; reruns scoring after the last price refresh.

## Notes
- Picks enforce one-side-per-market per user via DB constraint; pick numbers auto-increment per league; additional per-period limit enforced.
- Scoring mark-to-market: value = YES price, NO (1-price); points = sum(value)*100; pnl = sum((value-0.5)*100); uses market resolutions (win=1, loss=0). Snapshots keyed by `period_index` derived from `start_time` + cadence (daily=1d, weekly=7d, custom=1d fallback).
- Swaps require price and notional; enforce ±5% slippage, per-period cap (3), and block opposite-side conflicts.
- Logs: `pick_swap_logs` store append-only transparency entries; `score_snapshots` keep history for UI; jobs return structured stats for monitoring.

