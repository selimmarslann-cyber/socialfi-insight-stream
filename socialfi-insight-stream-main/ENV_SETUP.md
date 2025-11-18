## Overview

This project runs on **Vite + React**, so every frontend environment variable must use the `VITE_` prefix. Backend/serverless functions (Netlify/Vercel Edge, Supabase cron, etc.) read from standard Node env keys without the prefix. Use this guide together with `.env.example` to configure Supabase, news feeds, and the rule-based AI utilities.

---

## 1. Required environment variables

| Scope | Key | Purpose |
| --- | --- | --- |
| Frontend (public) | `VITE_SUPABASE_URL` | Supabase project URL (Project Settings → API → Project URL) |
| Frontend (public) | `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (Project Settings → API → `anon` key) |
| Frontend (public) | `VITE_NEWS_RSS` | _(Optional)_ Comma-separated RSS feeds (falls back to Decrypt, Cointelegraph, CoinDesk) |
| Frontend (public) | `VITE_API_BASE` | Optional override for HTTP client base URL (defaults to `/api`) |
| Frontend (public) | `VITE_ADMIN_TOKEN` | Token used by the internal burn admin panel to call `/api/burn` |
| Server-only | `SUPABASE_URL` | Supabase project URL for API routes/Edge functions |
| Server-only | `SUPABASE_SERVICE_ROLE` | Supabase service-role key for serverless functions that need write access |
| Server-only | `ADMIN_TOKEN` | Must match `VITE_ADMIN_TOKEN`; used by the burn admin authorization |

> Tip: copy `.env.example` to `.env` (local dev) or `.env.local` (if you prefer) and fill these values. Never commit real secrets.

---

## 2. Supabase configuration

1. Open **Supabase Dashboard → Your project → Project Settings → API**.
2. Copy the **Project URL** into both `VITE_SUPABASE_URL` (frontend) and `SUPABASE_URL` (serverless).
3. Copy the **anon public key** into `VITE_SUPABASE_ANON_KEY`.
4. Copy the **service role key** into `SUPABASE_SERVICE_ROLE` (server-only, never expose to the browser).
5. Optional: keep `VITE_ADMIN_TOKEN`/`ADMIN_TOKEN` in a password manager; use any strong random string.

The UI checks these variables via `src/config/env.ts`. When a value is missing, cards such as **Boosted Tasks** and **Crypto News** will show the helper message instead of throwing runtime errors.

---

## 3. Crypto + AI data sources

### Crypto News API (serverless)

1. Optionally set `VITE_NEWS_RSS` to a comma-separated list of RSS feeds that expose featured images (e.g. Decrypt, Cointelegraph verticals, CoinDesk categories).
2. If the env var is omitted, `/api/crypto-news` automatically falls back to `https://decrypt.co/feed`, `https://cointelegraph.com/rss`, and CoinDesk's global markets feed.
3. The handler (`api/crypto-news.ts`) normalizes thumbnails, filters out entries without media, deduplicates, and caches the top three stories for 60 seconds so the UI renders instantly.

### AI Signals API

- Endpoint: `/api/ai-signals` (`api/ai-signals.ts`)
- Data source: CoinGecko `coins/markets` (no API key required)
- Logic: applies the rule-based engine from `src/lib/ai/ruleBasedEngine.ts` to determine signal/volatility/market-maker activity and returns 40–90 scores for BTC/ETH/SOL/AVAX every request (cached for 60s).

---

## 4. Deploying to Netlify / Vercel

### Local development

1. `cp .env.example .env`
2. Fill in all keys described above.
3. Run `npm run dev` (Vite automatically injects `VITE_*` keys).

### Netlify / Vercel

1. Open the project dashboard.
2. Go to **Site settings → Environment variables** (Netlify) or **Settings → Environment variables** (Vercel).
3. Add every key from the table exactly as spelled (respect the `VITE_` prefix for frontend values).
4. Re-deploy the site so that build-time environment variables are picked up.

> Production/staging parity: keep the same values across environments whenever possible to avoid Supabase auth/session mismatches.

---

## 5. Supabase schema update for AI signals

Add deterministic AI columns to the `posts` table so the rule-based engine can persist results. Run the SQL below in the Supabase SQL editor (adjust schema name if needed):

```sql
alter table public.posts
  add column if not exists ai_signal text,
  add column if not exists ai_volatility text,
  add column if not exists ai_mm_activity text,
  add column if not exists ai_score integer,
  add column if not exists ai_last_updated_at timestamptz;
```

The frontend (see `src/lib/ai/ruleBasedEngine.ts`) computes fallback values at read time, so UI widgets keep functioning even before the database is updated. Once these columns exist, you can persist `computeAIFromRules` outputs server-side for richer analytics or scheduled jobs.

---

## 6. Verification checklist

- [ ] `npm run dev` renders Boosted Tasks without “Supabase missing” warnings.
- [ ] Crypto News pulls three image-backed items (or shows the intentional warning if every RSS feed fails).
- [ ] `/api/burn` POST calls succeed when `VITE_ADMIN_TOKEN`/`ADMIN_TOKEN` match.
- [ ] The AI Market Bar and AI Insight Strip display computed signals (Bullish/Bearish/Neutral) without hitting any external LLM provider.

Once every item passes, commit the `.env.example` updates (never commit `.env`) and keep this document updated for future teammates.
