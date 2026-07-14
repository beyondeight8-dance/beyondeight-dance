-- BeyondEight logo and image storage setup
-- Run in Supabase Dashboard > SQL Editor after supabase-schema.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-media',
  'business-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.businesses add column if not exists logo_url text;

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

create index if not exists media_business_id_idx on public.media(business_id);

alter table public.media enable row level security;

drop policy if exists "media read permitted or public" on public.media;
create policy "media read permitted or public" on public.media for select using (
  exists (
    select 1 from public.businesses b
    left join public.websites w on w.business_id = b.id
    where b.id = media.business_id
      and (b.owner_user_id = auth.uid() or (b.status = 'published' and w.published = true))
  )
);

drop policy if exists "media manage owner" on public.media;
create policy "media manage owner" on public.media for all using (
  exists (
    select 1 from public.businesses b
    where b.id = media.business_id
      and b.owner_user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.businesses b
    where b.id = media.business_id
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Public read business media" on storage.objects;
create policy "Public read business media" on storage.objects for select using (
  bucket_id = 'business-media'
);

drop policy if exists "Owners upload business media" on storage.objects;
create policy "Owners upload business media" on storage.objects for insert with check (
  bucket_id = 'business-media'
  and exists (
    select 1
    from public.businesses b
    where b.id::text = (storage.foldername(name))[1]
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Owners update business media" on storage.objects;
create policy "Owners update business media" on storage.objects for update using (
  bucket_id = 'business-media'
  and exists (
    select 1
    from public.businesses b
    where b.id::text = (storage.foldername(name))[1]
      and b.owner_user_id = auth.uid()
  )
) with check (
  bucket_id = 'business-media'
  and exists (
    select 1
    from public.businesses b
    where b.id::text = (storage.foldername(name))[1]
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Owners delete business media" on storage.objects;
create policy "Owners delete business media" on storage.objects for delete using (
  bucket_id = 'business-media'
  and exists (
    select 1
    from public.businesses b
    where b.id::text = (storage.foldername(name))[1]
      and b.owner_user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
