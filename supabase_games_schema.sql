-- PROFİLLER
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- KULLANICI SKOR ÖZETİ
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
  updated_at timestamptz default now(),
  unique (user_id)
);
alter table public.gaming_scores enable row level security;
create policy if not exists "scores_read_all" on public.gaming_scores for select using (true);
create policy if not exists "scores_insert_own" on public.gaming_scores for insert with check (auth.uid()=user_id);
create policy if not exists "scores_update_own" on public.gaming_scores for update using (auth.uid()=user_id);
create policy if not exists "scores_admin_update" on public.gaming_scores for update using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true));

create or replace function public._touch_scores()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;
drop trigger if exists _touch_scores on public.gaming_scores;
create trigger _touch_scores before update on public.gaming_scores for each row execute function public._touch_scores();

-- OTURUM/AUDIT
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  game text not null,   -- 'flappy' | 'runner' | 'memory' | 'reaction'
  score int not null default 0,
  duration_ms int,
  created_at timestamptz default now()
);
alter table public.game_sessions enable row level security;
create policy if not exists "sess_select_own_or_admin" on public.game_sessions for select using (auth.uid()=user_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true));
create policy if not exists "sess_insert_own" on public.game_sessions for insert with check (auth.uid()=user_id);

-- Reset fonksiyonları (admin policy sayesinde korumalı)
create or replace function public.reset_daily_scores() returns void
language sql security definer set search_path = public as $$ update public.gaming_scores set daily_score=0; $$;
create or replace function public.reset_weekly_scores() returns void
language sql security definer set search_path = public as $$ update public.gaming_scores set weekly_score=0; $$;
