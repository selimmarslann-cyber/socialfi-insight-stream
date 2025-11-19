## Dark Mode Polish Summary

- Wallet stack (`ActionBar`, `TokenCard`, `TxTable`, dialogs) now uses token-driven surfaces, borders, and pills so cards, holdings, and tables remain consistent in dark mode without flashing white.
- Dashboard widgets (`BoostedTasks`, `TaskCard`, `AIMarketBar`, `AIInsightStrip`, `CryptoNews`, `BurnWidget`) received muted surfaces, badge updates, and skeleton tweaks for higher contrast and cohesive hover states.
- Pool/contribution flow (`PoolBuy`, `PoolSell`, `PoolOverview`, trade actions, register dialog, tokenomics tables) now inherits the shared palette for previews, alerts, and tables to match the rest of the app.
- Static docs/contact pages dropped hardcoded light palettes in favor of shared surfaces and typography tokens, preventing bright panels in dark mode.

### Helper Classes & Tokens

- Added `.surface-root`, `.surface-card`, `.surface-subtle`, `.border-subtle`, `.text-main`, `.text-muted` in `src/styles/design-tokens.css` so layout shells and micro-panels can reuse the same CSS variables across both themes.
- Extended existing Tailwind token usage (e.g., `bg-surface`, `text-text-secondary`, `border-border-subtle`) throughout components for predictable light/dark rendering.

### Known Limitations

- The experimental `NopChart` mini-game view still relies on bespoke light-only styling; it remains outside the main dashboard scope and will need a dedicated pass if it becomes user-facing.
