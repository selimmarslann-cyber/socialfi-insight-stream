# ARCHITECTURE — NOP INTELLIGENCE LAYER

## 1. Overview
The NOP Intelligence Layer is a social coordination network that fuses AI-evaluated research with on-chain incentives. Contributors publish insights, markets react through the NOPSocialPool, and governance enforces alignment via burns and boosted tasks. The architecture is intentionally modular: a React + Vite client for the command center, Supabase for the canonical data plane, and Ethereum (Sepolia) smart contracts for staking, burning, and pool execution. This document maps every major subsystem so that auditors, partners, and new contributors can reason about data flows, trust boundaries, and scaling paths.

## 2. Frontend Architecture
The client is a Vite + React + TypeScript application styled with Tailwind and shadcn-ui. Routing is handled by React Router with a shared `AppShell` component that renders the header, left rail, and responsive layout. UI primitives (cards, tables, badges, charts) live under `src/components`, while feature-specific pages reside in `src/pages`. State is managed through:
- **Zustand stores** (`useWalletStore`, `useAuthStore`, `useFeedStore`) for lightweight global state.
- **React Query** for data fetching, caching, and optimistic updates.
Theme tokens are defined in CSS variables (`src/styles/design-tokens.css`) and consumed through Tailwind’s extended palette. The client integrates Web3 actions (MetaMask, pool trading) via ethers v6 modules in `src/lib/pool.ts`. Error boundaries, skeleton states, and toasts ensure the dashboard remains responsive even when Supabase or on-chain calls are delayed.

## 3. Backend & Data
Supabase is the canonical datastore and auth layer. Key tables include:
- `social_profiles`, `social_posts`, `social_comments`, `social_likes` for the wallet-native social feed.
- `nop_trades`, `boosted_tasks`, `user_tasks`, `burn_stats`, `contact_messages`, and `news_cache` for protocol telemetry.
Row Level Security is enabled everywhere. Public reads are allowed for analytics, while inserts/updates are scoped per table (some preview flows use permissive policies until the MPC auth service ships). The schema file `supabase/00_full_schema_and_policies.sql` contains all DDL plus helper triggers such as `set_updated_at`. Supabase Storage stores media (charts, screenshots) uploaded from the Post Composer, and every request is proxied through Supabase’s REST or serverless endpoints to keep credentials off the client.

## 4. On-Chain Layer
The NOPSocialPool contract (currently deployed on Sepolia) enables buy/sell flows tied to individual posts (`contractPostId`). Tokens use standard ERC-20 semantics via the NOP token contract. The frontend interacts with the pool through `src/lib/pool.ts`, which wraps ethers v6 `BrowserProvider` and `Contract` instances. Key flows:
- **Approve + Trade**: Users approve NOP once, then call `depositNOP` or `withdrawNOP`.
- **Trade logging**: Successful transactions trigger `logTrade` which persists volume and side in `nop_trades` for reputation and analytics.
- **Access control**: Pools are toggled per contribute card, and the client handles allowance/position tracking to avoid failed transactions.
While currently confined to Sepolia for testing, the architecture supports L2 or mainnet deployment by swapping RPC endpoints and addresses via environment variables.

## 5. Analytics & Reputation
Every trade, boosted task, and contribution feeds into analytics modules:
- `fetchTopAlphaUsers` aggregates `nop_trades` to compute an Alpha Score (weighted by trade count, volume, and net bias).
- `fetchContributesWithStats` merges API contributes with weekly NOP volume from Supabase to prioritize pools.
- Profile pages query `social_posts`, `social_comments`, and `nop_trades` to build user histories.
React Query keeps these feeds fresh while maintaining client-side caches for smooth navigation. The Admin dashboard surfaces the same metrics—total profiles, posts, pools with trades, and cumulative NOP volume—so ops teams can detect regressions before a public release.

## 6. Admin & Operations
The admin panel is a dev-only shell gated by local credentials (selimarslan / selimarslan). It hydrates stats from Supabase and exposes preview modules: top pools, top alpha users, and the mock burn panel. Authentication intentionally lives in a dedicated Zustand store that persists a localStorage flag—this keeps the UI simple while back-end teams finish MPC + SafeAuth integration. Every admin action is clearly labeled as “preview-only” to avoid implying production-grade security.

## 7. Future Work
1. **Reputation v2**: Incorporate AI confidence, trade profitability, and social graph weighting into Alpha Score.
2. **Intelligence feed filters**: Allow users to query by tags, wallets, or AI signals via REST and WebSocket endpoints.
3. **Wallet-bound identity**: Replace preview stores with MPC-authenticated sessions and encrypted profile updates.
4. **Expanded burn mechanics**: Automate burn triggers post-trade, with on-chain proofs streamed back to Supabase.
5. **Observability**: Ship the real-time status dashboard (uptime, burn queue, AI latency) and SIEM export hooks.
6. **Community tooling**: Launch research circles, council briefings, and on-chain task boards with referral incentives.

This architecture document will evolve alongside the spec. Contributors should reference it before designing new modules or requesting infra changes so we maintain a coherent, auditable stack.
