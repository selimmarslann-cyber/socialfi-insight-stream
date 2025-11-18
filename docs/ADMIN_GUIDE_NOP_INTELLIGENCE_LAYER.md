# ADMIN GUIDE — NOP INTELLIGENCE LAYER

## Purpose
This guide walks internal operators through the preview admin console. It explains authentication, the available dashboards, and how burn/config operations are simulated during this phase.

## Access & Authentication
- The admin shell is client-side only for now. Sign in with username `selimarslan` and password `selimarslan`.
- A successful login stores `nop_admin_session=selimarslan` in `localStorage`, toggling admin-only navigation links.
- **Important:** This is not production security. Real deployments will use MPC + SafeAuth with server-validated JWTs.

## Overview Dashboard
After login you land on three widgets:
1. **Ops snapshot** — total wallet profiles, published posts, pools with trades, and aggregated NOP volume (all from Supabase).
2. **Top contributes** — combines REST contributes with Supabase trade stats to show the busiest pools.
3. **Top operators** — the alpha leaderboard derived from `nop_trades`.
If Supabase credentials are missing, metrics fall back to safe placeholders to avoid false confidence.

## Pools & Reputation
- **Pools module**: lists up to five contributes with their 7‑day volume. Use it to verify that weekly data matches boosted tasks and marketing claims.
- **Reputation module**: displays the current alpha leaderboard. Expect it to be empty until real trades log in `nop_trades`.
- You can cross-check any pool or wallet via the `/contributes` and `/u/:address` public pages for deeper context.

## Burn Panel (Preview)
- Located under “Controls”. It mirrors the existing `TokenBurn` widget but runs entirely client-side.
- Inputs (`total` and `last24h`) trigger a mock submission and log the payload to the console. No contract calls or Supabase writes occur yet.
- In production this panel will submit signed requests to a backend service that verifies credentials and broadcasts to the burn contract.

## Troubleshooting
- **Metrics are blank**: ensure `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Refresh the page after configuring.
- **Login not persisted**: clear browser storage and sign in again. The preview store does not handle multiple admin identities.
- **Pool data stale**: click the React Query refresh button (or reload) after publishing new contributes or running trades.

## Next Steps
1. Replace local credentials with MPC-authenticated sessions and server-verified tokens.
2. Wire burn updates to a serverless endpoint that validates payloads and emits on-chain transactions.
3. Expand the dashboard with contact form moderation, boosted task approvals, and SIEM export logs.

Use this guide as the operational playbook until those upgrades land. Document any anomalies in the `docs/PHASE*_` files so the wider team can iterate quickly.
