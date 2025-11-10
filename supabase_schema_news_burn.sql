-- NEWS CACHE (opsiyonel cache)
create table if not exists public.news_cache (
  id bigserial primary key,
  title text not null,
  url text not null,
  source text,
  published_at timestamptz default now()
);

-- herkes okuyabilir; yazmayı sadece admin yapar
alter table public.news_cache enable row level security;
create policy "news select all" on public.news_cache for select using (true);

-- BURN WIDGET
create table if not exists public.burn_widget (
  id int primary key default 1,
  total_burn numeric(38,8) not null default 0,
  last_update timestamptz default now()
);

alter table public.burn_widget enable row level security;
create policy "burn read all" on public.burn_widget for select using (true);
-- Güncelleme için sadece admin profilleri (profiles.is_admin = true) yetkilendir
-- (profiles tablosunda is_admin yoksa ekle)
do $$
begin
  if not exists (select 1 from information_schema.columns 
                 where table_schema='public' and table_name='profiles' and column_name='is_admin') then
    alter table public.profiles add column is_admin boolean default false;
  end if;
end$$;

create policy "burn update admin only" on public.burn_widget
for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- İlk satırı garantiye al
insert into public.burn_widget (id, total_burn) values (1, 0)
on conflict (id) do nothing;
