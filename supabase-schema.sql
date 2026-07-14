-- BeyondEight Supabase migration
-- Run in Supabase Dashboard > SQL Editor.
-- Uses Supabase Auth for passwords/sessions. Never expose a service-role key in browser code.

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
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  business_name text not null,
  slug text not null unique,
  business_type text,
  tagline text,
  description text,
  mission text,
  why_join text,
  brand_vibe text,
  theme text not null default 'Default Elegant',
  logo_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  current_onboarding_step integer not null default 0,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.businesses add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade;
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

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'editor', 'member')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

alter table public.business_members add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.business_members add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.business_members add column if not exists role text not null default 'member';
alter table public.business_members add column if not exists created_at timestamptz not null default now();

create table if not exists public.websites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  theme text not null default 'Default Elegant',
  published boolean not null default false,
  published_at timestamptz,
  custom_domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.websites add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.websites add column if not exists theme text not null default 'Default Elegant';
alter table public.websites add column if not exists published boolean not null default false;
alter table public.websites add column if not exists published_at timestamptz;
alter table public.websites add column if not exists custom_domain text;
alter table public.websites add column if not exists created_at timestamptz not null default now();
alter table public.websites add column if not exists updated_at timestamptz not null default now();

create table if not exists public.website_pages (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  page_type text not null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (website_id, page_type)
);

alter table public.website_pages add column if not exists website_id uuid references public.websites(id) on delete cascade;
alter table public.website_pages add column if not exists page_type text;
alter table public.website_pages add column if not exists title text;
alter table public.website_pages add column if not exists content jsonb not null default '{}'::jsonb;
alter table public.website_pages add column if not exists enabled boolean not null default true;
alter table public.website_pages add column if not exists display_order integer not null default 0;
alter table public.website_pages add column if not exists created_at timestamptz not null default now();
alter table public.website_pages add column if not exists updated_at timestamptz not null default now();

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  dance_styles jsonb not null default '[]'::jsonb,
  selected_tools jsonb not null default '[]'::jsonb,
  selected_pages jsonb not null default '[]'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  brand_colors jsonb not null default '[]'::jsonb,
  generated_content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_settings add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.business_settings add column if not exists dance_styles jsonb not null default '[]'::jsonb;
alter table public.business_settings add column if not exists selected_tools jsonb not null default '[]'::jsonb;
alter table public.business_settings add column if not exists selected_pages jsonb not null default '[]'::jsonb;
alter table public.business_settings add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.business_settings add column if not exists brand_colors jsonb not null default '[]'::jsonb;
alter table public.business_settings add column if not exists generated_content jsonb not null default '{}'::jsonb;
alter table public.business_settings add column if not exists created_at timestamptz not null default now();
alter table public.business_settings add column if not exists updated_at timestamptz not null default now();

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  storage_path text not null,
  public_url text,
  file_type text,
  alt_text text,
  created_at timestamptz not null default now()
);

alter table public.media add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.media add column if not exists storage_path text;
alter table public.media add column if not exists public_url text;
alter table public.media add column if not exists file_type text;
alter table public.media add column if not exists alt_text text;
alter table public.media add column if not exists created_at timestamptz not null default now();

create index if not exists businesses_owner_user_id_idx on public.businesses(owner_user_id);
create index if not exists businesses_slug_idx on public.businesses(slug);
create unique index if not exists businesses_slug_unique_idx on public.businesses(slug);
create index if not exists business_members_user_id_idx on public.business_members(user_id);
create index if not exists business_members_business_id_idx on public.business_members(business_id);
create unique index if not exists business_members_business_user_unique_idx on public.business_members(business_id, user_id);
create index if not exists websites_business_id_idx on public.websites(business_id);
create unique index if not exists websites_business_id_unique_idx on public.websites(business_id);
create index if not exists website_pages_website_id_idx on public.website_pages(website_id);
create unique index if not exists website_pages_website_page_type_unique_idx on public.website_pages(website_id, page_type);
create index if not exists business_settings_business_id_idx on public.business_settings(business_id);
create unique index if not exists business_settings_business_id_unique_idx on public.business_settings(business_id);
create index if not exists media_business_id_idx on public.media(business_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_businesses_updated_at on public.businesses;
create trigger set_businesses_updated_at before update on public.businesses for each row execute function public.set_updated_at();
drop trigger if exists set_websites_updated_at on public.websites;
create trigger set_websites_updated_at before update on public.websites for each row execute function public.set_updated_at();
drop trigger if exists set_website_pages_updated_at on public.website_pages;
create trigger set_website_pages_updated_at before update on public.website_pages for each row execute function public.set_updated_at();
drop trigger if exists set_business_settings_updated_at on public.business_settings;
create trigger set_business_settings_updated_at before update on public.business_settings for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.websites enable row level security;
alter table public.website_pages enable row level security;
alter table public.business_settings enable row level security;
alter table public.media enable row level security;

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
  );
$$;

create or replace function public.has_business_role(target_business_id uuid, allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
      and bm.role = any(allowed_roles)
  );
$$;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "businesses insert owner" on public.businesses;
create policy "businesses insert owner" on public.businesses for insert with check (auth.uid() = owner_user_id);
drop policy if exists "businesses read owner member or public" on public.businesses;
create policy "businesses read owner member or public" on public.businesses for select using (
  auth.uid() = owner_user_id
  or public.is_business_member(id)
  or status = 'published'
);
drop policy if exists "businesses update owner admin" on public.businesses;
create policy "businesses update owner admin" on public.businesses for update using (
  auth.uid() = owner_user_id or public.has_business_role(id, array['owner','admin'])
) with check (
  auth.uid() = owner_user_id or public.has_business_role(id, array['owner','admin'])
);

drop policy if exists "members read same business" on public.business_members;
create policy "members read same business" on public.business_members for select using (
  user_id = auth.uid() or public.is_business_member(business_id)
);
drop policy if exists "members insert owner admin" on public.business_members;
create policy "members insert owner admin" on public.business_members for insert with check (
  public.has_business_role(business_id, array['owner','admin'])
  or exists (
    select 1 from public.businesses b
    where b.id = business_members.business_id
      and b.owner_user_id = auth.uid()
      and business_members.user_id = auth.uid()
  )
);
drop policy if exists "members update owner admin" on public.business_members;
create policy "members update owner admin" on public.business_members for update using (
  public.has_business_role(business_id, array['owner','admin'])
) with check (
  public.has_business_role(business_id, array['owner','admin'])
);

drop policy if exists "websites read permitted or published" on public.websites;
create policy "websites read permitted or published" on public.websites for select using (
  published = true
  or exists (
    select 1 from public.businesses b
    where b.id = websites.business_id
      and (b.owner_user_id = auth.uid() or public.is_business_member(b.id))
  )
);
drop policy if exists "websites insert owner admin" on public.websites;
create policy "websites insert owner admin" on public.websites for insert with check (
  public.has_business_role(business_id, array['owner','admin'])
  or exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = auth.uid())
);
drop policy if exists "websites update owner admin" on public.websites;
create policy "websites update owner admin" on public.websites for update using (
  public.has_business_role(business_id, array['owner','admin'])
  or exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = auth.uid())
) with check (
  public.has_business_role(business_id, array['owner','admin'])
  or exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = auth.uid())
);

drop policy if exists "pages read permitted or public" on public.website_pages;
create policy "pages read permitted or public" on public.website_pages for select using (
  exists (
    select 1 from public.websites w
    join public.businesses b on b.id = w.business_id
    where w.id = website_pages.website_id
      and (
        (w.published = true and website_pages.enabled = true and b.status = 'published')
        or b.owner_user_id = auth.uid()
        or public.is_business_member(b.id)
      )
  )
);
drop policy if exists "pages manage owner admin editor" on public.website_pages;
create policy "pages manage owner admin editor" on public.website_pages for all using (
  exists (
    select 1 from public.websites w
    join public.businesses b on b.id = w.business_id
    where w.id = website_pages.website_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin','editor']))
  )
) with check (
  exists (
    select 1 from public.websites w
    join public.businesses b on b.id = w.business_id
    where w.id = website_pages.website_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin','editor']))
  )
);

drop policy if exists "settings read permitted or public" on public.business_settings;
create policy "settings read permitted or public" on public.business_settings for select using (
  exists (
    select 1 from public.businesses b
    left join public.websites w on w.business_id = b.id
    where b.id = business_settings.business_id
      and (b.owner_user_id = auth.uid() or public.is_business_member(b.id) or (b.status = 'published' and w.published = true))
  )
);
drop policy if exists "settings manage owner admin" on public.business_settings;
create policy "settings manage owner admin" on public.business_settings for all using (
  exists (
    select 1 from public.businesses b
    where b.id = business_settings.business_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin']))
  )
) with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_settings.business_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin']))
  )
);

drop policy if exists "media read permitted or public" on public.media;
create policy "media read permitted or public" on public.media for select using (
  exists (
    select 1 from public.businesses b
    left join public.websites w on w.business_id = b.id
    where b.id = media.business_id
      and (b.owner_user_id = auth.uid() or public.is_business_member(b.id) or (b.status = 'published' and w.published = true))
  )
);
drop policy if exists "media manage owner admin editor" on public.media;
create policy "media manage owner admin editor" on public.media for all using (
  exists (
    select 1 from public.businesses b
    where b.id = media.business_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin','editor']))
  )
) with check (
  exists (
    select 1 from public.businesses b
    where b.id = media.business_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin','editor']))
  )
);
