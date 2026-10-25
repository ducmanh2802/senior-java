-- Senior Java Prep — Supabase schema (T30)
-- Run once in Supabase → SQL Editor. Safe to re-run (idempotent).
--
-- Security model
--   * Browser uses the anon key + the user's session JWT; Row Level Security limits every row to its owner.
--   * Users may read/write ONLY their own progress (user_state) and read their own profile/usage.
--   * Role, AI quota and usage counters are written only by the server (service role key in Vercel env),
--     so a user cannot raise their own quota or make themselves admin.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  ai_daily_limit integer not null default 10 check (ai_daily_limit >= 0),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

-- users may change only their display name; role / quota are server-managed
drop policy if exists "profiles: update own name" on public.profiles;
create policy "profiles: update own name" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;

-- create a profile row automatically on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- user_state: synced study progress (App.store.data) ----------
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_state_size check (pg_column_size(data) < 2000000)  -- ~2 MB per user
);

alter table public.user_state enable row level security;

drop policy if exists "user_state: own rows" on public.user_state;
create policy "user_state: own rows" on public.user_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- ai_usage: one row per user per day per kind (server-written) ----------
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  kind    text not null check (kind in ('grade', 'review', 'run', 'interview')),
  count   integer not null default 0,
  primary key (user_id, day, kind)
);

alter table public.ai_usage enable row level security;

drop policy if exists "ai_usage: read own" on public.ai_usage;
create policy "ai_usage: read own" on public.ai_usage
  for select using (auth.uid() = user_id);
-- no insert/update policy: only the service role (server) writes usage

-- Atomically consume one unit of quota. Returns the new total for today, or -1 if the limit is reached.
-- Called by the server with the service role; not executable by browser roles.
create or replace function public.consume_ai_quota(p_user uuid, p_kind text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_limit integer;
  v_used  integer;
  v_day   date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  select ai_daily_limit into v_limit from profiles where id = p_user for update;
  if v_limit is null then return -1; end if;

  select coalesce(sum(count), 0) into v_used from ai_usage where user_id = p_user and day = v_day;
  if v_used >= v_limit then return -1; end if;

  insert into ai_usage (user_id, day, kind, count) values (p_user, v_day, p_kind, 1)
  on conflict (user_id, day, kind) do update set count = ai_usage.count + 1;
  return v_used + 1;
end;
$$;

revoke all on function public.consume_ai_quota(uuid, text) from public, anon, authenticated;

-- ---------- convenience view for the account page ----------
create or replace view public.my_ai_usage_today
with (security_invoker = true) as
  select u.kind, u.count
  from public.ai_usage u
  where u.user_id = auth.uid()
    and u.day = (now() at time zone 'Asia/Ho_Chi_Minh')::date;

grant select on public.my_ai_usage_today to authenticated;

-- ---------- news_items: public news fetched by cron (T156) ----------
create table if not exists public.news_items (
  id          bigint generated always as identity primary key,
  url         text unique not null,
  category    text not null check (category in ('tech','hiring','company')),
  source      text not null,
  title       text not null,
  summary     text,
  published   timestamptz not null,
  fetched_at  timestamptz not null default now()
);

create index if not exists news_items_published_desc on public.news_items (published desc);

alter table public.news_items enable row level security;

drop policy if exists "news_items: public read" on public.news_items;
create policy "news_items: public read" on public.news_items
  for select using (true);
-- no insert/update/delete policy for anon/authenticated: only server (service role) writes
