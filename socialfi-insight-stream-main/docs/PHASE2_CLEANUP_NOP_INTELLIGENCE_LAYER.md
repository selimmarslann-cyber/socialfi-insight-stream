## Phase 2 Cleanup Summary

- Resolved the `TaskCard` merge conflict with a single, typed implementation that uses the shared `TaskState`, `TaskIconVariant`, and helper-driven action rendering for ready/locked/claimed states.
- Converted lingering CommonJS/Tailwind config `require` usage to ESM imports and cleaned the obvious `any` and empty-interface lint debt (command/ui primitives, chart tooltip, pool client, leaderboard consumers).
- Parked the entire games suite: routes/navigation links removed, all game/admin/localStore files now carry the experimental notice, and the modules remain available for future reactivation.
- Unified boosted-task surfaces around `tasks/BoostedTasks` + `TaskCard`; sidebar/widget variants are deprecated in-place so there is one canonical UI in LeftRail.
- Flagged legacy feed components (`PostBox`, `PostList`, `SmartButton`, `EventsBoost`) with deprecation banners so they are clearly out of the main PHASE 2 experience.
- Hardened the admin layer: `useAuthStore` no longer stores credentials, the `Admin` page and downstream routes explicitly state that access is disabled, and `BurnPanel` is now a mock-only UI that logs payloads instead of sending tokens from the client.

## Lint / Type / Build Status

| Command | Result | Notes |
| --- | --- | --- |
| `npx tsc --noEmit` | ✅ | No type errors |
| `npm run lint` | ⚠️ | Passes with pre-existing `react-refresh/only-export-components` warnings in shadcn primitives (badge, button, form, navigation-menu, sidebar, sonner, toggle). No new errors introduced. |
| `npm run build` | ✅ | Vite production build succeeds |

## Known Issues / Follow-ups

- Admin controls remain intentionally disabled; future PHASE 3 work must wire MPC/SafeAuth flows and server-side burn writers.
- Games suite is still present in the repo for reference but hidden from all routes/nav; re-enabling later will require reintegration with the redesigned UX.
- The shadcn component warnings above are inherited from upstream templates; we left them unchanged for now to avoid unnecessary churn.

## Ready for Phase 3

- **Boosted Tasks:** Single source of truth (`BoostedTasks` + `TaskCard`) with clean state handling, ready for protocol rewards integration.
- **Core Surfaces:** Feed, Explore, Wallet shell, Burn, Trending, and News now run without experimental clutter and are prepped for the upcoming redesign.
- **Admin Shell:** Preview-only UX clearly communicates that privileged actions are stubs, providing a safe shell to drop the secured ops channel into once protocol work lands.
