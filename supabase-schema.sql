-- BeyondEight Supabase setup
-- Run this once in Supabase Dashboard > SQL Editor.
-- The frontend uses the anon key with Row Level Security, so every row is scoped to auth.uid().

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null default 'Beyond Movement',
  tagline text,
  business_type text,
  dance_styles text[] not null default '{}',
  brand_vibe text,
  theme text not null default 'Default Elegant',
  selected_pages text[] not null default '{}',
  website_status text not null default 'draft' check (website_status in ('draft', 'launched')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

create table if not exists public.onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  step_index integer not null default 0,
  setup_state jsonb not null default '{}'::jsonb,
  launched boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

create table if not exists public.website_pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  slug text not null,
  title text not null,
  page_data jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, slug)
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_businesses_updated_at on public.businesses;
create trigger set_businesses_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

drop trigger if exists set_onboarding_sessions_updated_at on public.onboarding_sessions;
create trigger set_onboarding_sessions_updated_at
before update on public.onboarding_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_website_pages_updated_at on public.website_pages;
create trigger set_website_pages_updated_at
before update on public.website_pages
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.onboarding_sessions enable row level security;
alter table public.website_pages enable row level security;

drop policy if exists "Users can read their profile" on public.profiles;
create policy "Users can read their profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users can insert their profile" on public.profiles;
create policy "Users can insert their profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can read their businesses" on public.businesses;
create policy "Users can read their businesses"
on public.businesses for select
using (auth.uid() = owner_id);

drop policy if exists "Users can insert their businesses" on public.businesses;
create policy "Users can insert their businesses"
on public.businesses for insert
with check (auth.uid() = owner_id);

drop policy if exists "Users can update their businesses" on public.businesses;
create policy "Users can update their businesses"
on public.businesses for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Users can read their onboarding sessions" on public.onboarding_sessions;
create policy "Users can read their onboarding sessions"
on public.onboarding_sessions for select
using (auth.uid() = owner_id);

drop policy if exists "Users can insert their onboarding sessions" on public.onboarding_sessions;
create policy "Users can insert their onboarding sessions"
on public.onboarding_sessions for insert
with check (auth.uid() = owner_id);

drop policy if exists "Users can update their onboarding sessions" on public.onboarding_sessions;
create policy "Users can update their onboarding sessions"
on public.onboarding_sessions for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Users can read their website pages" on public.website_pages;
create policy "Users can read their website pages"
on public.website_pages for select
using (auth.uid() = owner_id);

drop policy if exists "Users can insert their website pages" on public.website_pages;
create policy "Users can insert their website pages"
on public.website_pages for insert
with check (auth.uid() = owner_id);

drop policy if exists "Users can update their website pages" on public.website_pages;
create policy "Users can update their website pages"
on public.website_pages for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);
