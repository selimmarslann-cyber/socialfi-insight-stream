# WHITEPAPER — NOP INTELLIGENCE LAYER

## 0. Abstract
The NOP Intelligence Layer is a SocialFi operating system that rewards verifiable intelligence instead of empty engagement. Contributors submit analyses, AI guardrails score every post, and on-chain burns keep incentives in check. This whitepaper outlines the motivation, architecture, protocol mechanics, reputation math, intelligence feed design, tokenomics, risk posture, and roadmap for the next phases.

## 1. Introduction & Motivation
Traditional signal groups and SocialFi experiments struggle with two extremes: noisy engagement farming or opaque, closed research circles. Traders, researchers, and ops teams need a space where signal is measurable, liquidity is transparent, and governance incentives remain aligned. The NOP Intelligence Layer combines:
- Wallet-native identities and superset social graphs.
- AI moderation that grades insights before they reach the main feed.
- On-chain pools (NOPSocialPool) that let the community stake conviction.
- A burn-and-reward flywheel to fight inflation and reward alignment.
We target contributors who want to prove alpha, teams who want to consume credible intelligence, and DAOs that need programmable incentive rails.

## 2. System Overview
The platform is split into four cooperating layers:
- **Social Layer**: Feed, Post Composer, boosted tasks, profile pages, and community modules built with React + Tailwind.
- **Protocol Layer**: Supabase hosts canonical social tables (profiles, posts, comments, likes), trade logs, and boosted tasks. Ethereum smart contracts (NOP token + NOPSocialPool) enforce staking and burns.
- **Data Layer**: Supabase Storage, cached RSS feeds, and AI considerations aggregated via `IntelligenceFeed` components. React Query wires data to the UI.
- **Intelligence Layer**: AI scoring engines evaluate each insight’s context, volatility, and historical alignment. Scores feed into the PostCard UI and Admin dashboards.

## 3. NOP Social Position Protocol
Each eligible contribution can spawn a pool. The flow:
1. Author publishes insight -> moderator toggles `poolEnabled`.
2. Users approve NOP and call `depositNOP(postId, amount)` or `withdrawNOP`.
3. Every trade emits a `logTrade` event stored in `nop_trades` with wallet, side, amount, and tx hash.
4. Reputation + analytics read from `nop_trades` to rank contributors and refine emissions.
The contract structure mirrors constant-sum bonding logic, though the current preview focuses on logging and access control. Future releases will expose quotes (preview buy/sell) and supply curves directly from the pool contract.

## 4. Reputation & Alpha Score
Wallet reputations derive from trade logs plus on-feed interactions. The alpha score formula balances trade frequency, volume, and directional edge:
\[
\text{alpha}(w) = \underbrace{\lambda_1 \cdot T_w}_{\text{consistency}} + \underbrace{\lambda_2 \cdot \log(1 + V_w)}_{\text{conviction}} + \underbrace{\lambda_3 \cdot \log(1 + |N_w|) \cdot \text{sign}(N_w)}_{\text{bias}}
\]
Where `T_w` is trade count, `V_w` total NOP volume, and `N_w` net volume (buys minus sells). In preview, \(\lambda_1 = 1, \lambda_2 = 2, \lambda_3 = 1\). Likes/comments from `post_likes` and `social_comments` will soon add social-weighted modifiers, but on-chain behavior remains the source of truth. Profiles aggregate:
- Total trades, volume, pool positions.
- Social posts (with likes/comments) for qualitative review.
- Alpha score plus percentile rank for governance gating.

## 5. Intelligence Feed
The Intelligence Feed stitches together:
- **AI summaries**: `AIInsightStrip` components display signal, volatility, and market-maker activity per post.
- **Market context**: `AIMarketBar` and `MarketMicroChart` show live instruments fetched through `/api/prices`.
- **News + protocol alerts**: Cached via `api/crypto-news`, displayed in `CryptoNews` and `TokenBurn`.
Signal quality improves as more trades log against each post. Example insight: “Post #142 historically preceded a +4% ETH move within 12 hours.” These patterns fuel Boosted Tasks, suggest new pools, and inform emissions adjustments.

## 6. Tokenomics & Fee Model
NOP powers emissions, burns, and governance. High-level distribution:
- **Community Incentives**: 40% allocated to boosted tasks, signal rewards, and council bounties.
- **Treasury & Ops**: 25% for audits, AI infrastructure, and liquidity partnerships.
- **Team & Advisors**: 20% with four-year vesting.
- **Strategic Partners**: 10% for exchanges, DAOs, and liquidity programs.
- **Burn Reserve**: 5% to bootstrap burn events.

Trades route through the NOPSocialPool. Fees split into `burn`, `treasury`, and `rewards` buckets. Example preview (subject to governance ratification):
\[
\text{Fee}_{trade} = \text{min}(1\%, \, \alpha_{\text{pool}}) \quad \text{with} \quad 60\% \rightarrow \text{burn},\, 25\% \rightarrow \text{treasury},\, 15\% \rightarrow \text{rewards}
\]
As execution volume grows, governance can tune fee caps and burn shares while keeping total emissions on a 36-month curve.

## 7. Security & Risk Considerations
- **Smart contracts**: Pools and burns remain on testnet until audits finish. Production rollout requires multi-sig guardians and timelocks.
- **Data integrity**: Supabase RLS ensures wallets only mutate their posts. Admin dashboards use server-side tokens and log every action.
- **AI safety**: Scoring engines run in isolated services. Offensive content is filtered before appearing in feed cards.
- **Attack surface**: Main risks include spam contributions, wash trading in pools, and compromised admin sessions. Mitigations include boosted-task verification, wallet allowlists for early pools, and preview-only admin shells until MPC is live.

## 8. Roadmap
- **Phase 1 – Core Feed (complete)**: Vite dashboard, AI scoring, Boosted Tasks, burn widget.
- **Phase 2 – Pools & Reputation (in progress)**: Social posts backed by Supabase, NOPSocialPool hooks, alpha leaderboard, admin shell.
- **Phase 3 – Governance & Observability**: Wallet-bound auth, MPC-admin burns, on-chain task boards, public API.
- **Phase 4 – Protocol Expansion**: Permissionless pool creation, contextual wallets, DAO-managed emissions.
- **Phase 5 – Ecosystem Integration**: External research marketplaces, multi-chain deployments, liquidity partnerships, and enterprise data rooms.

The whitepaper will evolve with each release cycle. Contributors should track the Git history and roadmap docs for the latest specs before implementing protocol changes.
