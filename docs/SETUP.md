# Setup Checklist

- [ ] Run `supabase_schema.sql` and `supabase_schema_news_burn.sql` via Supabase Dashboard → SQL Editor (already used for the existing features).
- [ ] **Run `supabase_games_schema.sql` in Supabase Dashboard → SQL Editor** to create the new `profiles`, `gaming_scores`, and `game_sessions` tables plus helper functions/policies.
- [ ] Configure the frontend `.env` with Supabase URL/anon key and enable `NEXT_PUBLIC_ENABLE_CLOUD_SCORES=true` in Netlify/Loveable environment variables so cloud score syncing works.
