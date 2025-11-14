-- Profillerde gerekli kolonlar (varsayılan yoksa ekle)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'nop_points'
  ) then
    alter table public.profiles add column nop_points numeric(38,2) not null default 0;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'wallet_address'
  ) then
    alter table public.profiles add column wallet_address text;
  end if;
end$$;

-- Boosted görev tanımları
create table if not exists public.boosted_tasks (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text,
  reward_nop integer not null default 0,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.boosted_tasks(id) on delete cascade,
  status text not null default 'pending', -- pending | completed | claimed
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, task_id)
);

alter table public.user_tasks enable row level security;

create policy if not exists "user_tasks_select_own"
on public.user_tasks for select
using (auth.uid() = user_id);

create policy if not exists "user_tasks_upsert_own"
on public.user_tasks for insert
with check (auth.uid() = user_id);

create policy if not exists "user_tasks_update_own"
on public.user_tasks for update
using (auth.uid() = user_id);
