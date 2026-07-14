-- BeyondEight targeted RLS repair.
-- Run this if Supabase reports: new row violates row-level security policy for table "businesses".

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

notify pgrst, 'reload schema';
