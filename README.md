# NIL PRO UI – Wallet · Explore · Composer Upgrade

This branch refreshes the SocialFi experience with a light corporate palette, a visual-first composer, and a professional wallet dashboard. Supabase Storage is now wired for media uploads, Explore prioritises funded ideas, and card surfaces adopt consistent gradients and soft shadows.

---

## Quickstart

```bash
# install dependencies
bun install        # or: npm install / npm ci

# run locally
bun run dev        # or: npm run dev
```

The app runs on Vite. Hot reload is available on <http://localhost:5173>.

---

## Production Build

```
bun install && bun run build
# or
npm ci && npm run build
```

- Output directory: `dist/`
- Netlify publish directory: `dist`

> Tip: keep `bun.lockb` or `package-lock.json` in sync with the tool you use.

---

## Environment Variables

See [`ENV_SETUP.md`](./ENV_SETUP.md) for the complete checklist. Minimum values required for local development:

```env
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
VITE_NEWS_RSS="https://cryptopanic.com/feed/rss/,https://www.coindesk.com/arc/outboundfeeds/rss/"
VITE_API_BASE=/api
```

Serverless functions additionally expect:

```env
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role>
ADMIN_TOKEN=<shared-admin-token>
CRYPTOPANIC_API_KEY=<cryptopanic-token>
```

Missing values trigger inline helper messages (Boosted Tasks, Token Burn, Crypto News) so the UI never crashes during demos.

---

## Included Sample Content

The mock feed ships with three ready-to-showcase posts (funded BTC thesis, zkSync yield map, NFT rotation play) and curated Unsplash imagery under open CC licensing. Use them for screenshots or demos after running `npm run dev`.

Wallet state seeds a few NOP / USDT balances and transactions so the new UI renders with data immediately.

---

## Deploy Notes

1. Set the environment variables above in Netlify.
2. Deploy from the PR branch `feat/ui-pro-upgrade-wallet-explore-composer`.
3. Publish `dist/` and share screenshots of Wallet, Explore (Funded tab), and the Composer for review.

Enjoy the refreshed NIL Pro interface! 🎯
