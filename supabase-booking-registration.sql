create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  website_id uuid not null references public.websites(id) on delete cascade,
  class_id text not null,
  student_name text not null,
  student_email text not null,
  student_phone text not null,
  notes text not null default '',
  payment_method text not null default 'venmo',
  payment_status text not null default 'payment_pending_verification',
  class_snapshot jsonb not null default '{}'::jsonb,
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists registrations_business_id_idx on public.registrations(business_id);
create index if not exists registrations_class_id_idx on public.registrations(class_id);
alter table public.registrations enable row level security;

drop policy if exists "registrations public create for published website" on public.registrations;
create policy "registrations public create for published website" on public.registrations for insert with check (
  exists (
    select 1 from public.websites w
    join public.businesses b on b.id = w.business_id
    where w.id = registrations.website_id
      and w.business_id = registrations.business_id
      and w.published = true
      and b.status = 'published'
  )
);
drop policy if exists "registrations owner read" on public.registrations;
create policy "registrations owner read" on public.registrations for select using (
  exists (select 1 from public.businesses b where b.id = registrations.business_id and b.owner_user_id = auth.uid())
);
drop policy if exists "registrations owner update" on public.registrations;
create policy "registrations owner update" on public.registrations for update using (
  exists (select 1 from public.businesses b where b.id = registrations.business_id and b.owner_user_id = auth.uid())
) with check (
  exists (select 1 from public.businesses b where b.id = registrations.business_id and b.owner_user_id = auth.uid())
);
drop policy if exists "registrations owner delete" on public.registrations;
create policy "registrations owner delete" on public.registrations for delete using (
  exists (select 1 from public.businesses b where b.id = registrations.business_id and b.owner_user_id = auth.uid())
);

notify pgrst, 'reload schema';
