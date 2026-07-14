-- BeyondEight targeted repair for older Supabase schemas.
-- Run this if Supabase reports: column businesses.owner_user_id does not exist.

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

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

create index if not exists businesses_owner_user_id_idx on public.businesses(owner_user_id);
create index if not exists businesses_slug_idx on public.businesses(slug);
create unique index if not exists businesses_slug_unique_idx on public.businesses(slug);

notify pgrst, 'reload schema';
