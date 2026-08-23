-- BeyondEight Instagram integration (official Meta/Instagram API only).
-- Run once in Supabase SQL Editor. Tokens remain private and are encrypted by
-- the Vercel server layer before storage. Never expose the service-role key.

create extension if not exists pgcrypto;

create table if not exists public.instagram_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  instagram_user_id text not null,
  username text not null,
  account_type text,
  access_token_encrypted text,
  token_iv text,
  token_auth_tag text,
  token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  last_error text,
  is_active boolean not null default true,
  show_on_website boolean not null default true,
  post_limit integer not null default 6 check (post_limit in (4, 6)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.instagram_media_cache (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  instagram_media_id text not null,
  media_type text not null,
  media_url text,
  thumbnail_url text,
  permalink text not null,
  caption text,
  posted_at timestamptz,
  fetched_at timestamptz not null default now(),
  unique (business_id, instagram_media_id)
);

create table if not exists public.instagram_oauth_states (
  state_hash text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  return_to text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists instagram_connections_user_idx on public.instagram_connections(user_id);
create index if not exists instagram_media_business_date_idx on public.instagram_media_cache(business_id, posted_at desc);
create index if not exists instagram_oauth_states_expiry_idx on public.instagram_oauth_states(expires_at);

drop trigger if exists set_instagram_connections_updated_at on public.instagram_connections;
create trigger set_instagram_connections_updated_at before update on public.instagram_connections
for each row execute function public.set_updated_at();

alter table public.instagram_connections enable row level security;
alter table public.instagram_media_cache enable row level security;
alter table public.instagram_oauth_states enable row level security;

-- Token-bearing rows and OAuth state are server-only. No browser policies are
-- intentionally created; Vercel functions access them with the service role.

drop policy if exists "instagram media owner or published read" on public.instagram_media_cache;
create policy "instagram media owner or published read"
on public.instagram_media_cache for select using (
  exists (
    select 1
    from public.businesses b
    left join public.websites w on w.business_id = b.id
    join public.instagram_connections ic on ic.business_id = b.id
    where b.id = instagram_media_cache.business_id
      and ic.is_active = true
      and ic.show_on_website = true
      and (
        b.owner_user_id = auth.uid()
        or public.is_business_member(b.id)
        or (b.status = 'published' and w.published = true)
      )
  )
);

notify pgrst, 'reload schema';
