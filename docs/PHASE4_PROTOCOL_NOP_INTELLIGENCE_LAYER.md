# PHASE 4 – Protocol Layer & Intelligence Feed

## Data & Storage
- **Environment**: `PROTOCOL_ENV` exposes `VITE_NOP_TOKEN_ADDRESS`, `VITE_L2_RPC_URL`, and `VITE_DEXSCREENER_API_BASE` to the UI and server runtimes for RPC + market calls.
- **Supabase schema**:
  - `social_positions`: captures every registered long/short with size, prices, tx hashes, timestamps, and chain metadata. RLS allows public reads while restricting inserts/updates to either the owner (via wallet-address/profile lookup) or service-role.
  - `reputation_scores`: aggregates realized PnL, win rate, holding time, etc. per wallet. Publicly readable, authenticated/service roles can upsert for now.
- **Types**: regenerated `Database` typings now include both tables for strong typing across protocol modules.

## Protocol Libraries
- `src/lib/protocol/positions.ts` handles:
  - L2 tx verification via injected wallet or RPC URL (`BrowserProvider`/`JsonRpcProvider`).
  - Opening/closing social positions with Supabase inserts & PnL computation.
  - Helper `fetchUserSocialPositions` for frontend listings.
- `src/lib/protocol/reputation.ts` provides recompute + fetch helpers to keep `reputation_scores` aligned with social positions.
- `src/lib/protocol/fees.ts` centralizes the 1% fee and 50/25/25 breakdown for burn/treasury/rewards display.

## Intelligence Feed API & Widget
- New route `/api/intelligence-feed` merges:
  - Top reputation wallets (`reputation_scores`),
  - Recent social positions,
  - Cached news (`news_cache`),
  - DexScreener token snapshot (tokens endpoint keyed by `VITE_NOP_TOKEN_ADDRESS`).
- UI card `IntelligenceFeed` (home dashboard) consumes the API via React Query, presenting market snapshot, top addresses, recent positions, and news pulse.
- Home layout updated so AIMarketBar + IntelligenceFeed + revamped TopUsers (now powered by reputation data) share the hero grid.

## UI Touchpoints
- **Contributes**: “Buy & Register” now opens `RegisterPositionDialog` with guidance, direction/size inputs, and tx hash capture that calls `openSocialPosition`.
- **Wallet**: adds a Protocol card showing:
  - Open positions with direction, size, entry, truncated tx hash, and projected protocol fee per trade.
  - Reputation summary (win rate, realized PnL, open trades) tied to the connected wallet.
- **Trending Users**: `TopUsersCard` now lists reputation leaders (realized PnL + win rate) using live Supabase data or typed fallbacks.

## Outstanding Items for Full On-Chain Launch
- Finalize production RPC endpoints & actual NOP token address once contracts deploy.
- Integrate real contribute/pool IDs (current Supabase schema has optional `contribute_id` but no FK).
- Harden tx verification (decode logs, confirm token amounts, guard against replays).
- Add background job or webhook to recompute reputation after every insert/close, instead of manual calls.
- Wire fee accounting to on-chain treasury/burn/reward flows and surface aggregated totals in Tokenomics/Burn panels.
- Build admin tooling for moderating social positions and seeding reputation resets if necessary.
