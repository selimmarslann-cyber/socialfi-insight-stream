-- =====================================================================
--  NOP Intelligence Layer - RESET & RECREATE SCRIPT
--  ⚠️ DİKKAT: Bu script TÜM TABLOLARI SİLER ve YENİDEN OLUŞTURUR!
--  Sadece development/test ortamında kullanın!
-- =====================================================================

-- Önce tüm tabloları ve bağımlılıkları sil
DROP TABLE IF EXISTS public.copy_trades CASCADE;
DROP TABLE IF EXISTS public.shares CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.fee_distributions CASCADE;
DROP TABLE IF EXISTS public.creator_earnings CASCADE;
DROP TABLE IF EXISTS public.alpha_metrics CASCADE;
DROP TABLE IF EXISTS public.onchain_positions CASCADE;
DROP TABLE IF EXISTS public.reputation_scores CASCADE;
DROP TABLE IF EXISTS public.social_positions CASCADE;
DROP TABLE IF EXISTS public.game_sessions CASCADE;
DROP TABLE IF EXISTS public.gaming_scores CASCADE;
DROP TABLE IF EXISTS public.burn_stats CASCADE;
DROP TABLE IF EXISTS public.burn_widget CASCADE;
DROP TABLE IF EXISTS public.news_cache CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.nop_trades CASCADE;
DROP TABLE IF EXISTS public.investment_orders CASCADE;
DROP TABLE IF EXISTS public.investment_items CASCADE;
DROP TABLE IF EXISTS public.user_task_rewards CASCADE;
DROP TABLE IF EXISTS public.user_tasks CASCADE;
DROP TABLE IF EXISTS public.boosted_tasks CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.social_comments CASCADE;
DROP TABLE IF EXISTS public.social_posts CASCADE;
DROP TABLE IF EXISTS public.social_profiles CASCADE;
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.pool_positions CASCADE;
DROP TABLE IF EXISTS public.contributes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Fonksiyonları sil
DROP FUNCTION IF EXISTS public.reset_weekly_scores() CASCADE;
DROP FUNCTION IF EXISTS public.reset_daily_scores() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

-- Trigger'ları sil (tablolar silindiği için otomatik silinir ama yine de)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_timestamp_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_timestamp_social_profiles ON public.social_profiles;
DROP TRIGGER IF EXISTS set_timestamp_social_posts ON public.social_posts;
DROP TRIGGER IF EXISTS set_timestamp_boosted_tasks ON public.boosted_tasks;
DROP TRIGGER IF EXISTS set_timestamp_user_tasks ON public.user_tasks;
DROP TRIGGER IF EXISTS set_timestamp_user_task_rewards ON public.user_task_rewards;
DROP TRIGGER IF EXISTS set_timestamp_gaming_scores ON public.gaming_scores;
DROP TRIGGER IF EXISTS set_timestamp_contributes ON public.contributes;
DROP TRIGGER IF EXISTS set_timestamp_pool_positions ON public.pool_positions;

-- Extensions (bunları silmeyin, sadece oluşturun)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Şimdi ana schema dosyasını çalıştırın:
-- supabase/00_full_schema_and_policies.sql dosyasını bu script'ten sonra çalıştırın

