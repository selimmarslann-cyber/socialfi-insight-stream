# Supabase Setup

This repository now uses a single canonical SQL file for everything Supabase-related. Follow the steps below once per project/environment.

## 1. Grab credentials & configure env vars

1. Create (or open) your Supabase project.
2. Copy the **Project URL**, **anon key**, and **service role key**.
3. Add these to your deployment environments (Vercel/Netlify/local `.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` (same value as `VITE_SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Optional helpers already used by the app: `VITE_API_BASE` (defaults to `/api`), `VITE_ADMIN_TOKEN`, `VITE_NEWS_RSS` (comma-separated RSS feeds).

## 2. Apply the canonical schema + policies

1. Open **Supabase Dashboard → SQL Editor → New query**.
2. In your local repo, open `supabase/00_full_schema_and_policies.sql`.
3. Copy the entire file and paste it into the SQL editor.
4. Click **Run**. The script will:
   - Create/normalize every table (profiles, posts, boosted tasks, rewards, games, news cache, burn widgets, etc.).
   - Enable RLS with the correct policies.
   - Install helper triggers/functions (new user profile creation, score resetters, timestamp touch helpers).

You can re-run the file safely; it only adds missing objects.

## 3. Storage & auth tweaks

1. **Storage → Buckets**: create a bucket named `posts`, mark it as public (used for image uploads).
2. **Authentication → Providers**: enable the providers you need (email/password is enough for the current UI; wallet/social can remain optional).
3. If you plan to let admins edit data from the UI, mark their `profiles.is_admin` flag to `true` via SQL or Table Editor.

## 4. Optional seeding

- To pre-populate boosted tasks:

  ```sql
  insert into public.boosted_tasks (code, title, description, reward_nop, order_index)
  values
    ('signup', 'Üye ol', 'Kaydol ve profilini oluştur.', 2000, 0),
    ('deposit', 'Deposit NOP / Cüzdan bağla', 'Cüzdanı bağla veya NOP yatır.', 5000, 1),
    ('contribute', 'Katkı yap (post)', 'İlk katkını paylaş.', 3000, 2)
  on conflict (code) do nothing;
  ```

- For burn stats/news cache, you can insert sample rows via the Table Editor so widgets don’t show “loading” on first run.

## 5. Verify from the app

1. `pnpm install` (or `npm install`), then `pnpm dev` to run Vite locally.
2. Ensure the widgets (Boosted Tasks, Token Burn, Top Users, Contact form) no longer display “Supabase yapılandırılmadı.” errors.
3. If you deploy to Vercel/Netlify, copy the same env vars there; no further code changes are needed.

That’s it—once the SQL ran successfully and the env vars are set, Supabase will stay in sync with the repo.
