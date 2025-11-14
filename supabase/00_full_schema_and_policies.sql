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

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select is_admin
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

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
set search_path = public
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
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

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
  add column if not exists invest_open boolean not null default false;

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
with check (auth.uid() = author_id);

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
on public.posts
for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own"
on public.posts
for delete
using (auth.uid() = author_id);

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
with check (auth.uid() = author_id);

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own"
on public.comments
for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
on public.comments
for delete
using (auth.uid() = author_id);

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
with check (auth.uid() = rater_id);

drop policy if exists "ratings_update_own" on public.ratings;
create policy "ratings_update_own"
on public.ratings
for update
using (auth.uid() = rater_id)
with check (auth.uid() = rater_id);

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
using (public.is_admin() or auth.role() = 'service_role')
with check (public.is_admin() or auth.role() = 'service_role');

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
using (auth.uid() = user_id);

drop policy if exists "user_tasks_insert_own" on public.user_tasks;
create policy "user_tasks_insert_own"
on public.user_tasks
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_tasks_update_own" on public.user_tasks;
create policy "user_tasks_update_own"
on public.user_tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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
using (auth.uid() = user_id);

drop policy if exists "user_task_rewards_insert_own" on public.user_task_rewards;
create policy "user_task_rewards_insert_own"
on public.user_task_rewards
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_task_rewards_update_own" on public.user_task_rewards;
create policy "user_task_rewards_update_own"
on public.user_task_rewards
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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
using (public.is_admin() or auth.role() = 'service_role')
with check (public.is_admin() or auth.role() = 'service_role');

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
  auth.uid() = user_id
  or public.is_admin()
  or auth.role() = 'service_role'
);

drop policy if exists "investment_orders_insert_own" on public.investment_orders;
create policy "investment_orders_insert_own"
on public.investment_orders
for insert
with check (auth.uid() = user_id);

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
  (auth.uid() = reporter_id)
  or (auth.uid() is null and reporter_id is null)
);

drop policy if exists "contact_messages_select_admin" on public.contact_messages;
create policy "contact_messages_select_admin"
on public.contact_messages
for select
using (public.is_admin() or auth.role() = 'service_role');

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
using (public.is_admin() or auth.role() = 'service_role')
with check (public.is_admin() or auth.role() = 'service_role');

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
using (public.is_admin() or auth.role() = 'service_role')
with check (public.is_admin() or auth.role() = 'service_role');

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
using (public.is_admin() or auth.role() = 'service_role')
with check (public.is_admin() or auth.role() = 'service_role');

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
with check (auth.uid() = user_id);

drop policy if exists "gaming_scores_update_own" on public.gaming_scores;
create policy "gaming_scores_update_own"
on public.gaming_scores
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "gaming_scores_admin_update" on public.gaming_scores;
create policy "gaming_scores_admin_update"
on public.gaming_scores
for update
using (public.is_admin() or auth.role() = 'service_role')
with check (public.is_admin() or auth.role() = 'service_role');

create or replace function public.reset_daily_scores()
returns void
language sql
security definer
set search_path = public
as $$
  update public.gaming_scores
  set daily_score = 0;
$$;

create or replace function public.reset_weekly_scores()
returns void
language sql
security definer
set search_path = public
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
  auth.uid() = user_id
  or public.is_admin()
  or auth.role() = 'service_role'
);

drop policy if exists "game_sessions_insert_own" on public.game_sessions;
create policy "game_sessions_insert_own"
on public.game_sessions
for insert
with check (auth.uid() = user_id);

-- =====================================================================
-- End of schema
-- =====================================================================
