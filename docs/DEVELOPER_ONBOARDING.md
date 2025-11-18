# DEVELOPER ONBOARDING — NOP INTELLIGENCE LAYER

## 1. Prerequisites
- Node.js 18+ and npm 9+.
- Git, VSCode (or your editor of choice), and a modern browser.
- Optional: MetaMask (Sepolia) and a Supabase project if you want to run the full stack locally.

## 2. Clone & Install
```bash
git clone git@github.com:nop-intelligence-layer/app.git
cd app
npm install
```

## 3. Environment Variables
Create a `.env` file at the repo root and populate:
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_NOP_TOKEN_ADDRESS=<sepolia-address>
VITE_NOP_POOL_ADDRESS=<sepolia-address>
VITE_RPC_URL=<https-or-wss-rpc>
```
If you do not have Supabase credentials, the UI still runs but trade logging, social persistence, and admin metrics will show warnings.

## 4. Running the App
```bash
npm run dev
```
Visit `http://localhost:5173`. The dev server hot reloads React, Tailwind, and shadcn-ui components.

## 5. Code Structure
- `src/pages` — route-level components (Dashboard, Contributes, Wallet, Admin, etc.).
- `src/components` — reusable UI (PostCard, BoostedTasks, Wallet widgets, ComingSoonCard, etc.).
- `src/lib` — data utilities: Supabase client, pool interactions (`pool.ts`), social helpers (`social.ts`), reputation, theme, etc.
- `supabase/` — canonical schema. Apply via Supabase SQL editor before connecting the client.
- `docs/` — product docs, architecture notes, and onboarding guides (this file).

## 6. Social Feed Persistence
The feed now writes to Supabase tables:
- `social_posts` for wallet-authored posts.
- `social_comments`, `social_likes` for interactions.
- `social_profiles` for wallet metadata.
When you connect a wallet through the header, the client calls `ensureSocialProfile`. Posting requires a wallet because `createSocialPost` inserts with `wallet_address`. Likes and comments use the same address, and optimistic updates ensure the UI stays responsive.

## 7. On-Chain Interactions
`src/lib/pool.ts` wraps ethers v6. In dev:
1. Configure RPC + contract addresses in `.env`.
2. Use MetaMask (Sepolia) for approvals and trades.
3. Successful trades call `logTrade` to persist volume data.

## 8. Testing & Linting
- `npm run lint` — ESLint (JS/TS).
- `npm run build` — Vite production build.
Run both before sending pull requests to ensure we don’t regress CI.

## 9. Submitting Changes
1. Branch from the appropriate feature branch (e.g., `cursor/comprehensive-app...`).
2. Keep commits focused and reference relevant tickets.
3. Update docs (`docs/ARCHITECTURE...`, `docs/WHITEPAPER...`) if your change alters platform behavior.
4. Tag reviewers who own the impacted areas (frontend, protocol, AI).

## 10. Support
- Product questions: `#product` channel.
- Smart contract questions: `#protocol`.
- Incidents: log via `/support` in the app or ping ops in `#runbooks`.

Welcome to the NOP Intelligence Layer! Ship with care, keep signal high, and document every meaningful change.
