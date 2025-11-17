# PHASE 1 Audit – NOP Intelligence Layer / SocialFi App

## Overview
This document captures the Phase 1 codebase analysis of the NOP Intelligence Layer / SocialFi application. The repo currently targets a Vite + React stack with shadcn-inspired UI primitives, Supabase integrations, serverless API routes for market data, and a growing set of SocialFi features (feed, wallet, pooled investments, games, boosted tasks). The branch has divergent experiments (mock data, unfinished pool trading, local-only admin tools) and merge conflicts that block builds.

Our focus in this phase was to install dependencies, run static checks, map the architecture, inspect data flows, and highlight critical UX, security, and quality gaps to unblock Phase 2 redesign/refactor efforts.

## Build / Type / Lint Status
| Check | Command / Notes | Result |
| --- | --- | --- |
| Install | `npm install` | ✅ Completes, but `npm audit` reports 6 (4 moderate, 2 high) vulnerabilities. |
| TypeScript | `npm run typecheck` (missing script) → `npx tsc --noEmit` | ✅ No TS errors, but the intended script is absent. |
| Lint | `npm run lint` | ❌ 21 issues. Highlights:<br />• `src/components/tasks/TaskCard.tsx:40` – merge markers break parsing.<br />• `tailwind.config.ts:106` – `require()` import blocked by lint config.<br />• Multiple `any` usages (`src/lib/pool.ts:22`, `src/components/ui/chart.tsx:94/155/222/236`, `src/components/TopUsersCard.tsx:62/114`).<br />• Empty interfaces in `src/components/ui/command.tsx:24` and `src/components/ui/textarea.tsx:5`.<br />• React-refresh warnings across `src/components/ui/{badge,button,form,navigation-menu,sidebar,sonner,toggle}.tsx`. |
| Build | `npm run build` | ❌ Fails: `src/components/tasks/TaskCard.tsx:40:2 Expected "}" but found "<<"` (unresolved merge conflict). |

> **Key blocker**: `TaskCard`’s conflict markers (`src/components/tasks/TaskCard.tsx` lines 33–158) prevent lint/build from finishing and must be resolved before Phase 2.

## Architecture Map
```
src/main.tsx
└─ ErrorBoundary → App.tsx
   ├─ QueryClientProvider (@tanstack/react-query)
   ├─ TooltipProvider + Toaster/Sonner notifications
   └─ BrowserRouter
        └─ AppShell (Header + <Outlet> + Footer)
             ├─ Header (theme toggle, wallet connect, search)
             └─ Footer (static links)
Routes (src/App.tsx):
  / (Index) – feed/composer/dashboard
  /explore, /contributes, /wallet, /games, /admin, /burn, pool routes, legal/static pages…
Supporting layers:
  • State: `src/lib/store.ts` (Zustand for auth, wallet, feed)
  • Hooks: `src/hooks/*` (e.g., `usePoolAccess`, `usePageMetadata`)
  • Feature components: `src/components/{ai,feed,post,wallet,tasks,side,widgets}`
  • Data/services: `src/lib/*`, `src/backend/*`, serverless handlers in `/api`
  • Assets/config: `src/styles`, `src/theme`, `src/config`, `src/data`
```

### Core Modules (ship critical SocialFi flows)
- **Routing & layout**: `src/App.tsx`, `src/components/layout/*`.
- **Feed & composer**: `src/pages/Index.tsx`, `src/components/feed/*`, `src/components/post/PostComposer.tsx`, `src/lib/mock-api.ts`, `src/lib/store.ts`.
- **Analytics widgets**: `src/components/ai/*`, `src/components/CryptoNews.tsx`, `src/components/TopUsersCard.tsx`, `src/components/TokenBurn.tsx`.
- **Wallet & boosted tasks**: `src/pages/WalletPage.tsx`, `src/components/wallet/*`, `src/components/tasks/BoostedTasks.tsx`, `src/components/tasks/TaskCard.tsx`, `src/lib/store.ts`, `src/lib/tasks.ts` (intended), `src/lib/supabaseClient.ts`.
- **Pool / contributes**: `src/pages/pool/*`, `src/pages/Contributes.tsx`, `src/backend/{contributes,pool}.ts`, `src/lib/{contributes,pool,orders}`, `src/hooks/usePoolAccess.ts`.
- **API surface**: `/api/{ai-signals,prices,fear-greed,crypto-news,burn}.ts` plus shared Binance helper.

### Peripheral / Experimental Modules
- **Games suite**: `src/pages/games/*`, `src/lib/games/localStore.ts`, `src/pages/Games.tsx`, `src/pages/admin/GamesAdmin.tsx` (local-only admin).
- **Legacy/unused UI**: `src/components/{PostBox,PostList,SmartButton}.tsx`, `src/components/widgets/EventsBoost.tsx`.
- **Unreferenced utilities**: `src/lib/rss.ts`, parts of `src/lib/tasks.ts`.
- **Large set of static marketing/legal pages under `src/pages/*` (content-only, low coupling).**

## UI/UX Structure Issues (code-level)
1. **Unresolved TaskCard merge conflict** – `src/components/tasks/TaskCard.tsx` has git markers around props, render, and CTA logic (lines 33–158), creating duplicate markup and blocking builds.
2. **Layout inconsistency between routes** – Home (`src/pages/Index.tsx`) embeds `LeftRail` inside its own grid, while other core pages (Explore, Wallet, Games) render full-width under `AppShell` without the rail, causing a fragmented navigation experience.
3. **Inline color/spacing overrides in `Header`** – `src/components/layout/Header.tsx` hardcodes `color-mix(...)` styles instead of reusing `design-tokens.css`, leading to divergence from the theme palette.
4. **Wallet stack duplicates bespoke card patterns** – `src/pages/WalletPage.tsx` and `src/components/wallet/*` recreate badges, cards, and chips with inline styles; no shared “finance card” primitives exist, so updates require touching many files.
5. **`PostComposer` is a “god component”** – At ~400 lines (`src/components/post/PostComposer.tsx`), it mixes sanitization, hashtag parsing, drag-and-drop, Supabase uploads, and toast orchestration; extremely hard to extend/test.
6. **Games UI bypasses Tailwind tokens** – `src/pages/games/*.tsx` rely on raw class strings and inline `style={{ border: '1px solid var(--ring)' }}`, diverging from the rest of the app’s spacing and type scales.
7. **Three different boosted-task UIs** – `src/components/tasks/BoostedTasks.tsx`, `src/components/side/BoostEventCard.tsx`, and `src/components/widgets/EventsBoost.tsx` all render the same business concept with conflicting markup and storage semantics.
8. **UI kit exports break fast refresh** – shadcn-derived components (e.g., `src/components/ui/{badge.tsx,button.tsx,form.tsx,navigation-menu.tsx,sidebar.tsx,sonner.tsx,toggle.tsx}`) export helper constants next to components, triggering `react-refresh/only-export-components` warnings and risking stale UI during edits.

## Data Flow & Supabase / Backend Usage
- **Client state**: Zustand store (`src/lib/store.ts`) holds admin auth, wallet balances/transactions, referral codes, and user-composed posts. Many “rewards” (granting NOP, marking boosted tasks) mutate this local store with no server verification.
- **Feed & Explore**: `react-query` fetches mock data (`src/lib/mock-api.ts`) plus user-created posts via `useFeedStore`. Explore’s market widgets call serverless APIs (`/api/prices`, `/api/ai-signals`, `/api/fear-greed`) and fall back to canned datasets.
- **Supabase**: Initialized in `src/lib/supabaseClient.ts`. Used in `PostComposer` (optional media uploads), `TopUsersCard.tsx` (leaderboard), `components/tasks/BoostedTasks.tsx` (reads `boosted_tasks` & `user_tasks`), and `src/lib/actions.ts` / `src/lib/orders.ts` for posts/investment logging. Many other modules (PostBox/PostList, lib/tasks) assume Supabase but are unused.
- **Axios backend layer**: `src/lib/axios.ts` configures an API client hitting `PUBLIC_ENV.apiBase` (default `/api`). `src/backend/contributes.ts` and `src/backend/pool.ts` call this client for admin/pool actions, implying there should be REST endpoints outside this repo.
- **Serverless APIs (`/api`)** provide read-only data (Binance/Alternative.me proxies, RSS normalization, burn fallback). Notably, `/api/burn.ts` only implements GET; POST updates referenced in docs/admin UI are missing.
- **Pool utility**: `src/lib/pool.ts` wraps ethers.js `BrowserProvider` to preview buy/sell costs; `usePoolAccess` couples REST (`fetchContribute`) and on-chain state to gate pool routes.

Duplicated fetch patterns exist (raw `fetch` vs Axios vs `react-query`). Centralizing data services/hooks should be a Phase 2 goal.

## Feature Map
### Explore (`src/pages/Explore.tsx`)
- **User journey**: enter page → filter posts by All/Funded/Trending tabs → search content/tags → view AI-powered market widgets and Top Gainers.
- **Logic**: merges mock posts with user-generated ones (`useFeedStore`), sorts by contributions, fetches `prices` and `fear-greed` APIs on mount, and renders `PostCard` plus `TopUsersCard`/`Trending tags`.
- **Gaps**: no real backend feed, funded/trending derived entirely from mock heuristics, market filters (Top Volume/DeFi/AI/Memes) are visual-only (state doesn’t affect data).
- **Fit vs noise**: core to “Intelligence Layer” vision, but needs real data providers, search API, and shared card layouts.

### Contributes (`src/pages/Contributes.tsx`)
- **Journey**: load list of contributes → see pool-enabled entries → click chart/buy actions when a contractPostId exists.
- **Logic**: `react-query` + `fetchContributes` (Axios → `/contributes` endpoint) + `ContributeCard`.
- **Gaps**: No detail view outside admin route, minimal metadata per contribute, assumes backend exists but not present in repo.
- **Fit**: Core for social funding, but requires confirmed API contract, validation, and error states.

### Wallet Page (`src/pages/WalletPage.tsx` & `src/components/wallet/*`)
- **Journey**: connect wallet (mock) → view balance header + stats + action buttons → open modal to deposit/withdraw/buy/send (all local simulations) → review token cards and transaction table.
- **Logic**: Zustand store seeds transactions/balances; actions mutate local state and append fake tx rows; no blockchain or backend IO.
- **Gaps**: No real wallet integration, modal actions never leave browser, no history sync, no approvals.
- **Fit**: Visual shell matches roadmap, but behavior is purely demo-grade; Phase 2 must connect to SafeAuth/smart contract flows.

### Games (`src/pages/Games.tsx`, `src/pages/games/*`, `src/lib/games/localStore.ts`)
- **Journey**: browse mini-game list → launch per-game route (NopChart, Flappy, Runner, Memory, Reaction) → scores tracked in `localStorage` → optional local admin page to ban/pause addresses.
- **Logic**: entirely client-side; `localStore` file handles best scores, earned NOP heuristics, and admin caps/bans via `localStorage`.
- **Gaps**: No Supabase/cloud sync, no anti-cheat, admin controls are local only.
- **Fit**: Feels experimental; keep if “Intelligence Layer” gamification is strategic, otherwise treat as peripheral.

### Admin (`src/pages/Admin.tsx`, `src/pages/admin/BurnPanel.tsx`, `src/pages/admin/ContributeDetail.tsx`, `src/pages/admin/GamesAdmin.tsx`)
- **Journey**: sign-in card (placeholder form) → burn control panel (expects env token) → admin contributes toggle (requires `useAuthStore` flag) → games admin (local-only).
- **Logic**: Access control = boolean in `localStorage` (`useAuthStore` uses hard-coded username/password). Burn panel POSTs to `/api/burn` with `VITE_ADMIN_TOKEN`.
- **Gaps**: No real auth, burn POST handler missing server-side, admin token exposed to all clients, games admin not persisted anywhere.
- **Fit**: Critical conceptually (ops tooling) but currently insecure/incomplete; must be redesigned with real auth/API before production.

### Burn / TokenBurn (`src/pages/Burn.tsx`, `src/components/TokenBurn.tsx`, `/api/burn.ts`)
- **Journey**: read description → view counter widget → optionally retry fetch.
- **Logic**: `TokenBurn` fetches `/api/burn`, uses fallback config JSON when Supabase fails, displays digits/series. Admin panel intends to push updates via POST + admin token.
- **Gaps**: Serverless handler lacks POST, so admin updates never persist. Burn totals stored manually, not on-chain.
- **Fit**: Core for proof-of-burn narrative; needs bi-directional API, auth, and blockchain verifiability.

### BoostedTasks (`src/components/tasks/BoostedTasks.tsx`, `src/components/tasks/TaskCard.tsx`, `src/components/side/BoostEventCard.tsx`)
- **Journey**: connect wallet/Supabase → tasks list shows ready/locked/claimed states → clicking “Claim reward” writes to Supabase or local storage fallback.
- **Logic**: Reads Supabase tables when configured, otherwise writes local markers (`window.localStorage`). `grantNop` just increments Zustand wallet balance.
- **Gaps**: Rewards not enforced server-side, local fallback lets anyone “claim” in demo. TaskCard conflict prevents UI rendering until resolved.
- **Fit**: Central to SocialFi rewards, but needs unified component and secure backend orchestration.

### TrendingUsers (`src/components/widgets/TrendingUsers.tsx`, `src/components/TopUsersCard.tsx`, `src/lib/leaderboard.ts`)
- **Journey**: widgets show top users, ranks, scores.
- **Logic**: `TrendingUsers` fetches mocks (`fetchTrendingUsers`), `TopUsersCard` queries Supabase leaderboard or fallback.
- **Gaps**: TrendingUsers never hits Supabase; TopUsersCard uses `any` and lacks skeleton/empty states for partial data.
- **Fit**: Supports intelligence narrative; unify data sources and type safety in Phase 2.

### CryptoNews (`src/components/CryptoNews.tsx`, `/api/crypto-news.ts`, `/src/lib/rss.ts`)
- **Journey**: widget fetches AI-curated news → fallback filler headlines if fetch fails → user can retry.
- **Logic**: Client calls `/api/crypto-news`; serverless function fetches RSS feeds (or custom env) and caches for 60s.
- **Gaps**: `src/lib/rss.ts` is unused legacy parser; duplication between API and unused helper.
- **Fit**: Important daily signal feed; ensure caching/ratelimiting and dedupe code paths.

## Security & Risk Points
1. **Hard-coded admin credentials on client** – `src/lib/store.ts` lines 6–71 define `ADMIN_USERNAME = "admin"` / `ADMIN_PASSWORD = "adminadmin"` and rely on `localStorage` to toggle `isAdmin`. Anyone with devtools can set `nop_admin_session` to gain admin UI access.
2. **Public admin token** – `src/pages/admin/BurnPanel.tsx` lines 68–95 read `PUBLIC_ENV.adminToken` (a `VITE_` variable) and send it in an `Authorization` header; because it’s a public env var, every user can extract it and spoof burn updates once the POST API exists.
3. **Burn API lacks POST handler** – `/api/burn.ts` exposes read-only data. Admin panel POSTs to `/api/burn` will always fail, pushing ops to seek alternative (possibly insecure) channels.
4. **Rewards/state mutations entirely client-side** – `src/components/tasks/BoostedTasks.tsx` and `src/components/side/BoostEventCard.tsx` mark claims in local storage and call `grantNop`, so malicious users can “farm” NOP by editing local state.
5. **Games & wallet “admin” controls stored in localStorage** – `src/lib/games/localStore.ts` and `src/lib/store.ts` allow arbitrary cap/bans and wallet balances without validation, inviting confusion when syncing real data later.

## Performance & Quality Concerns
1. **TaskCard conflict prevents tree-shaking** – bundler aborts before optimizing; once resolved, verify component isn’t duplicated (currently renders twice).
2. **`PostComposer` re-renders large preview grids** – no memoization for previews or hashtag lists; typing triggers expensive layout thrash. Splitting into smaller components/hooks will help.
3. **`FeedList` concatenates `userPosts` with every render** – `[...userPosts, ...remotePosts]` plus `posts.map` without keys referencing backend IDs risks re-render storms once real pagination exists.
4. **`AIMarketBar` spins simultaneous fetches (signals + sentiment) on mount** – each uses `fetch` + `AbortController`, but controllers reset on every attempt. Consolidating into `react-query` with caching will prevent duplicate requests.
5. **Wallet tables render full transaction history** – `TxTable` prints every entry with `formatDistanceToNowStrict`, which recalculates on each render. For long histories this becomes costly; memoize or virtualize rows.

## Potential Dead Code / Unused Parts
- `src/components/PostBox.tsx`, `src/components/PostList.tsx`, `src/components/SmartButton.tsx` – legacy Supabase posting UI not referenced anywhere.
- `src/components/widgets/EventsBoost.tsx` – unused variant of boosted tasks card.
- `src/lib/rss.ts` – standalone RSS parser no longer imported (API handler has its own logic).
- `src/lib/tasks.ts` – task detection/claim helpers are never invoked; if kept, tie into BoostedTasks or remove.

## Recommended Priorities for Phase 2
1. **Resolve blocking merge conflict** in `src/components/tasks/TaskCard.tsx` and restore a single, typed TaskCard implementation.
2. **Define a consistent layout system** – move `LeftRail`/sidebar decisions into `AppShell`, extract shared card primitives, and remove inline color styles in header/wallet/games.
3. **Harden admin & reward flows** – replace `useAuthStore` credentials with real Supabase/SafeAuth, hide admin tokens server-side, and implement `/api/burn` POST (service role) with verification.
4. **Centralize data fetching** – create typed services/hooks for feed, market, burn, tasks so components stop using ad-hoc `fetch`/Axios calls and can share caching/error handling.
5. **Decide on core vs experimental features** – if games/local admin are non-goals for Phase 2, quarantine them to avoid dragging dependencies; otherwise, plan backend support.
6. **Replace mock data with real endpoints** – especially for Explore, TrendingUsers, Wallet, BoostedTasks to align with “Intelligence Layer” value props.
7. **Address lint infra** – add an explicit `typecheck` npm script, convert `tailwind.config.ts` plugin import to ESM, and fix `any` + interface warnings so CI can pass once TaskCard is fixed.

These steps will unblock future UX redesigns while ensuring data integrity and security ahead of Phase 2 implementation.
