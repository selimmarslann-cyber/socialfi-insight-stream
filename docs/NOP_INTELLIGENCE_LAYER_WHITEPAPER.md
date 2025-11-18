---
title: "NOP Intelligence Layer — Whitepaper"
version: "v1.0"
status: "Phase 5 — Tokenomics & Narrative"
---

## 1. Executive Summary

Social alpha is trapped across feeds, group chats, and trading journals. Most signals are anecdotal, impossible to audit, and hard to convert into investable conviction. Copy-trading products replicate positions but do not preserve the social context or the operator’s historic reliability.

NOP Intelligence Layer delivers a SocialFi protocol where on-chain positions, verifiable trading history, and curated research flow into a single intelligence fabric. Operators open positions with their own wallets, register the transaction hash, and stream their intent into the network. Reputation scores, protocol fees, and a burn-powered supply sink translate social activity into measurable value.

At the application edge the Intelligence Feed surfaces correlated market data, high-reputation actors, and news that matters. At the protocol layer, social positions, reputation analytics, and fee accounting remain chain-agnostic so they can plug into CEX and DEX routes. This is the foundation required for a Binance-grade listing and partner integrations.

## 2. Architecture Overview

### 2.1 NOP Token

NOP already exists as a transferable ERC-20 style token on a low-fee L2 (chain placeholder). It remains tradable on both DEX and CEX venues. The app does not issue a new token in this phase; it integrates the existing asset into protocol economics, fee accounting, and rewards.

### 2.2 Social Positions Layer

Each meaningful trade is captured via the `social_positions` table and linked to the originating transaction hash. Users sign transactions with any supported wallet, execute the trade externally, and then submit the tx hash to the app. Metadata stored: notional size, direction, asset pair, leverage (optional), timestamps, and self-tagged theses. This creates a tamper-resistant social order book without pulling custody inside the app.

### 2.3 Reputation Layer

The `reputation_scores` table consolidates user-level KPIs: total positions, win rate, realized PnL, average holding time, volatility-adjusted returns, and recency weighting. Each new position or closure triggers a recalculation that produces a composite “Alpha Score.” Scores remain chain-agnostic so contributors can operate across multiple liquidity venues while maintaining a unified reputation.

### 2.4 Intelligence Layer

The intelligence-feed API blends:

- **Market data:** Real-time quotes and volatility from Dexscreener or equivalent aggregators.
- **Positions:** Newly registered social positions and their live PnL.
- **Reputation:** Leaders ranked by Alpha Score, surfaced with contextual badges (swing, trend, news).
- **News and research:** Curated headlines and AI summaries that explain catalysts.

This creates a continuous signal tape that partners can embed via widgets or API keys.

### 2.5 Frontend App

The React-based dashboard unifies:

- Wallet + portfolio monitoring with fee and burn visibility.
- Boosted Tasks for onboarding and campaign-based NOP rewards.
- Trending users, news, and intelligence feed modules.
- Token burn tracker and Docs hub so auditors can view methodology inside the product.

## 3. Protocol Mechanics

### 3.1 Opening a Social Position

1. User executes a trade for NOP (or another tracked asset) in their preferred wallet or DEX router.
2. They submit the transaction hash, position metadata, and optional thesis through the app.
3. The app records a new `social_positions` row, confirms timestamp, associates wallet, and estimates notional value using oracle or DEX price snapshots.
4. A 1% protocol fee is computed off-chain for analytics. Funds never leave the user’s wallet; fee accounting is modeled to prepare for future on-chain fee routing.

### 3.2 Closing a Social Position

1. The user marks the position as closed or submits the closing transaction hash.
2. The app pulls the closing price, calculates realized PnL, and updates the `social_positions` record.
3. Reputation metrics refresh automatically, including win-rate deltas and drawdown impact.

### 3.3 Reputation Score Calculation

Inputs:

- Total positions logged and their notional distribution.
- Win rate and cumulative realized PnL.
- Average holding time vs. strategy archetype.
- Recency weighting that favors the last 30 days.
- Sanity multipliers for streak volatility and leverage risk.

Output: a normalized 0–100 Alpha Score. Bad actors degrade rapidly when streak volatility spikes or when they fail to close positions transparently.

### 3.4 Intelligence Feed Composition

- **Market context:** Liquidity, volume, and price action for tracked pairs.
- **Top movers:** Positions opened/closed by accounts in the top decile of Alpha Score.
- **Narratives:** AI-tagged catalysts extracted from thesis notes and curated news.
- **Alerts:** Fee accruals, burns, and treasury updates surfaced to wallet dashboards.

## 4. Fee & Burn Model

- Standard fee assumption: **1% of notional per position** (configurable to open-side-only).
- Distribution: **50% burn**, **25% protocol treasury**, **25% rewards pool**.
- Current phase: fee is calculated off-chain, displayed in wallet summaries, burn widget, and the new tokenomics page. When liquidity routing is integrated, the same accounting hooks will trigger on-chain transfers.
- Burn transactions will be executed periodically by the protocol treasury wallet; each event is mirrored on the Token Burn component and archived in docs.
- The treasury portion finances indexer operations, audits, and future market-making. The rewards pool funds Boosted Tasks, contributor bounties, and onboarding grants.

## 5. Security & Non-Custodial Design

- Users never deposit funds into the app; they interact through their own wallets.
- The app records data (tx hashes, metadata) but never gains signing authority.
- Sensitive admin functions—fee configuration, burn execution, task payouts—are gated behind server-side checks today and will migrate to on-chain governance as soon as feasible.
- The protocol encourages verifiable transparency: every recorded action is traceable back to an on-chain transaction hash and user wallet.

## 6. Future Work

- **Automated PnL verification:** Plug into subgraphs or bespoke indexers so position PnL is validated against immutable trade data.
- **Multi-chain coverage:** Support parallel `social_positions` tables for major L2s and Solana via adapters.
- **Governance:** Staked NOP unlocks proposal rights, fee rebates, and access to premium intelligence channels.
- **Protocol-owned liquidity:** Use treasury allocations to seed liquidity bands that tighten spreads for NOP pairs and subsidize high-importance partner pools.

NOP Intelligence Layer stands ready for listings and integrations thanks to transparent accounting, non-custodial design, and a deflationary fee sink that rewards real trading skill.
