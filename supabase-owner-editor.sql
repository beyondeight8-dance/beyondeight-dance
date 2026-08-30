-- Keep public website content and private owner drafts in separate tables.
alter table public.websites add column if not exists published_content jsonb not null default '{}'::jsonb;

create table if not exists public.website_drafts (
  website_id uuid primary key references public.websites(id) on delete cascade,
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.website_drafts enable row level security;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'websites' and column_name = 'draft_content'
  ) then
    execute 'insert into public.website_drafts (website_id, business_id, content, updated_at)
      select id, business_id, draft_content, coalesce(draft_updated_at, updated_at, now()) from public.websites
      where draft_content <> ''{}''::jsonb
      on conflict (website_id) do update set content = excluded.content, updated_at = excluded.updated_at';
  end if;
end $$;

alter table public.websites drop column if exists draft_content;
alter table public.websites drop column if exists draft_updated_at;

drop policy if exists "website drafts owner read" on public.website_drafts;
create policy "website drafts owner read" on public.website_drafts for select using (
  exists (select 1 from public.businesses b where b.id = website_drafts.business_id and b.owner_user_id = auth.uid())
);
drop policy if exists "website drafts owner insert" on public.website_drafts;
create policy "website drafts owner insert" on public.website_drafts for insert with check (
  exists (select 1 from public.businesses b where b.id = website_drafts.business_id and b.owner_user_id = auth.uid())
);
drop policy if exists "website drafts owner update" on public.website_drafts;
create policy "website drafts owner update" on public.website_drafts for update using (
  exists (select 1 from public.businesses b where b.id = website_drafts.business_id and b.owner_user_id = auth.uid())
) with check (
  exists (select 1 from public.businesses b where b.id = website_drafts.business_id and b.owner_user_id = auth.uid())
);

update public.websites w
set published_content = s.generated_content,
    updated_at = coalesce(w.updated_at, now())
from public.business_settings s
where s.business_id = w.business_id
  and w.published = true
  and w.published_content = '{}'::jsonb;

insert into public.website_drafts (website_id, business_id, content, updated_at)
select w.id, w.business_id, coalesce(nullif(w.published_content, '{}'::jsonb), s.generated_content, '{}'::jsonb), coalesce(w.updated_at, now())
from public.websites w
left join public.business_settings s on s.business_id = w.business_id
on conflict (website_id) do nothing;

notify pgrst, 'reload schema';
