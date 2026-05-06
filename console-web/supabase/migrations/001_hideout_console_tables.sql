-- Hideout Operator Console — minimal persistence (single-tenant friendly via RLS + auth.uid()).
-- Run in Supabase SQL editor or: supabase db push

create extension if not exists "pgcrypto";

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_at bigint not null,
  entry jsonb not null,
  inserted_at timestamptz not null default now()
);

create index if not exists daily_logs_user_logged on public.daily_logs (user_id, logged_at desc);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_label text not null,
  saved_at bigint,
  entry jsonb not null,
  unique (user_id, week_label)
);

create index if not exists weekly_reviews_user_saved on public.weekly_reviews (user_id, saved_at desc nulls last);

create table if not exists public.monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month_label text not null,
  saved_at bigint,
  entry jsonb not null,
  unique (user_id, month_label)
);

create index if not exists monthly_reviews_user_saved on public.monthly_reviews (user_id, saved_at desc nulls last);

create table if not exists public.app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.daily_logs enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.monthly_reviews enable row level security;
alter table public.app_state enable row level security;

create policy daily_logs_own on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy weekly_reviews_own on public.weekly_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy monthly_reviews_own on public.monthly_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy app_state_own on public.app_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
