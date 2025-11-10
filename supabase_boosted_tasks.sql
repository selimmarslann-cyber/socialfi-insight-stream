-- Profillerde nop puan ve cüzdan kolonu (yoksa ekle)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='nop_points') then
    alter table public.profiles add column nop_points numeric(38,2) not null default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='wallet_address') then
    alter table public.profiles add column wallet_address text;
  end if;
end$$;

-- Tek seferlik görev kayıtları
create table if not exists public.user_task_rewards (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_key text not null,       -- 'signup' | 'deposit' | 'contribute'
  reward_nop numeric(38,2) not null,
  completed_at timestamptz,     -- koşul sağlandı zamanı
  claimed_at timestamptz,       -- claim edildi zamanı
  unique (user_id, task_key)
);

alter table public.user_task_rewards enable row level security;

-- Kendi kayıtlarını gör / yaz (admin hepsini görür)
create policy if not exists "utr_select_own_or_admin" on public.user_task_rewards
for select using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id=auth.uid() and p.is_admin=true));

create policy if not exists "utr_upsert_own" on public.user_task_rewards
for insert with check (auth.uid() = user_id);

create policy if not exists "utr_update_own" on public.user_task_rewards
for update using (auth.uid() = user_id);
