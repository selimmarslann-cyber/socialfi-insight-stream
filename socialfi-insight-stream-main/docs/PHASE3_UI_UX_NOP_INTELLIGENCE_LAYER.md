# Phase 3 · UI/UX Revamp — NOP Intelligence Layer

## 1. Design System Overview
- **Color + surfaces:** Centralized in `src/theme/design-tokens.ts` and mirrored as CSS variables in `src/styles/design-tokens.css`. Light/dark tokens now power Tailwind via `tailwind.config.ts` (`colors.surface`, `colors.brand`, `colors.text`, `colors.intent`).
- **Radii, spacing, shadows:** Shared values (card/input/button radii, page/section spacing, elevated vs subtle shadows) map directly to Tailwind utilities (`rounded-card`, `shadow-card-elevated`, `p-page` aliases).
- **Typography scale:** Tokenized utility classes (`text-ds-h1`, etc.) ensure consistent heading and label treatments; global headings now track clamps defined in the token file.
- **Visual primitives:** `DashboardCard` and `DashboardSectionTitle` standardize card padding, background, border, and section headings. `MarketMicroChart` is the new micro data viz primitive for calm sparklines.

## 2. Layout + Navigation
- **AppShell:** Always renders a three-column grid (LeftRail / main `<Outlet />` / right widgets) with consistent gutters and max-width. Left rail shows nav + network pulse; right rail stacks Trending Users, Crypto News, Token Burn, Boosted Tasks.
- **Header:** Simplified gradient-free header with the new `NopHeaderCounter`, themed search, and refined toggles/wallet controls. No inline color-mix hacks remain.
- **SidebarNav:** Rebuilt with Tailwind tokens—rounded chip icons, focus-visible states, admin badge, and clean active/hover treatment.

## 3. Page Walkthroughs
### Home / Index (`src/pages/Index.tsx`)
- Hero `DashboardCard` introduces the AI scanner with live `MarketMicroChart` sparklines sourced from `/api/prices`.
- Grid pairs `AIMarketBar` with `TopUsersCard` for immediate intelligence snippets.
- PostComposer + Feed now sit inside structured sections with `DashboardSectionTitle` headings, creating breathing room between compose, feed, and right-rail widgets.

### Explore (`src/pages/Explore.tsx`)
- Search + segmented filters live inside a single `DashboardCard`, replacing ad-hoc tabs.
- Community posts render inside their own card; right column houses Top Gainers + Trending Tags cards.
- Filter buttons adopt the shared rounded-pill style and respond instantly while stats stay visible.

### Contributes (`src/pages/Contributes.tsx` + `ContributeCard`)
- Page intro card explains the pool section with consistent typography.
- Each contribute uses `DashboardCard` with status chip, placeholder stats chips, and dual CTA buttons (“Chart”, “Buy”). Future metadata (TVL, participants) can drop into the existing chip row.

### Wallet (`src/pages/WalletPage.tsx`)
- Logged-out state shows a connect card; logged-in view arranges hero (`BalanceHeader`), action strip, token grid, and transaction history using sections + dashboard cards.
- Action bar and token cards keep their rich visuals but now sit inside a predictable rhythm with section labels.
- Transactions table is wrapped by a card with updated timestamp badge matching the design language.

### Boosted Tasks (`src/components/tasks/BoostedTasks.tsx` + `TaskCard.tsx`)
- Entire module lives in a DashboardCard with onboarding label, progress count, and calm notice/skeleton states.
- `TaskCard` redesign: icon chips, gradient ready button, muted locked pill, claimed check chip, and reward pill use shared tones.

### Right Column Widgets
- **Trending Users:** Uses dashboard card, compact rows, rank chip, and score pill with trend icon.
- **Crypto News:** Each article is a rounded mini-card with thumbnail, title, and relative time; loading/error states conform to token colors.
- **Token Burn:** Recast into a single card with `DashboardSectionTitle` and tighter digit presentation.

## 4. Remaining Intentional TODOs
- **Deeper theming hooks:** Convert `PostComposer`, `PostCard`, and remaining legacy cards to `DashboardCard` once the feed redesign kicks in (Phase 3b).
- **Dynamic rail content:** Current AppShell renders default right-rail widgets; future work should expose hooks so individual routes can swap/augment rail content.
- **Advanced wallet metrics:** Placeholder chips in `ContributeCard` and the wallet stats block await real TVL / APY / on-chain metrics scheduled for Phase 4.
- **Dark-mode polish:** Most components inherit dark tokens, but bespoke gradients (BalanceHeader) still need a dark-specific art pass.
- **Charts unification:** `MarketMicroChart` covers micro sparklines; larger chart components should migrate to the same token-driven palette when analytics expands.

This document serves as the foundation for Phase 4 (on-chain protocol features: positions, reputation, fee/burn integration, intelligence feed extensions). Each section above maps to concrete code owners and can be referenced in follow-up issues.
