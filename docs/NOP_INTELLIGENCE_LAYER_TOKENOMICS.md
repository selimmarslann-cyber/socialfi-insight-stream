---
title: "NOP Intelligence Layer — Tokenomics"
version: "v1.0"
---

## 1. Token Overview

| Item | Detail |
| --- | --- |
| Token name | NOP (Ticker: NOP) |
| Network | Layer-2 EVM (placeholder until final deployment announcement) |
| Contract | `0xNOP...` (existing deployed contract, no re-issuance in Phase 5) |
| Decimals | 18 |
| Max supply | 1,000,000,000 NOP (placeholder — confirm during listing) |
| Circulating supply | 420,000,000 NOP (est., subject to audit) |

> Note: Exact numbers will be confirmed with the latest on-chain snapshot before any listing. The structure below remains accurate regardless of final supply adjustments.

## 2. Utility within NOP Intelligence Layer

- **Social Positions:** All protocol stats denominate notional and PnL in NOP, enabling apples-to-apples comparisons across markets.
- **Reputation Boosters (future):** Staking NOP will allow operators to amplify signal reach, unlock fee rebates, or guarantee inclusion in curated feeds, subject to minimum Alpha Score thresholds.
- **Protocol Fees:** Modeled as 1% of position notional. Fees may be accounted for in USD, then swapped to NOP during periodic settlements.
- **Boosted Tasks & Campaigns:** NOP payouts incentivize onboarding steps (connect wallet, complete KYC, register first position) and community contributions (bug bounties, liquidity programs).

## 3. Protocol Fee Model

- **Fee rate:** 1% of position notional (configurable per market or by direction).
- **Split:** 50% burn · 25% treasury · 25% rewards pool.

### Example

| Position Notional | Protocol Fee (1%) | Burn (50%) | Treasury (25%) | Rewards (25%) |
| --- | --- | --- | --- | --- |
| $1,000 | $10 | $5 | $2.50 | $2.50 |
| $25,000 | $250 | $125 | $62.50 | $62.50 |
| $250,000 | $2,500 | $1,250 | $625 | $625 |

Burn and treasury transactions are published in the Token Burn widget and weekly ops summary. Rewards allocations are configured through Boosted Tasks and campaign tools to maintain transparency on where payouts originate.

## 4. Emission & Rewards Logic (App Layer)

- No new NOP is minted inside the app. All rewards originate from:
  - Treasury tranches allocated during fundraising.
  - Protocol-controlled wallets that accumulate fees.
  - Strategic partner grants earmarked for onboarding.
- Boosted Tasks are rate-limited with per-user and per-campaign caps to avoid extraction.
- Rewards multipliers require verifiable actions (connect wallet, register tx hash, close position) that directly grow the protocol.

## 5. Sustainability Considerations

- **Activity-backed fees:** Revenue scales with actual trading volume rather than vanity metrics or inflating emissions.
- **Deflationary pressure:** Automatic burns consume 50% of every fee, aligning long-term holders with platform usage.
- **Capital-efficient rewards:** Treasury and rewards budgets are denominated in real fees collected, not unsustainable inflation.
- **Risk controls:** The protocol can throttle incentives, adjust fee splits, or pause campaigns without touching custody of user funds.

This structure is designed to satisfy exchange listing diligence: clear supply, transparent sinks, and fees derived from verifiable user activity.
