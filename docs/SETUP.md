# Setup Checklist

- [ ] Run `supabase_schema.sql` and `supabase_schema_news_burn.sql` via Supabase Dashboard → SQL Editor (already used for the existing features).
- [ ] **Run `supabase_games_schema.sql` in Supabase Dashboard → SQL Editor** to create the new `profiles`, `gaming_scores`, and `game_sessions` tables plus helper functions/policies.
- [ ] Configure the frontend `.env` with `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` plus `NEXT_PUBLIC_NEWS_RSS`, `NEXT_PUBLIC_API_BASE_URL`, and `NEWS_API_KEY`. The Vite config now exposes `NEXT_PUBLIC_*`, so no more duplicate `VITE_` entries are required.
- [ ] **ENV parity:** Production (Netlify/Vercel) ve Preview ortamlarında aynı isimlerle değişkenleri tanımlayın (`NEXT_PUBLIC_*` + `SUPABASE_SERVICE_ROLE_KEY`). Değişiklikten sonra yeniden deploy alın ki build yeni değerleri görsün.
- [ ] Supabase → Authentication → URL Configuration ekranında `https://<netlify-domain>` ve `https://<loveable-domain>` adreslerini Redirect URLs listesine ekleyin; aksi halde oturum açma işlemleri başarısız olur.
- [ ] Deployment öncesi, hem Netlify hem Loveable ortam değişkenlerini çift kontrol edin; eksik olması durumunda uygulama Supabase bağlantısını devre dışı bırakır ve ilgili bileşenler kullanıcıya uyarı gösterir.
