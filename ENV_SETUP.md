## Environment Setup

Follow these steps to keep Supabase + Crypto News integrations aligned across local dev, Preview builds, and Production.

### 1. Supabase credentials
- In Supabase Dashboard open **Project Settings → API**.
- Copy the **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`.
- Copy the **anon public key** into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Copy the **service_role key** into `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose it in client bundles).
- Add the same names to:
  - `.env.local` (for `npm run dev`)
  - Vercel / Netlify → *Project Settings → Environment Variables* for Production, Preview, and Development targets.
- After saving variables trigger a redeploy so Vite rebuilds with the new values.

### 2. API base URL
- `NEXT_PUBLIC_API_BASE_URL` defaults to `/api`. Override it if you proxy to another origin.

### 3. Crypto News feeds
- `NEXT_PUBLIC_NEWS_RSS` should be a comma-separated list of RSS endpoints (defaults provided).
- `NEXT_PUBLIC_NEWS_API_URL` is optional if you front a custom worker.
- `NEWS_API_KEY` powers the CryptoPanic REST call inside `src/api/news.ts`. Store it only in server-side environments.
- When these values are absent the UI shows a retry-able warning while logging the exact cause to the console.

### 4. Local development checklist
1. Duplicate `.env.example` → `.env.local` and fill the values above.
2. Run `npm install` (or `bun install`) and `npm run dev`.
3. Missing Supabase values are surfaced via `SupabaseConfigAlert` and console warnings so you can catch misconfigurations immediately.
4. TypeScript now understands every env name via `src/vite-env.d.ts`; a typo such as `NEXT_PUBLIC_SUPABASEURL` will surface a compile-time error.

### 5. Production / Preview checklist
- Keep the environment variable *names* identical between Production and Preview.
- After editing variables kick off a new deployment; hot reloading cannot pick up env changes in Vercel/Netlify.
- Netlify Functions (e.g., `netlify/functions/burn.ts`) still expect `ADMIN_TOKEN` when you need to POST burn stats.

### Summary of recent changes
- Unified env access through `readNewsConfig`, `readApiBaseUrl`, and the enhanced Supabase client so the app now reads `NEXT_PUBLIC_*` keys everywhere.
- Added defensive UI fallbacks (`SupabaseConfigAlert`) for Admin, Contact, Post List, Boosted Tasks, and burn widgets so they never crash when envs are missing.
- Hardened Crypto News fetching with clearer env errors, retry buttons, and console diagnostics.
- Updated `.env.example`, `README.md`, and `docs/SETUP.md` to document the exact variable names plus deployment guidance.
