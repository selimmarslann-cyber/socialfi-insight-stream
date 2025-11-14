## Overview

This project runs on **Vite + React**, so every frontend environment variable must use the `VITE_` prefix. Backend/serverless functions (Netlify/Vercel Edge, Supabase cron, etc.) read from standard Node env keys without the prefix. Use this guide together with `.env.example` to configure Supabase, news feeds, and the rule-based AI utilities.

---

## 1. Required environment variables

| Scope | Key | Purpose |
| --- | --- | --- |
| Frontend (public) | `VITE_SUPABASE_URL` | Supabase project URL (Project Settings → API → Project URL) |
| Frontend (public) | `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (Project Settings → API → `anon` key) |
| Frontend (public) | `VITE_NEWS_RSS` | Comma-separated RSS feed list for the Crypto News card |
| Frontend (public) | `VITE_API_BASE` | Optional override for HTTP client base URL (defaults to `/api`) |
| Frontend (public) | `VITE_ADMIN_TOKEN` | Token used by the internal burn admin panel to call `/api/burn` |
| Server-only | `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` but scoped to backend functions (optional if identical) |
| Server-only | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key for Netlify functions that need write access |
| Server-only | `ADMIN_TOKEN` | Must match `VITE_ADMIN_TOKEN`; used by Netlify burn function authorization |
| Server-only | `CRYPTOPANIC_API_KEY` | API token for CryptoPanic RSS enrichment |

> Tip: copy `.env.example` to `.env` (local dev) or `.env.local` (if you prefer) and fill these values. Never commit real secrets.

---

## 2. Supabase configuration

1. Open **Supabase Dashboard → Your project → Project Settings → API**.
2. Copy the **Project URL** into both `VITE_SUPABASE_URL` and (server) `SUPABASE_URL`.
3. Copy the **anon public key** into `VITE_SUPABASE_ANON_KEY`.
4. Copy the **service role key** into `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to the browser).
5. Optional: keep `VITE_ADMIN_TOKEN`/`ADMIN_TOKEN` in a password manager; use any strong random string.

The UI checks these variables via `src/config/env.ts`. When a value is missing, cards such as **Boosted Tasks** and **Crypto News** will show the helper message instead of throwing runtime errors.

---

## 3. Crypto + AI data sources

### RSS feeds

Populate `VITE_NEWS_RSS` with a CSV list. Example:

```
VITE_NEWS_RSS="https://cryptopanic.com/feed/rss/,https://www.coindesk.com/arc/outboundfeeds/rss/,https://cointelegraph.com/rss"
```

The Crypto News card will automatically parse the list. Missing values surface the `newsEnvHint` warning.

### CryptoPanic API

1. Create an account at [cryptopanic.com/developers/api/](https://cryptopanic.com/developers/api/).
2. Generate an API token and store it as `CRYPTOPANIC_API_KEY` (server).
3. Netlify function `src/api/news.ts` will enrich RSS headlines only when this token exists; otherwise it gracefully falls back to pure RSS.

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
- [ ] Crypto News pulls data (or shows the intentional RSS warning if `VITE_NEWS_RSS` is blank).
- [ ] `/api/burn` POST calls succeed when `VITE_ADMIN_TOKEN`/`ADMIN_TOKEN` match.
- [ ] The AI Market Bar and AI Insight Strip display computed signals (Bullish/Bearish/Neutral) without hitting any external LLM provider.

Once every item passes, commit the `.env.example` updates (never commit `.env`) and keep this document updated for future teammates.
