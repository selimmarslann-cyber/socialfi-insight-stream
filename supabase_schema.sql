-- Temel tablolar
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamp with time zone default now()
);

create table if not exists public.posts (
  id bigserial primary key,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  media_url text,
  created_at timestamp with time zone default now()
);

create table if not exists public.comments (
  id bigserial primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.ratings (
  id bigserial primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  rater_id uuid not null references auth.users(id) on delete cascade,
  score int not null check (score between 1 and 10),
  created_at timestamp with time zone default now(),
  unique (post_id, rater_id)
);

-- RLS aktif
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.ratings enable row level security;

-- Politikalar
-- profiles
create policy "profiles select self or all" on public.profiles
for select using (true);

create policy "profiles insert self" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles update self" on public.profiles
for update using (auth.uid() = id);

-- posts
create policy "posts read all" on public.posts
for select using (true);

create policy "posts insert own" on public.posts
for insert with check (auth.uid() = author_id);

create policy "posts update own" on public.posts
for update using (auth.uid() = author_id);

create policy "posts delete own" on public.posts
for delete using (auth.uid() = author_id);

-- comments
create policy "comments read all" on public.comments
for select using (true);

create policy "comments insert own" on public.comments
for insert with check (auth.uid() = author_id);

create policy "comments update own" on public.comments
for update using (auth.uid() = author_id);

create policy "comments delete own" on public.comments
for delete using (auth.uid() = author_id);

-- ratings
create policy "ratings read all" on public.ratings
for select using (true);

create policy "ratings insert own" on public.ratings
for insert with check (auth.uid() = rater_id);

create policy "ratings update own" on public.ratings
for update using (auth.uid() = rater_id);

-- Profil otomatik oluşturma trigger (signup sonrası)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, split_part(new.email, '@', 1), null)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Contact form support
create table if not exists public.contact_messages (
  id bigserial primary key,
  name text,
  email text,
  subject text,
  message text not null,
  created_at timestamptz default now(),
  reporter_id uuid references auth.users(id)
);

alter table public.contact_messages enable row level security;

create policy "contact insert self or anon" on public.contact_messages
for insert
with check (auth.uid() = reporter_id or auth.uid() is null);

create policy "contact read admin only" on public.contact_messages
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
);
