-- BeyondEight Supabase repair and verification script.
-- Run this whole file in the Supabase SQL Editor.
--
-- It is intentionally idempotent:
-- - creates missing app tables and columns
-- - repairs legacy required columns from older prototypes
-- - recreates RLS helper functions and policies
-- - reloads PostgREST schema cache
-- - returns diagnostics at the end

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

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid()
);

alter table public.business_members add column if not exists business_id uuid;
alter table public.business_members add column if not exists user_id uuid;
alter table public.business_members add column if not exists role text not null default 'member';
alter table public.business_members add column if not exists created_at timestamptz not null default now();

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
declare
  legacy_table text;
  legacy_column record;
begin
  foreach legacy_table in array array[
    'businesses',
    'websites',
    'website_pages',
    'business_settings',
    'media'
  ]
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = legacy_table
        and column_name = 'owner_id'
    ) then
      execute format('alter table public.%I alter column owner_id drop not null', legacy_table);
    end if;
  end loop;

  for legacy_column in
    select c.table_name, c.column_name
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = any(array[
        'profiles',
        'businesses',
        'business_members',
        'websites',
        'website_pages',
        'business_settings',
        'media'
      ])
      and c.is_nullable = 'NO'
      and c.column_default is null
      and not exists (
        select 1
        from (
          values
            ('profiles', 'id'),
            ('businesses', 'owner_user_id'),
            ('businesses', 'business_name'),
            ('businesses', 'slug'),
            ('business_members', 'business_id'),
            ('business_members', 'user_id'),
            ('websites', 'business_id'),
            ('website_pages', 'website_id'),
            ('website_pages', 'page_type'),
            ('website_pages', 'title'),
            ('business_settings', 'business_id'),
            ('media', 'business_id'),
            ('media', 'storage_path')
        ) as expected(table_name, column_name)
        where expected.table_name = c.table_name
          and expected.column_name = c.column_name
      )
  loop
    execute format(
      'alter table public.%I alter column %I drop not null',
      legacy_column.table_name,
      legacy_column.column_name
    );
  end loop;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'businesses'
      and column_name = 'owner_id'
  ) then
    update public.businesses
    set owner_user_id = coalesce(owner_user_id, owner_id)
    where owner_user_id is null
      and owner_id is not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'website_pages'
      and column_name = 'business_id'
  ) then
    alter table public.website_pages alter column business_id drop not null;

    update public.website_pages wp
    set business_id = w.business_id
    from public.websites w
    where wp.website_id = w.id
      and wp.business_id is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'website_pages'
      and column_name = 'slug'
  ) then
    alter table public.website_pages alter column slug drop not null;

    update public.website_pages
    set slug = coalesce(slug, page_type)
    where slug is null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'businesses_owner_user_id_fkey'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_owner_user_id_fkey
      foreign key (owner_user_id)
      references public.profiles(id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'business_members_business_id_fkey'
      and conrelid = 'public.business_members'::regclass
  ) then
    alter table public.business_members
      add constraint business_members_business_id_fkey
      foreign key (business_id)
      references public.businesses(id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'business_members_user_id_fkey'
      and conrelid = 'public.business_members'::regclass
  ) then
    alter table public.business_members
      add constraint business_members_user_id_fkey
      foreign key (user_id)
      references public.profiles(id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'websites_business_id_fkey'
      and conrelid = 'public.websites'::regclass
  ) then
    alter table public.websites
      add constraint websites_business_id_fkey
      foreign key (business_id)
      references public.businesses(id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'website_pages_website_id_fkey'
      and conrelid = 'public.website_pages'::regclass
  ) then
    alter table public.website_pages
      add constraint website_pages_website_id_fkey
      foreign key (website_id)
      references public.websites(id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'business_settings_business_id_fkey'
      and conrelid = 'public.business_settings'::regclass
  ) then
    alter table public.business_settings
      add constraint business_settings_business_id_fkey
      foreign key (business_id)
      references public.businesses(id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'media_business_id_fkey'
      and conrelid = 'public.media'::regclass
  ) then
    alter table public.media
      add constraint media_business_id_fkey
      foreign key (business_id)
      references public.businesses(id)
      on delete cascade
      not valid;
  end if;
end $$;

create index if not exists businesses_owner_user_id_idx on public.businesses(owner_user_id);
create unique index if not exists businesses_slug_unique_idx on public.businesses(slug);
create unique index if not exists business_members_business_user_unique_idx on public.business_members(business_id, user_id);
create unique index if not exists websites_business_id_unique_idx on public.websites(business_id);
create unique index if not exists website_pages_website_page_type_unique_idx on public.website_pages(website_id, page_type);
create unique index if not exists business_settings_business_id_unique_idx on public.business_settings(business_id);

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

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.websites enable row level security;
alter table public.website_pages enable row level security;
alter table public.business_settings enable row level security;
alter table public.media enable row level security;

drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "businesses insert owner" on public.businesses;
create policy "businesses insert owner" on public.businesses
for insert
with check (auth.uid() is not null and owner_user_id = auth.uid());

drop policy if exists "businesses read owner member or public" on public.businesses;
create policy "businesses read owner member or public" on public.businesses
for select
using (
  auth.uid() = owner_user_id
  or public.is_business_member(id)
  or status = 'published'
);

drop policy if exists "businesses update owner admin" on public.businesses;
create policy "businesses update owner admin" on public.businesses
for update
using (auth.uid() = owner_user_id or public.has_business_role(id, array['owner','admin']))
with check (auth.uid() = owner_user_id or public.has_business_role(id, array['owner','admin']));

drop policy if exists "members read same business" on public.business_members;
create policy "members read same business" on public.business_members
for select
using (user_id = auth.uid() or public.is_business_member(business_id));

drop policy if exists "members insert owner admin" on public.business_members;
create policy "members insert owner admin" on public.business_members
for insert
with check (
  public.has_business_role(business_id, array['owner','admin'])
  or exists (
    select 1
    from public.businesses b
    where b.id = business_members.business_id
      and b.owner_user_id = auth.uid()
      and business_members.user_id = auth.uid()
  )
);

drop policy if exists "members update owner admin" on public.business_members;
create policy "members update owner admin" on public.business_members
for update
using (public.has_business_role(business_id, array['owner','admin']))
with check (public.has_business_role(business_id, array['owner','admin']));

drop policy if exists "websites read permitted or published" on public.websites;
create policy "websites read permitted or published" on public.websites
for select
using (
  published = true
  or exists (
    select 1
    from public.businesses b
    where b.id = websites.business_id
      and (b.owner_user_id = auth.uid() or public.is_business_member(b.id))
  )
);

drop policy if exists "websites insert owner admin" on public.websites;
create policy "websites insert owner admin" on public.websites
for insert
with check (
  exists (
    select 1
    from public.businesses b
    where b.id = websites.business_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin']))
  )
);

drop policy if exists "websites update owner admin" on public.websites;
create policy "websites update owner admin" on public.websites
for update
using (
  exists (
    select 1
    from public.businesses b
    where b.id = websites.business_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin']))
  )
)
with check (
  exists (
    select 1
    from public.businesses b
    where b.id = websites.business_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin']))
  )
);

drop policy if exists "pages read permitted or public" on public.website_pages;
create policy "pages read permitted or public" on public.website_pages
for select
using (
  exists (
    select 1
    from public.websites w
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
create policy "pages manage owner admin editor" on public.website_pages
for all
using (
  exists (
    select 1
    from public.websites w
    join public.businesses b on b.id = w.business_id
    where w.id = website_pages.website_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin','editor']))
  )
)
with check (
  exists (
    select 1
    from public.websites w
    join public.businesses b on b.id = w.business_id
    where w.id = website_pages.website_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin','editor']))
  )
);

drop policy if exists "settings read permitted or public" on public.business_settings;
create policy "settings read permitted or public" on public.business_settings
for select
using (
  exists (
    select 1
    from public.businesses b
    left join public.websites w on w.business_id = b.id
    where b.id = business_settings.business_id
      and (
        b.owner_user_id = auth.uid()
        or public.is_business_member(b.id)
        or (b.status = 'published' and w.published = true)
      )
  )
);

drop policy if exists "settings manage owner admin" on public.business_settings;
create policy "settings manage owner admin" on public.business_settings
for all
using (
  exists (
    select 1
    from public.businesses b
    where b.id = business_settings.business_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin']))
  )
)
with check (
  exists (
    select 1
    from public.businesses b
    where b.id = business_settings.business_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin']))
  )
);

drop policy if exists "media read permitted or public" on public.media;
create policy "media read permitted or public" on public.media
for select
using (
  exists (
    select 1
    from public.businesses b
    left join public.websites w on w.business_id = b.id
    where b.id = media.business_id
      and (
        b.owner_user_id = auth.uid()
        or public.is_business_member(b.id)
        or (b.status = 'published' and w.published = true)
      )
  )
);

drop policy if exists "media manage owner admin editor" on public.media;
create policy "media manage owner admin editor" on public.media
for all
using (
  exists (
    select 1
    from public.businesses b
    where b.id = media.business_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin','editor']))
  )
)
with check (
  exists (
    select 1
    from public.businesses b
    where b.id = media.business_id
      and (b.owner_user_id = auth.uid() or public.has_business_role(b.id, array['owner','admin','editor']))
  )
);

notify pgrst, 'reload schema';

-- Diagnostic 1: should return zero rows.
with expected_required(table_name, column_name) as (
  values
    ('profiles', 'id'),
    ('businesses', 'owner_user_id'),
    ('businesses', 'business_name'),
    ('businesses', 'slug'),
    ('business_members', 'business_id'),
    ('business_members', 'user_id'),
    ('websites', 'business_id'),
    ('website_pages', 'website_id'),
    ('website_pages', 'page_type'),
    ('website_pages', 'title'),
    ('business_settings', 'business_id'),
    ('media', 'business_id'),
    ('media', 'storage_path')
)
select
  'unexpected_required_column' as diagnostic,
  c.table_name,
  c.column_name,
  c.data_type
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in (
    'profiles',
    'businesses',
    'business_members',
    'websites',
    'website_pages',
    'business_settings',
    'media'
  )
  and c.is_nullable = 'NO'
  and c.column_default is null
  and not exists (
    select 1
    from expected_required er
    where er.table_name = c.table_name
      and er.column_name = c.column_name
  )
order by c.table_name, c.column_name;

-- Diagnostic 2: should return zero rows.
select
  'missing_required_policy' as diagnostic,
  policy_name
from (
  values
    ('profiles select own'),
    ('profiles insert own'),
    ('profiles update own'),
    ('businesses insert owner'),
    ('businesses read owner member or public'),
    ('businesses update owner admin'),
    ('members read same business'),
    ('members insert owner admin'),
    ('members update owner admin'),
    ('websites read permitted or published'),
    ('websites insert owner admin'),
    ('websites update owner admin'),
    ('pages read permitted or public'),
    ('pages manage owner admin editor'),
    ('settings read permitted or public'),
    ('settings manage owner admin'),
    ('media read permitted or public'),
    ('media manage owner admin editor')
) as required(policy_name)
where not exists (
  select 1
  from pg_policies p
  where p.schemaname = 'public'
    and p.policyname = required.policy_name
);
