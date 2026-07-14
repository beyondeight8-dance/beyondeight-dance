-- BeyondEight targeted RLS repair.
-- Run this if Supabase reports row-level security errors while creating a
-- business, saving onboarding settings, or publishing a website.

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
