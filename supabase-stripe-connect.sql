-- BeyondEight Stripe Connect integration (Express accounts).
-- Run once in Supabase SQL Editor. No secret material is stored here -
-- Stripe account IDs and status flags are not sensitive, unlike the
-- Instagram integration's access tokens.

create table if not exists public.stripe_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  stripe_account_id text not null,
  charges_enabled boolean not null default false,
  details_submitted boolean not null default false,
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stripe_connections_account_idx on public.stripe_connections(stripe_account_id);

drop trigger if exists set_stripe_connections_updated_at on public.stripe_connections;
create trigger set_stripe_connections_updated_at before update on public.stripe_connections
for each row execute function public.set_updated_at();

alter table public.stripe_connections enable row level security;

-- Owner-only read/write from the browser. Vercel functions (connect, callback,
-- manage, webhook) use the service role and bypass RLS entirely.
drop policy if exists "stripe connections owner read" on public.stripe_connections;
create policy "stripe connections owner read" on public.stripe_connections for select using (
  exists (select 1 from public.businesses b where b.id = stripe_connections.business_id and b.owner_user_id = auth.uid())
);

-- The public booking page needs to know whether a business accepts card
-- payments before showing the "Pay with Card" option.
drop policy if exists "stripe connections published read" on public.stripe_connections;
create policy "stripe connections published read" on public.stripe_connections for select using (
  exists (
    select 1 from public.businesses b
    join public.websites w on w.business_id = b.id
    where b.id = stripe_connections.business_id
      and b.status = 'published'
      and w.published = true
  )
);

-- Stripe can retry webhook deliveries (e.g. if our endpoint times out after the
-- registration was already created), so checkout.session.completed handling
-- needs to be idempotent. This column plus its unique index let the webhook
-- upsert on conflict instead of risking a duplicate booking.
-- A partial index (WHERE stripe_checkout_session_id IS NOT NULL) can't be used as an
-- ON CONFLICT target - Postgres requires an unconditional unique index/constraint for
-- that. A plain unique index still allows unlimited NULLs (every non-Stripe
-- registration), since Postgres never treats NULLs as duplicates of each other; it's
-- only the non-null Stripe session IDs that get the uniqueness/upsert behavior.
alter table public.registrations add column if not exists stripe_checkout_session_id text;
drop index if exists registrations_stripe_session_idx;
create unique index if not exists registrations_stripe_session_idx
  on public.registrations(stripe_checkout_session_id);

notify pgrst, 'reload schema';
