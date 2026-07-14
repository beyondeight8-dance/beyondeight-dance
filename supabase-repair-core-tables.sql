-- BeyondEight core table repair.
-- Run this before RLS repairs if Supabase reports missing tables such as public.business_members.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid()
);

alter table public.businesses add column if not exists owner_user_id uuid;
alter table public.businesses add column if not exists business_name text;
alter table public.businesses add column if not exists slug text;
alter table public.businesses add column if not exists business_type text;
alter table public.businesses add column if not exists tagline text;
alter table public.businesses add column if not exists description text;
alter table public.businesses add column if not exists mission text;
alter table public.businesses add column if not exists why_join text;
alter table public.businesses add column if not exists brand_vibe text;
alter table public.businesses add column if not exists theme text not null default 'Default Elegant';
alter table public.businesses add column if not exists logo_url text;
alter table public.businesses add column if not exists status text not null default 'draft';
alter table public.businesses add column if not exists current_onboarding_step integer not null default 0;
alter table public.businesses add column if not exists onboarding_completed boolean not null default false;
alter table public.businesses add column if not exists created_at timestamptz not null default now();
alter table public.businesses add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'businesses_owner_user_id_fkey'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_owner_user_id_fkey
      foreign key (owner_user_id)
      references public.profiles(id)
      on delete cascade;
  end if;
end $$;

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid()
);

alter table public.business_members add column if not exists business_id uuid;
alter table public.business_members add column if not exists user_id uuid;
alter table public.business_members add column if not exists role text not null default 'member';
alter table public.business_members add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'business_members_business_id_fkey'
      and conrelid = 'public.business_members'::regclass
  ) then
    alter table public.business_members
      add constraint business_members_business_id_fkey
      foreign key (business_id)
      references public.businesses(id)
      on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'business_members_user_id_fkey'
      and conrelid = 'public.business_members'::regclass
  ) then
    alter table public.business_members
      add constraint business_members_user_id_fkey
      foreign key (user_id)
      references public.profiles(id)
      on delete cascade;
  end if;
end $$;

create table if not exists public.websites (
  id uuid primary key default gen_random_uuid()
);

alter table public.websites add column if not exists business_id uuid;
alter table public.websites add column if not exists theme text not null default 'Default Elegant';
alter table public.websites add column if not exists published boolean not null default false;
alter table public.websites add column if not exists published_at timestamptz;
alter table public.websites add column if not exists custom_domain text;
alter table public.websites add column if not exists created_at timestamptz not null default now();
alter table public.websites add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'websites_business_id_fkey'
      and conrelid = 'public.websites'::regclass
  ) then
    alter table public.websites
      add constraint websites_business_id_fkey
      foreign key (business_id)
      references public.businesses(id)
      on delete cascade;
  end if;
end $$;

create table if not exists public.website_pages (
  id uuid primary key default gen_random_uuid()
);

alter table public.website_pages add column if not exists website_id uuid;
alter table public.website_pages add column if not exists page_type text;
alter table public.website_pages add column if not exists title text;
alter table public.website_pages add column if not exists content jsonb not null default '{}'::jsonb;
alter table public.website_pages add column if not exists enabled boolean not null default true;
alter table public.website_pages add column if not exists display_order integer not null default 0;
alter table public.website_pages add column if not exists created_at timestamptz not null default now();
alter table public.website_pages add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'website_pages_website_id_fkey'
      and conrelid = 'public.website_pages'::regclass
  ) then
    alter table public.website_pages
      add constraint website_pages_website_id_fkey
      foreign key (website_id)
      references public.websites(id)
      on delete cascade;
  end if;
end $$;

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid()
);

alter table public.business_settings add column if not exists business_id uuid;
alter table public.business_settings add column if not exists dance_styles jsonb not null default '[]'::jsonb;
alter table public.business_settings add column if not exists selected_tools jsonb not null default '[]'::jsonb;
alter table public.business_settings add column if not exists selected_pages jsonb not null default '[]'::jsonb;
alter table public.business_settings add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.business_settings add column if not exists brand_colors jsonb not null default '[]'::jsonb;
alter table public.business_settings add column if not exists generated_content jsonb not null default '{}'::jsonb;
alter table public.business_settings add column if not exists created_at timestamptz not null default now();
alter table public.business_settings add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'business_settings_business_id_fkey'
      and conrelid = 'public.business_settings'::regclass
  ) then
    alter table public.business_settings
      add constraint business_settings_business_id_fkey
      foreign key (business_id)
      references public.businesses(id)
      on delete cascade;
  end if;
end $$;

create table if not exists public.media (
  id uuid primary key default gen_random_uuid()
);

alter table public.media add column if not exists business_id uuid;
alter table public.media add column if not exists storage_path text;
alter table public.media add column if not exists public_url text;
alter table public.media add column if not exists file_type text;
alter table public.media add column if not exists alt_text text;
alter table public.media add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'media_business_id_fkey'
      and conrelid = 'public.media'::regclass
  ) then
    alter table public.media
      add constraint media_business_id_fkey
      foreign key (business_id)
      references public.businesses(id)
      on delete cascade;
  end if;
end $$;

create index if not exists businesses_owner_user_id_idx on public.businesses(owner_user_id);
create unique index if not exists businesses_slug_unique_idx on public.businesses(slug);
create unique index if not exists business_members_business_user_unique_idx on public.business_members(business_id, user_id);
create unique index if not exists websites_business_id_unique_idx on public.websites(business_id);
create unique index if not exists website_pages_website_page_type_unique_idx on public.website_pages(website_id, page_type);
create unique index if not exists business_settings_business_id_unique_idx on public.business_settings(business_id);

notify pgrst, 'reload schema';
