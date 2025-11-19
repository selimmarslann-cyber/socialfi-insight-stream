# Phase 3: Intelligence Layer

## Overview

Phase 3 transforms the NOP Intelligence Layer into a minimal, professional, Binance-pitch-ready intelligence protocol. This phase introduces on-chain reputation scoring, aggregated intelligence feeds, and comprehensive analytics across the protocol.

## Core Components

### 1. Alpha Score System

**What is Alpha Score?**

Alpha Score is a reputation metric (0-100) that quantifies a user's trading performance and experience on the NOP protocol. It provides a transparent, auditable way to identify top operators and signal quality.

**How Alpha Score is Computed**

The Phase 3 Alpha Score formula is deterministic and simple:

```
base = 50 * winRate
roiComponent = 50 * clamp(avgRoi / 100, -1, 1)  // -50 to +50
stability = Math.log(closedPositions + 1) * 2    // small bonus
score = clamp(base + roiComponent + stability, 0, 100)
```

**Inputs:**
- `win_rate`: Percentage of closed positions with positive ROI
- `avg_roi`: Average ROI across all closed positions
- `closed_positions`: Number of positions that have been closed

**Labels:**
- **Rookie**: 0-30
- **Intermediate**: 30-60
- **Pro**: 60-85
- **Elite**: 85-100

**Data Sources:**
- On-chain positions logged to `onchain_positions` table
- Computed metrics stored in `alpha_metrics` table
- Recomputed lazily when profiles are viewed (stale after 1 hour)

### 2. Intelligence Feed

**What is the Intelligence Feed?**

A consolidated page (`/intelligence`) that aggregates:
- **Market Snapshot**: BTC/ETH prices, Fear & Greed index
- **NOP Ecosystem**: Total positions, contributes, users
- **Trending Contributes**: Top 5 weekly trending contributes by volume
- **Top Alpha Users**: Top 5 users by Alpha Score

**Data Assembly:**

1. **Market Data**: Fetched from `/api/prices` and `/api/fear-greed` endpoints
2. **NOP Summary**: Aggregated from Supabase tables (`onchain_positions`, `social_posts`, `social_profiles`)
3. **Trending Contributes**: Computed from `fetchWeeklyTrendingContributes()` (7-day volume + likes)
4. **Top Alpha Users**: Fetched from `alpha_metrics` table, ordered by `alpha_score` DESC

### 3. Pool Analytics

**What are Pool Analytics?**

For each contribute with an on-chain pool, we display:
- **Participants**: Unique wallet count
- **Total Positions**: Number of BUY/SELL positions
- **Last Activity**: Time since most recent position

**Implementation:**

- Data aggregated from `onchain_positions` table
- Grouped by `contribute_id` or `pool_address`
- Displayed in `ContributeCard` component as a "Pool Stats" section
- Updates in real-time as positions are logged

### 4. Profile Enhancements

**Alpha Score Card:**
- Large numeric score (0-100)
- Label badge (Rookie/Intermediate/Pro/Elite)
- Quick stats: Total positions, Win rate, Best ROI

**Top Positions:**
- List of recent positions (limit 5-10)
- Shows: Side (BUY/SELL), Amount, Date, ROI (if closed)
- Empty state message for users with no positions

### 5. Admin Ops Dashboard

**Protocol-Level Metrics:**
- Total Users
- Total Posts/Contributes
- Total On-chain Positions
- Total NOP Volume

**Alpha Leaderboard:**
- Top 10 users by Alpha Score
- Shows wallet address, position count, and score
- Read-only view (no destructive actions)

## Data Model

### Tables

**`onchain_positions`**
- Stores all BUY/SELL transactions
- Links to contributes via `contribute_id`
- Tracks: wallet, pool address, side, amount, tx_hash, timestamps, PnL/ROI

**`alpha_metrics`**
- Aggregated metrics per wallet
- Computed from `onchain_positions`
- Includes: total/closed positions, wins/losses, ROI stats, alpha_score

### RLS Policies

- **Read**: Public (all analytics are transparent)
- **Write**: Service role or authenticated users (positions logged on transaction)

## Technical Implementation

### Position Logging

When a user executes BUY/SELL:
1. Transaction is sent to contract
2. After `tx.wait()`, position is logged to `onchain_positions`
3. Alpha metrics are recomputed lazily (on profile view)

### Alpha Recompute

- Triggered when:
  - Profile page is viewed
  - Metrics are stale (>1 hour old)
  - Force recompute requested
- Computes: win rate, avg ROI, best/worst ROI, alpha_score
- Upserts into `alpha_metrics` table

### Intelligence Feed Aggregation

- Market data: Cached API responses (60s stale time)
- NOP summary: Direct Supabase queries
- Trending: Weekly volume + like counts
- Top Alpha: Ordered query from `alpha_metrics`

## Future Work (Phase 4+)

1. **Full Indexer**: On-chain event listener to automatically index all positions
2. **Multi-chain Support**: Extend to other EVM chains
3. **Advanced Metrics**: Sharpe ratio, drawdown, position sizing analysis
4. **Real-time Updates**: WebSocket subscriptions for live feed updates
5. **Scheduled Recompute**: Cron jobs or Edge Functions for periodic alpha updates
6. **Position Matching**: Link BUY/SELL pairs to compute accurate PnL
7. **Historical Charts**: Time-series visualization of alpha scores

## Constraints & Design Decisions

- **No Contract Changes**: Existing Sepolia contract remains unchanged
- **Simple & Deterministic**: Alpha formula is auditable and transparent
- **No Gamification**: Professional, technical tone (no casino vibes)
- **Lazy Computation**: Alpha recomputed on-demand, not continuously
- **Public Analytics**: All metrics are readable by anyone (transparency)

## Files Modified/Created

### Schema
- `supabase/00_full_schema_and_policies.sql`: Added `onchain_positions` and `alpha_metrics` tables

### Core Libraries
- `src/lib/positions.ts`: Position logging helpers
- `src/lib/alpha.ts`: Alpha score computation
- `src/lib/poolAnalytics.ts`: Pool analytics aggregation
- `src/lib/adminAnalytics.ts`: Admin dashboard metrics

### Components
- `src/components/profile/AlphaScoreCard.tsx`: Alpha score display
- `src/components/profile/TopPositions.tsx`: Position list
- `src/components/ContributeCard.tsx`: Added pool stats section

### Pages
- `src/pages/Intelligence.tsx`: Intelligence feed page
- `src/pages/ProfileMe.tsx`: Enhanced with Alpha card
- `src/pages/ProfilePublic.tsx`: Enhanced with Alpha card
- `src/pages/Admin.tsx`: Enhanced with Ops/Analytics dashboard

### Navigation
- `src/hooks/useSidebarNavItems.ts`: Added Intelligence link
- `src/App.tsx`: Added `/intelligence` route

## Documentation

This document serves as the technical specification for Phase 3. For pitch materials, see:
- `docs/NOP_INTELLIGENCE_LAYER_PITCH_OUTLINE.md`
- `docs/NOP_INTELLIGENCE_LAYER_LITEPAPER.md`

---

**Last Updated**: Phase 3 Implementation
**Status**: Complete
**Next Phase**: Protocol enhancements, multi-chain support, advanced analytics

