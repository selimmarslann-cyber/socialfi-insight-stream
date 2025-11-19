-- =====================================================================
--  NOP Intelligence Layer - Canonical Supabase schema & RLS policies
--  Run this file inside Supabase SQL editor to provision every table,
--  constraint, trigger and policy used by the app.
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Helper utilities
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  bio text,
  wallet_address text,
  nop_points numeric(20,2) not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_username on public.profiles (lower(username));
create index if not exists idx_profiles_wallet on public.profiles (lower(wallet_address));

alter table public.profiles
  add column if not exists wallet_address text,
  add column if not exists nop_points numeric(20,2) not null default 0,
  add column if not exists is_admin boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_timestamp_profiles on public.profiles;
create trigger set_timestamp_profiles
before update on public.profiles
for each row
execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fallback_username text;
begin
  fallback_username := coalesce(
    new.raw_user_meta_data ->> 'username',
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'nop_' || left(new.id::text, 8)
  );

  insert into public.profiles (id, username)
  values (new.id, nullif(fallback_username, ''))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
on public.profiles
for select
using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------
-- Admin helper function
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (
      select is_admin
      from public.profiles
      where id = (select auth.uid())
    ),
    false
  );
$$;

-- ---------------------------------------------------------------------
-- Posts & social primitives
-- ---------------------------------------------------------------------

create table if not exists public.posts (
  id bigserial primary key,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  media_url text,
  tags text[],
  is_investable boolean not null default false,
  invest_open boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.posts
  add column if not exists is_investable boolean not null default false,
  add column if not exists invest_open boolean not null default false,
  add column if not exists sentiment_score numeric,
  add column if not exists sentiment_label text,
  add column if not exists sentiment_confidence numeric,
  add column if not exists sentiment_updated_at timestamptz;

create index if not exists idx_posts_author_id on public.posts (author_id);

alter table public.posts enable row level security;

drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public"
on public.posts
for select
using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
on public.posts
for insert
with check ((select auth.uid()) = author_id);

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
on public.posts
for update
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own"
on public.posts
for delete
using ((select auth.uid()) = author_id);

create table if not exists public.comments (
  id bigserial primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

drop policy if exists "comments_select_public" on public.comments;
create policy "comments_select_public"
on public.comments
for select
using (true);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own"
on public.comments
for insert
with check ((select auth.uid()) = author_id);

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own"
on public.comments
for update
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
on public.comments
for delete
using ((select auth.uid()) = author_id);

create table if not exists public.ratings (
  id bigserial primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  rater_id uuid not null references auth.users(id) on delete cascade,
  score int not null check (score between 1 and 10),
  created_at timestamptz not null default now(),
  unique (post_id, rater_id)
);

alter table public.ratings enable row level security;

drop policy if exists "ratings_select_public" on public.ratings;
create policy "ratings_select_public"
on public.ratings
for select
using (true);

drop policy if exists "ratings_insert_own" on public.ratings;
create policy "ratings_insert_own"
on public.ratings
for insert
with check ((select auth.uid()) = rater_id);

drop policy if exists "ratings_update_own" on public.ratings;
create policy "ratings_update_own"
on public.ratings
for update
using ((select auth.uid()) = rater_id)
with check ((select auth.uid()) = rater_id);

-- ---------------------------------------------------------------------
-- Wallet-native social feed (wallet-authored profiles/posts)
-- ---------------------------------------------------------------------

create table if not exists public.social_profiles (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique not null,
  display_name text,
  handle text unique,
  avatar_url text,
  bio text,
  nop_id text unique,
  is_banned boolean not null default false,
  is_verified boolean not null default false,
  total_posts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_social_profiles_wallet on public.social_profiles (lower(wallet_address));
create unique index if not exists idx_social_profiles_handle on public.social_profiles (lower(handle)) where handle is not null;
create unique index if not exists idx_social_profiles_nop_id on public.social_profiles (lower(nop_id)) where nop_id is not null;
create index if not exists idx_social_profiles_banned on public.social_profiles (is_banned);

alter table public.social_profiles
  add column if not exists display_name text,
  add column if not exists handle text,
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists nop_id text,
  add column if not exists is_banned boolean not null default false,
  add column if not exists is_verified boolean not null default false,
  add column if not exists total_posts integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_timestamp_social_profiles on public.social_profiles;
create trigger set_timestamp_social_profiles
before update on public.social_profiles
for each row
execute procedure public.set_updated_at();

alter table public.social_profiles enable row level security;

drop policy if exists "social_profiles_select_public" on public.social_profiles;
create policy "social_profiles_select_public"
on public.social_profiles
for select
using (true);

drop policy if exists "social_profiles_insert_public" on public.social_profiles;
create policy "social_profiles_insert_public"
on public.social_profiles
for insert
with check (true);

drop policy if exists "social_profiles_update_public" on public.social_profiles;
create policy "social_profiles_update_public"
on public.social_profiles
for update
using (true)
with check (true);

create table if not exists public.social_posts (
  id bigserial primary key,
  wallet_address text not null,
  author_profile_id uuid references public.social_profiles(id) on delete set null,
  author_name text,
  author_avatar_url text,
  content text not null,
  media_urls text[],
  tags text[],
  pool_enabled boolean not null default false,
  contract_post_id bigint,
  is_hidden boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_social_posts_wallet on public.social_posts (lower(wallet_address));
create index if not exists idx_social_posts_created_at on public.social_posts (created_at desc);
create index if not exists idx_social_posts_author_profile on public.social_posts (author_profile_id);
create index if not exists idx_social_posts_hidden on public.social_posts (is_hidden) where is_hidden = true;
create index if not exists idx_social_posts_featured on public.social_posts (is_featured) where is_featured = true;

alter table public.social_posts
  add column if not exists author_profile_id uuid references public.social_profiles(id) on delete set null,
  add column if not exists is_hidden boolean not null default false,
  add column if not exists is_featured boolean not null default false,
  add column if not exists sentiment_score numeric,
  add column if not exists sentiment_label text,
  add column if not exists sentiment_confidence numeric,
  add column if not exists sentiment_updated_at timestamptz;

drop trigger if exists set_timestamp_social_posts on public.social_posts;
create trigger set_timestamp_social_posts
before update on public.social_posts
for each row
execute procedure public.set_updated_at();

alter table public.social_posts enable row level security;

drop policy if exists "social_posts_select_public" on public.social_posts;
create policy "social_posts_select_public"
on public.social_posts
for select
using (true);

drop policy if exists "social_posts_insert_public" on public.social_posts;
create policy "social_posts_insert_public"
on public.social_posts
for insert
with check (true);

drop policy if exists "social_posts_delete_admin" on public.social_posts;
create policy "social_posts_delete_admin"
on public.social_posts
for delete
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "social_posts_update_admin" on public.social_posts;
drop policy if exists "social_posts_update_public" on public.social_posts;
create policy "social_posts_update_public"
on public.social_posts
for update
using (true)
with check (true);

create table if not exists public.social_comments (
  id bigserial primary key,
  post_id bigint not null references public.social_posts(id) on delete cascade,
  wallet_address text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_social_comments_post on public.social_comments (post_id);
create index if not exists idx_social_comments_wallet on public.social_comments (lower(wallet_address));

alter table public.social_comments enable row level security;

drop policy if exists "social_comments_select_public" on public.social_comments;
create policy "social_comments_select_public"
on public.social_comments
for select
using (true);

drop policy if exists "social_comments_insert_public" on public.social_comments;
create policy "social_comments_insert_public"
on public.social_comments
for insert
with check (true);

drop policy if exists "social_comments_delete_public" on public.social_comments;
create policy "social_comments_delete_public"
on public.social_comments
for delete
using (true)
with check (true);

create table if not exists public.post_likes (
  id bigserial primary key,
  post_id bigint not null references public.social_posts(id) on delete cascade,
  profile_id uuid not null references public.social_profiles(id) on delete cascade,
  wallet_address text not null,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

create index if not exists idx_post_likes_wallet on public.post_likes (lower(wallet_address));
create index if not exists idx_post_likes_profile on public.post_likes (profile_id);

alter table public.post_likes enable row level security;

drop policy if exists "post_likes_select_public" on public.post_likes;
create policy "post_likes_select_public"
on public.post_likes
for select
using (true);

drop policy if exists "post_likes_insert_public" on public.post_likes;
create policy "post_likes_insert_public"
on public.post_likes
for insert
with check (true);

drop policy if exists "post_likes_delete_public" on public.post_likes;
create policy "post_likes_delete_public"
on public.post_likes
for delete
using (true)
with check (true);

-- ---------------------------------------------------------------------
-- Boosted tasks & rewards
-- ---------------------------------------------------------------------

create table if not exists public.boosted_tasks (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text,
  reward_nop numeric(20,2) not null default 0,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_timestamp_boosted_tasks on public.boosted_tasks;
create trigger set_timestamp_boosted_tasks
before update on public.boosted_tasks
for each row execute procedure public.set_updated_at();

alter table public.boosted_tasks enable row level security;

drop policy if exists "boosted_tasks_select_public" on public.boosted_tasks;
create policy "boosted_tasks_select_public"
on public.boosted_tasks
for select
using (true);

drop policy if exists "boosted_tasks_manage_admin" on public.boosted_tasks;
create policy "boosted_tasks_manage_admin"
on public.boosted_tasks
for all
using (public.is_admin() or (select auth.role()) = 'service_role')
with check (public.is_admin() or (select auth.role()) = 'service_role');

create table if not exists public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.boosted_tasks(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'completed', 'claimed')),
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, task_id)
);

drop trigger if exists set_timestamp_user_tasks on public.user_tasks;
create trigger set_timestamp_user_tasks
before update on public.user_tasks
for each row execute procedure public.set_updated_at();

alter table public.user_tasks enable row level security;

drop policy if exists "user_tasks_select_own" on public.user_tasks;
create policy "user_tasks_select_own"
on public.user_tasks
for select
using ((select auth.uid()) = user_id);

drop policy if exists "user_tasks_insert_own" on public.user_tasks;
create policy "user_tasks_insert_own"
on public.user_tasks
for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "user_tasks_update_own" on public.user_tasks;
create policy "user_tasks_update_own"
on public.user_tasks
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create table if not exists public.user_task_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_key text not null,
  reward_nop numeric(20,2) not null default 0,
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, task_key)
);

drop trigger if exists set_timestamp_user_task_rewards on public.user_task_rewards;
create trigger set_timestamp_user_task_rewards
before update on public.user_task_rewards
for each row execute procedure public.set_updated_at();

alter table public.user_task_rewards enable row level security;

drop policy if exists "user_task_rewards_select_own" on public.user_task_rewards;
create policy "user_task_rewards_select_own"
on public.user_task_rewards
for select
using ((select auth.uid()) = user_id);

drop policy if exists "user_task_rewards_insert_own" on public.user_task_rewards;
create policy "user_task_rewards_insert_own"
on public.user_task_rewards
for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "user_task_rewards_update_own" on public.user_task_rewards;
create policy "user_task_rewards_update_own"
on public.user_task_rewards
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- Investment marketplace primitives
-- ---------------------------------------------------------------------

create table if not exists public.investment_items (
  id bigserial primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  title text,
  min_buy numeric(38,8) not null default 0,
  created_at timestamptz not null default now(),
  unique (post_id)
);

alter table public.investment_items enable row level security;

drop policy if exists "investment_items_select_public" on public.investment_items;
create policy "investment_items_select_public"
on public.investment_items
for select
using (true);

drop policy if exists "investment_items_manage_admin" on public.investment_items;
create policy "investment_items_manage_admin"
on public.investment_items
for all
using (public.is_admin() or (select auth.role()) = 'service_role')
with check (public.is_admin() or (select auth.role()) = 'service_role');

create table if not exists public.investment_orders (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id bigint not null references public.posts(id) on delete cascade,
  type text not null default 'buy',
  amount_nop numeric(38,8) not null,
  tx_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_investment_orders_user on public.investment_orders (user_id);
create index if not exists idx_investment_orders_post on public.investment_orders (post_id);

alter table public.investment_orders enable row level security;

drop policy if exists "investment_orders_select_scope" on public.investment_orders;
create policy "investment_orders_select_scope"
on public.investment_orders
for select
using (
  (select auth.uid()) = user_id
  or public.is_admin()
  or (select auth.role()) = 'service_role'
);

drop policy if exists "investment_orders_insert_own" on public.investment_orders;
create policy "investment_orders_insert_own"
on public.investment_orders
for insert
with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- Trade logs / on-chain reputation
-- ---------------------------------------------------------------------

create table if not exists public.nop_trades (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  post_id bigint not null,
  side text not null check (side in ('buy','sell')),
  amount_nop numeric(38, 18) not null,
  tx_hash text not null,
  chain_id bigint not null default 11155111,
  executed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_nop_trades_wallet on public.nop_trades (wallet_address);
create index if not exists idx_nop_trades_post on public.nop_trades (post_id);
create index if not exists idx_nop_trades_executed_at on public.nop_trades (executed_at desc);
create index if not exists idx_nop_trades_side on public.nop_trades (side);

alter table public.nop_trades enable row level security;

drop policy if exists "nop_trades_select_public" on public.nop_trades;
create policy "nop_trades_select_public"
on public.nop_trades
for select
using (true);

drop policy if exists "nop_trades_insert_service" on public.nop_trades;
create policy "nop_trades_insert_service"
on public.nop_trades
for insert
with check ((select auth.role()) = 'service_role');

-- ---------------------------------------------------------------------
-- Contact form
-- ---------------------------------------------------------------------

create table if not exists public.contact_messages (
  id bigserial primary key,
  name text,
  email text,
  subject text,
  message text not null,
  created_at timestamptz not null default now(),
  reporter_id uuid references auth.users(id)
);

alter table public.contact_messages enable row level security;

drop policy if exists "contact_messages_insert_public" on public.contact_messages;
create policy "contact_messages_insert_public"
on public.contact_messages
for insert
with check (
  ((select auth.uid()) = reporter_id)
  or ((select auth.uid()) is null and reporter_id is null)
);

drop policy if exists "contact_messages_select_admin" on public.contact_messages;
create policy "contact_messages_select_admin"
on public.contact_messages
for select
using (public.is_admin() or (select auth.role()) = 'service_role');

-- ---------------------------------------------------------------------
-- News cache
-- ---------------------------------------------------------------------

create table if not exists public.news_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'rss',
  title text not null,
  url text not null,
  image_url text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_news_cache_url on public.news_cache (url);
create index if not exists idx_news_cache_published_at on public.news_cache (published_at desc);

alter table public.news_cache enable row level security;

drop policy if exists "news_cache_select_public" on public.news_cache;
create policy "news_cache_select_public"
on public.news_cache
for select
using (true);

drop policy if exists "news_cache_manage_admin" on public.news_cache;
create policy "news_cache_manage_admin"
on public.news_cache
for all
using (public.is_admin() or (select auth.role()) = 'service_role')
with check (public.is_admin() or (select auth.role()) = 'service_role');

-- ---------------------------------------------------------------------
-- Burn metrics
-- ---------------------------------------------------------------------

create table if not exists public.burn_widget (
  id int primary key default 1,
  total_burn numeric(38,8) not null default 0,
  last_update timestamptz not null default now()
);

insert into public.burn_widget (id, total_burn)
values (1, 0)
on conflict (id) do nothing;

alter table public.burn_widget enable row level security;

drop policy if exists "burn_widget_select_public" on public.burn_widget;
create policy "burn_widget_select_public"
on public.burn_widget
for select
using (true);

drop policy if exists "burn_widget_manage_admin" on public.burn_widget;
create policy "burn_widget_manage_admin"
on public.burn_widget
for update
using (public.is_admin() or (select auth.role()) = 'service_role')
with check (public.is_admin() or (select auth.role()) = 'service_role');

create table if not exists public.burn_stats (
  id int primary key,
  total numeric(38,8) not null default 0,
  last24h numeric(38,8) not null default 0,
  series_data jsonb,
  updated_at timestamptz not null default now(),
  total_burned numeric(38,8),
  last_24h numeric(38,8),
  series jsonb,
  history jsonb
);

alter table public.burn_stats
  add column if not exists total numeric(38,8) not null default 0,
  add column if not exists last24h numeric(38,8) not null default 0,
  add column if not exists series_data jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists total_burned numeric(38,8),
  add column if not exists last_24h numeric(38,8),
  add column if not exists series jsonb,
  add column if not exists history jsonb;

insert into public.burn_stats (id)
values (1)
on conflict (id) do nothing;

alter table public.burn_stats enable row level security;

drop policy if exists "burn_stats_select_public" on public.burn_stats;
create policy "burn_stats_select_public"
on public.burn_stats
for select
using (true);

drop policy if exists "burn_stats_manage_admin" on public.burn_stats;
create policy "burn_stats_manage_admin"
on public.burn_stats
for all
using (public.is_admin() or (select auth.role()) = 'service_role')
with check (public.is_admin() or (select auth.role()) = 'service_role');

-- ---------------------------------------------------------------------
-- Games / leaderboard
-- ---------------------------------------------------------------------

create table if not exists public.gaming_scores (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  total_score int not null default 0,
  daily_score int not null default 0,
  weekly_score int not null default 0,
  best_flappy int not null default 0,
  best_runner int not null default 0,
  best_memory int not null default 0,
  best_reaction int not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

drop trigger if exists set_timestamp_gaming_scores on public.gaming_scores;
create trigger set_timestamp_gaming_scores
before update on public.gaming_scores
for each row execute procedure public.set_updated_at();

alter table public.gaming_scores enable row level security;

drop policy if exists "gaming_scores_select_public" on public.gaming_scores;
create policy "gaming_scores_select_public"
on public.gaming_scores
for select
using (true);

drop policy if exists "gaming_scores_insert_own" on public.gaming_scores;
create policy "gaming_scores_insert_own"
on public.gaming_scores
for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "gaming_scores_update_own" on public.gaming_scores;
create policy "gaming_scores_update_own"
on public.gaming_scores
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "gaming_scores_admin_update" on public.gaming_scores;
create policy "gaming_scores_admin_update"
on public.gaming_scores
for update
using (public.is_admin() or (select auth.role()) = 'service_role')
with check (public.is_admin() or (select auth.role()) = 'service_role');

create or replace function public.reset_daily_scores()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.gaming_scores
  set daily_score = 0;
$$;

create or replace function public.reset_weekly_scores()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.gaming_scores
  set weekly_score = 0;
$$;

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  game text not null,
  score int not null default 0,
  duration_ms int,
  created_at timestamptz not null default now()
);

alter table public.game_sessions enable row level security;

drop policy if exists "game_sessions_select_scope" on public.game_sessions;
create policy "game_sessions_select_scope"
on public.game_sessions
for select
using (
  (select auth.uid()) = user_id
  or public.is_admin()
  or (select auth.role()) = 'service_role'
);

drop policy if exists "game_sessions_insert_own" on public.game_sessions;
create policy "game_sessions_insert_own"
on public.game_sessions
for insert
with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- Protocol social positions & reputation
-- ---------------------------------------------------------------------

create table if not exists public.social_positions (
  id uuid primary key default gen_random_uuid(),
  user_address text not null,
  contribute_id uuid,
  direction text not null check (direction in ('long', 'short')),
  size_nop numeric(36,18) not null,
  entry_price_usd numeric(24,8),
  exit_price_usd numeric(24,8),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  status text not null default 'open' check (status in ('open', 'closed', 'liquidated')),
  realized_pnl_usd numeric(24,8),
  tx_hash_open text not null,
  tx_hash_close text,
  chain_id integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_social_positions_user_address
  on public.social_positions (lower(user_address));

alter table public.social_positions enable row level security;

drop policy if exists "social_positions_select_public" on public.social_positions;
create policy "social_positions_select_public"
on public.social_positions
for select
using (true);

drop policy if exists "social_positions_insert_self" on public.social_positions;
create policy "social_positions_insert_self"
on public.social_positions
for insert
with check (
  (select auth.role()) = 'service_role'
  or (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.wallet_address is not null
        and lower(p.wallet_address) = lower(user_address)
    )
  )
);

drop policy if exists "social_positions_update_self" on public.social_positions;
create policy "social_positions_update_self"
on public.social_positions
for update
using (
  (select auth.role()) = 'service_role'
  or (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.wallet_address is not null
        and lower(p.wallet_address) = lower(user_address)
    )
  )
)
with check (
  (select auth.role()) = 'service_role'
  or (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.wallet_address is not null
        and lower(p.wallet_address) = lower(user_address)
    )
  )
);

create table if not exists public.reputation_scores (
  user_address text primary key,
  total_positions integer not null default 0,
  open_positions integer not null default 0,
  win_rate numeric(5,2),
  realized_pnl_usd numeric(24,8) not null default 0,
  avg_holding_hours numeric(12,4),
  last_active_at timestamptz,
  last_computed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_reputation_scores_realized_pnl
  on public.reputation_scores (realized_pnl_usd desc);

alter table public.reputation_scores enable row level security;

drop policy if exists "reputation_scores_select_public" on public.reputation_scores;
create policy "reputation_scores_select_public"
on public.reputation_scores
for select
using (true);

drop policy if exists "reputation_scores_manage_auth" on public.reputation_scores;
create policy "reputation_scores_manage_auth"
on public.reputation_scores
for all
using ((select auth.role()) = 'service_role' or (select auth.uid()) is not null)
with check ((select auth.role()) = 'service_role' or (select auth.uid()) is not null);

-- ---------------------------------------------------------------------
-- Phase 3: On-chain positions & Alpha metrics
-- ---------------------------------------------------------------------

create table if not exists public.onchain_positions (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  contribute_id uuid,
  pool_address text not null,
  side text not null check (side in ('BUY', 'SELL')),
  amount numeric(38, 18) not null,
  tx_hash text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  pnl numeric(24, 8),
  roi numeric(8, 4),
  created_at timestamptz not null default now()
);

create index if not exists idx_onchain_positions_wallet on public.onchain_positions (lower(wallet_address));
create index if not exists idx_onchain_positions_contribute on public.onchain_positions (contribute_id);
create index if not exists idx_onchain_positions_pool on public.onchain_positions (pool_address);
create index if not exists idx_onchain_positions_opened_at on public.onchain_positions (opened_at desc);
create index if not exists idx_onchain_positions_side on public.onchain_positions (side);

alter table public.onchain_positions enable row level security;

drop policy if exists "onchain_positions_select_public" on public.onchain_positions;
create policy "onchain_positions_select_public"
on public.onchain_positions
for select
using (true);

drop policy if exists "onchain_positions_insert_public" on public.onchain_positions;
create policy "onchain_positions_insert_public"
on public.onchain_positions
for insert
with check (true);

drop policy if exists "onchain_positions_update_service" on public.onchain_positions;
create policy "onchain_positions_update_service"
on public.onchain_positions
for update
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

create table if not exists public.alpha_metrics (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  total_positions integer not null default 0,
  closed_positions integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  avg_roi numeric(8, 4),
  best_roi numeric(8, 4),
  worst_roi numeric(8, 4),
  last_updated_at timestamptz not null default now(),
  alpha_score numeric(6, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_alpha_metrics_wallet on public.alpha_metrics (lower(wallet_address));
create index if not exists idx_alpha_metrics_score on public.alpha_metrics (alpha_score desc);

alter table public.alpha_metrics enable row level security;

drop policy if exists "alpha_metrics_select_public" on public.alpha_metrics;
create policy "alpha_metrics_select_public"
on public.alpha_metrics
for select
using (true);

drop policy if exists "alpha_metrics_manage_service" on public.alpha_metrics;
create policy "alpha_metrics_manage_service"
on public.alpha_metrics
for all
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

-- ---------------------------------------------------------------------
-- Creator Earnings (Fair Fee Distribution)
-- ---------------------------------------------------------------------

create table if not exists public.creator_earnings (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  contribute_id text not null,
  amount numeric(36,18) not null,
  tx_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'withdrawn')),
  created_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  unique(wallet_address, contribute_id, tx_hash)
);

create index if not exists idx_creator_earnings_wallet on public.creator_earnings (lower(wallet_address));
create index if not exists idx_creator_earnings_contribute on public.creator_earnings (contribute_id);
create index if not exists idx_creator_earnings_status on public.creator_earnings (status);

alter table public.creator_earnings enable row level security;

drop policy if exists "creator_earnings_select_own" on public.creator_earnings;
create policy "creator_earnings_select_own"
on public.creator_earnings
for select
using (
  lower(wallet_address) = lower(coalesce((select wallet_address from public.social_profiles where id = (select auth.uid())), ''))
  or public.is_admin()
);

drop policy if exists "creator_earnings_insert_service" on public.creator_earnings;
create policy "creator_earnings_insert_service"
on public.creator_earnings
for insert
with check ((select auth.role()) = 'service_role');

drop policy if exists "creator_earnings_update_own" on public.creator_earnings;
create policy "creator_earnings_update_own"
on public.creator_earnings
for update
using (
  lower(wallet_address) = lower(coalesce((select wallet_address from public.social_profiles where id = (select auth.uid())), ''))
  or public.is_admin()
)
with check (
  lower(wallet_address) = lower(coalesce((select wallet_address from public.social_profiles where id = (select auth.uid())), ''))
  or public.is_admin()
);

-- ---------------------------------------------------------------------
-- Fee Distribution Tracking
-- ---------------------------------------------------------------------

create table if not exists public.fee_distributions (
  id uuid primary key default gen_random_uuid(),
  tx_hash text not null unique,
  post_id integer not null,
  total_fee numeric(36,18) not null,
  creator_share numeric(36,18) not null,
  lp_share numeric(36,18) not null,
  treasury_share numeric(36,18) not null,
  early_bonus numeric(36,18) not null default 0,
  creator_wallet text,
  created_at timestamptz not null default now()
);

create index if not exists idx_fee_distributions_tx_hash on public.fee_distributions (tx_hash);
create index if not exists idx_fee_distributions_post_id on public.fee_distributions (post_id);

alter table public.fee_distributions enable row level security;

drop policy if exists "fee_distributions_select_public" on public.fee_distributions;
create policy "fee_distributions_select_public"
on public.fee_distributions
for select
using (true);

drop policy if exists "fee_distributions_insert_service" on public.fee_distributions;
create policy "fee_distributions_insert_service"
on public.fee_distributions
for insert
with check ((select auth.role()) = 'service_role');

-- ---------------------------------------------------------------------
-- Follow System
-- ---------------------------------------------------------------------

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_address text not null,
  following_address text not null,
  created_at timestamptz not null default now(),
  unique(follower_address, following_address)
);

create index if not exists idx_follows_follower on public.follows (lower(follower_address));
create index if not exists idx_follows_following on public.follows (lower(following_address));

alter table public.follows enable row level security;

drop policy if exists "follows_select_public" on public.follows;
create policy "follows_select_public"
on public.follows
for select
using (true);

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own"
on public.follows
for insert
with check (
  (select auth.role()) = 'service_role'
  or (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.social_profiles p
      where p.id = (select auth.uid())
        and p.wallet_address is not null
        and lower(p.wallet_address) = lower(follower_address)
    )
  )
);

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own"
on public.follows
for delete
using (
  (select auth.role()) = 'service_role'
  or (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.social_profiles p
      where p.id = (select auth.uid())
        and p.wallet_address is not null
        and lower(p.wallet_address) = lower(follower_address)
    )
  )
);

-- ---------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_address text not null,
  type text not null check (type in ('new_contribute', 'price_alert', 'lp_reward', 'creator_earnings', 'mention', 'follow')),
  title text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (lower(user_address));
create index if not exists idx_notifications_read on public.notifications (read);
create index if not exists idx_notifications_created on public.notifications (created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
using (
  lower(user_address) = lower(coalesce((select wallet_address from public.social_profiles where id = (select auth.uid())), ''))
  or public.is_admin()
);

drop policy if exists "notifications_insert_service" on public.notifications;
create policy "notifications_insert_service"
on public.notifications
for insert
with check ((select auth.role()) = 'service_role');

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications
for update
using (
  lower(user_address) = lower(coalesce((select wallet_address from public.social_profiles where id = (select auth.uid())), ''))
  or public.is_admin()
);

-- ---------------------------------------------------------------------
-- Share Tracking (for referral rewards)
-- ---------------------------------------------------------------------

create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  sharer_address text not null,
  contribute_id text not null,
  platform text not null check (platform in ('twitter', 'telegram', 'link', 'qr')),
  created_at timestamptz not null default now()
);

create index if not exists idx_shares_sharer on public.shares (lower(sharer_address));
create index if not exists idx_shares_contribute on public.shares (contribute_id);

alter table public.shares enable row level security;

drop policy if exists "shares_select_public" on public.shares;
create policy "shares_select_public"
on public.shares
for select
using (true);

drop policy if exists "shares_insert_own" on public.shares;
create policy "shares_insert_own"
on public.shares
for insert
with check (
  (select auth.role()) = 'service_role'
  or (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.social_profiles p
      where p.id = (select auth.uid())
        and p.wallet_address is not null
        and lower(p.wallet_address) = lower(sharer_address)
    )
  )
);

-- ---------------------------------------------------------------------
-- Contributes (Investment Pools)
-- ---------------------------------------------------------------------

-- Önce mevcut tabloyu kontrol et ve gerekirse düzelt
DO $$ 
BEGIN
  -- Eğer author_id kolonu varsa, author'a dönüştür
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'contributes' 
      AND column_name = 'author_id'
  ) THEN
    -- author_id kolonunu author'a dönüştür (eğer author kolonu yoksa)
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'contributes' 
        AND column_name = 'author'
    ) THEN
      ALTER TABLE public.contributes 
        ADD COLUMN author text;
      
      -- author_id'den author'a veri kopyala (eğer uuid ise text'e çevir)
      UPDATE public.contributes 
      SET author = author_id::text 
      WHERE author IS NULL;
      
      -- author_id kolonunu sil
      ALTER TABLE public.contributes 
        DROP COLUMN IF EXISTS author_id CASCADE;
    ELSE
      -- Sadece author_id'yi sil
      ALTER TABLE public.contributes 
        DROP COLUMN IF EXISTS author_id CASCADE;
    END IF;
  END IF;
END $$;

create table if not exists public.contributes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  author text not null,
  tags text[],
  category text default 'trading',
  cover_image text,
  pool_enabled boolean not null default false,
  contract_post_id bigint,
  weekly_score integer not null default 0,
  weekly_volume_nop numeric(38,18) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Eksik kolonları ekle
alter table public.contributes
  add column if not exists title text,
  add column if not exists subtitle text,
  add column if not exists description text,
  add column if not exists author text,
  add column if not exists tags text[],
  add column if not exists category text default 'trading',
  add column if not exists cover_image text,
  add column if not exists pool_enabled boolean not null default false,
  add column if not exists contract_post_id bigint,
  add column if not exists weekly_score integer not null default 0,
  add column if not exists weekly_volume_nop numeric(38,18) not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- author_id kolonunu kaldır (eğer hala varsa)
alter table public.contributes
  drop column if exists author_id cascade;

create index if not exists idx_contributes_author on public.contributes (lower(author));
create index if not exists idx_contributes_created_at on public.contributes (created_at desc);
create index if not exists idx_contributes_pool_enabled on public.contributes (pool_enabled) where pool_enabled = true;
create index if not exists idx_contributes_contract_post_id on public.contributes (contract_post_id) where contract_post_id is not null;

drop trigger if exists set_timestamp_contributes on public.contributes;
create trigger set_timestamp_contributes
before update on public.contributes
for each row
execute procedure public.set_updated_at();

alter table public.contributes enable row level security;

drop policy if exists "contributes_select_public" on public.contributes;
create policy "contributes_select_public"
on public.contributes
for select
using (true);

drop policy if exists "contributes_insert_public" on public.contributes;
create policy "contributes_insert_public"
on public.contributes
for insert
with check (true);

drop policy if exists "contributes_update_public" on public.contributes;
create policy "contributes_update_public"
on public.contributes
for update
using (true)
with check (true);

drop policy if exists "contributes_delete_admin" on public.contributes;
create policy "contributes_delete_admin"
on public.contributes
for delete
using (public.is_admin() or (select auth.role()) = 'service_role')
with check (public.is_admin() or (select auth.role()) = 'service_role');

-- ---------------------------------------------------------------------
-- Pool Positions (User investments in contributes)
-- ---------------------------------------------------------------------

create table if not exists public.pool_positions (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  contribute_id uuid not null references public.contributes(id) on delete cascade,
  post_id bigint,
  shares numeric(38,18) not null default 0,
  cost_basis numeric(38,18) not null default 0,
  current_value numeric(38,18) not null default 0,
  realized_pnl numeric(38,18) not null default 0,
  unrealized_pnl numeric(38,18) not null default 0,
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pool_positions_wallet on public.pool_positions (lower(wallet_address));
create index if not exists idx_pool_positions_contribute on public.pool_positions (contribute_id);
create index if not exists idx_pool_positions_post_id on public.pool_positions (post_id) where post_id is not null;
create index if not exists idx_pool_positions_status on public.pool_positions (status);

drop trigger if exists set_timestamp_pool_positions on public.pool_positions;
create trigger set_timestamp_pool_positions
before update on public.pool_positions
for each row
execute procedure public.set_updated_at();

alter table public.pool_positions enable row level security;

drop policy if exists "pool_positions_select_public" on public.pool_positions;
create policy "pool_positions_select_public"
on public.pool_positions
for select
using (true);

drop policy if exists "pool_positions_insert_public" on public.pool_positions;
create policy "pool_positions_insert_public"
on public.pool_positions
for insert
with check (true);

drop policy if exists "pool_positions_update_public" on public.pool_positions;
create policy "pool_positions_update_public"
on public.pool_positions
for update
using (true)
with check (true);

-- ---------------------------------------------------------------------
-- Copy Trading
-- ---------------------------------------------------------------------

create table if not exists public.copy_trades (
  id uuid primary key default gen_random_uuid(),
  copier_address text not null,
  copied_address text not null,
  max_amount_per_trade numeric(36,18),
  auto_sell boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(copier_address, copied_address)
);

create index if not exists idx_copy_trades_copier on public.copy_trades (lower(copier_address));
create index if not exists idx_copy_trades_copied on public.copy_trades (lower(copied_address));

alter table public.copy_trades enable row level security;

drop policy if exists "copy_trades_select_own" on public.copy_trades;
create policy "copy_trades_select_own"
on public.copy_trades
for select
using (
  lower(copier_address) = lower(coalesce((select wallet_address from public.social_profiles where id = (select auth.uid())), ''))
  or lower(copied_address) = lower(coalesce((select wallet_address from public.social_profiles where id = (select auth.uid())), ''))
  or public.is_admin()
);

drop policy if exists "copy_trades_insert_own" on public.copy_trades;
create policy "copy_trades_insert_own"
on public.copy_trades
for insert
with check (
  (select auth.role()) = 'service_role'
  or (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.social_profiles p
      where p.id = (select auth.uid())
        and p.wallet_address is not null
        and lower(p.wallet_address) = lower(copier_address)
    )
  )
);

drop policy if exists "copy_trades_update_own" on public.copy_trades;
create policy "copy_trades_update_own"
on public.copy_trades
for update
using (
  lower(copier_address) = lower(coalesce((select wallet_address from public.social_profiles where id = (select auth.uid())), ''))
  or public.is_admin()
);

-- =====================================================================
-- End of schema
-- =====================================================================
