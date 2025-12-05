# Simulated Mode Ops & Cron

- Price refresh: `POST /api/leagues/simulated/jobs/refresh-prices` every 1–5m while leagues active.
- Scoring: `POST /api/leagues/simulated/jobs/score` every 5–10m (aligned with cadence; includes `finalizing` leagues).
- Resolution ingestion: `POST /api/leagues/simulated/jobs/resolutions` every 10–15m (or after known events).
- Finalize/settle: `POST /api/leagues/simulated/jobs/finalize?leagueId=...` at league end or after all resolutions.
- Orchestrator: `POST /api/leagues/simulated/jobs/cron?[leagueId=]` to run refresh → score → resolutions → finalize in one call (finalize step runs only when `leagueId` is provided).
- Health: `GET /api/health` to verify Supabase connectivity and return last job metrics.

Suggested curl shape (replace token/league):
```
curl -X POST "$BASE_URL/api/leagues/simulated/jobs/refresh-prices"
curl -X POST "$BASE_URL/api/leagues/simulated/jobs/resolutions"
curl -X POST "$BASE_URL/api/leagues/simulated/jobs/score?leagueId=<id>"
curl -X POST "$BASE_URL/api/leagues/simulated/jobs/finalize?leagueId=<id>"
curl -X POST "$BASE_URL/api/leagues/simulated/jobs/cron?leagueId=<id>"
```

Logging/metrics:
- Jobs return JSON stats (counts, missing, failures). Forward to logs/metrics sink.
- Settlement writes `settlement_status/tx_hash` on `scores` plus `tx_status/tx_error` on `pick_swap_logs`.
- Health endpoint returns `{ ok: true, jobs: { ...latest metrics... } }` or an error message for dashboards.


