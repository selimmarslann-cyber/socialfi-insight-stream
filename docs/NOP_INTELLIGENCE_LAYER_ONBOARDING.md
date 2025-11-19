---
title: "NOP Intelligence Layer — User Onboarding"
version: "v1.0"
---

## 1. Connect Your Wallet

1. Visit the NOP Intelligence Layer dashboard.
2. Click **Connect Wallet** (top-right). MetaMask, WalletConnect, and Coinbase Wallet are supported in Phase 5.
3. Approve the connection prompt. The app only requests read permissions to view your address and signature for login.

_Tip: Always double-check you are on the official domain and that your wallet network matches the currently supported L2._

## 2. Complete Boosted Tasks & Claim NOP

- Navigate to the **Boosted Tasks** widget on the right rail.
- Tasks include onboarding steps (connect wallet, register first position) and community actions (share thesis, invite operator).
- Each task lists the reward amount, requirements, and proof needed (e.g., tx hash, screenshot).
- Submit the required evidence directly inside the widget; rewards are paid in NOP from the curated rewards pool once validated.

## 3. Open a Social Position

1. Execute your trade in any supported DEX or CEX while keeping custody in your wallet.
2. Copy the transaction hash.
3. In the app, go to **Post Box → Register Position** (or dedicated module) and fill:
   - Asset pair and direction (long/short).
   - Notional size, leverage (optional), and thesis summary.
   - Paste the transaction hash for verification.
4. The protocol records the position in `social_positions` and begins tracking unrealized PnL.

## 4. Close & Track Reputation

- When you exit the trade, click **Close Position** and supply the closing tx hash or closing price.
- The system updates realized PnL and recomputes your **Alpha Score** using win rate, streak strength, and holding time.
- Higher scores increase your visibility in the intelligence feed and unlock better Boosted Tasks rewards.

## 5. Explore Intelligence Feed & Trending Users

- The **Intelligence Feed** card streams market data, high-reputation trades, and curated news in real time.
- The **Trending Users** widget highlights operators with rising Alpha Scores, categorized by strategy tags.
- Use filters to discover signals aligned with your risk profile or to benchmark your performance.

## 6. Safety Best Practices

- **Non-custodial:** The app never asks for private keys, seed phrases, or token approvals. If you see such a request, disconnect immediately.
- **Verification:** Only register positions with tx hashes you control. Attempting to spoof data leads to reputation penalties.
- **Device hygiene:** Keep firmware and wallets updated; consider hardware wallets for high-volume accounts.
- **Support:** Use the in-app Support page or official channels for help—avoid responding to unsolicited DMs.

Following these steps lets you contribute transparent alpha to the NOP Intelligence Layer, earn NOP for verifiable skill, and access the same docs that exchanges use to diligence the protocol.
