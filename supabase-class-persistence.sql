-- Run once in the production SQL editor. Safe to rerun; preserves existing content.
begin;

alter table public.websites add column if not exists published_content jsonb not null default '{}'::jsonb;
create table if not exists public.website_drafts (
  website_id uuid primary key references public.websites(id) on delete cascade,
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.website_drafts enable row level security;
grant select, insert, update, delete on public.website_drafts to authenticated;
revoke all on public.website_drafts from anon;

-- A draft must belong to both the authenticated owner and the matching website.
drop policy if exists "website drafts owner read" on public.website_drafts;
drop policy if exists "website drafts owner insert" on public.website_drafts;
drop policy if exists "website drafts owner update" on public.website_drafts;
drop policy if exists "website drafts owner manage" on public.website_drafts;
create policy "website drafts owner manage" on public.website_drafts for all to authenticated
using (exists (
  select 1 from public.websites w join public.businesses b on b.id = w.business_id
  where w.id = website_drafts.website_id and b.id = website_drafts.business_id and b.owner_user_id = auth.uid()
)) with check (exists (
  select 1 from public.websites w join public.businesses b on b.id = w.business_id
  where w.id = website_drafts.website_id and b.id = website_drafts.business_id and b.owner_user_id = auth.uid()
));

-- Seed private state before filtering the public class list.
insert into public.website_drafts (website_id, business_id, content)
select w.id, w.business_id, coalesce(nullif(w.published_content, '{}'::jsonb), s.generated_content, '{}'::jsonb)
from public.websites w left join public.business_settings s on s.business_id = w.business_id
on conflict (website_id) do nothing;

update public.websites w set published_content = s.generated_content
from public.business_settings s where s.business_id = w.business_id and w.published
  and w.published_content = '{}'::jsonb and s.generated_content is not null;

update public.websites w set published_content = jsonb_set(w.published_content, '{classes}',
  coalesce((select jsonb_agg(c) from jsonb_array_elements(w.published_content->'classes') c
    where c->'published' is distinct from 'false'::jsonb), '[]'::jsonb))
where jsonb_typeof(w.published_content->'classes') = 'array';

-- Row locks serialize edits; draft and public writes succeed or roll back together.
create or replace function public.mutate_class(p_business_id uuid, p_operation text,
  p_class_id text default null, p_class jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  w public.websites%rowtype;
  d jsonb;
  items jsonb;
  live jsonb;
  item jsonb;
  previous jsonb;
  class_id text := p_class_id;
begin
  if auth.uid() is null or not exists (select 1 from public.businesses
    where id = p_business_id and owner_user_id = auth.uid()) then
    raise exception 'You do not have permission to edit this website.' using errcode = '42501';
  end if;
  select * into w from public.websites where business_id = p_business_id for update;
  if not found then raise exception 'Your website record is missing.'; end if;
  select content into d from public.website_drafts where website_id = w.id for update;
  if not found then raise exception 'Your website draft is missing. Run the class persistence migration.'; end if;
  items := coalesce(d->'classes', '[]'::jsonb);
  live := coalesce(w.published_content->'classes', '[]'::jsonb);
  if jsonb_typeof(items) <> 'array' or jsonb_typeof(live) <> 'array' then
    raise exception 'Stored classes must be an array.';
  end if;
  select c into previous from jsonb_array_elements(items) c where c->>'id' = class_id;
  if p_operation <> 'create' and previous is null then raise exception 'Class no longer exists. Refresh and try again.'; end if;
  if p_operation in ('create', 'update', 'duplicate') then
    if p_operation = 'duplicate' then
      item := previous || jsonb_build_object('title', (previous->>'title') || ' - Copy', 'published', false, 'highlighted', false);
    else
      item := coalesce(previous, '{}'::jsonb) || p_class;
    end if;
    if p_operation in ('create', 'duplicate') then class_id := gen_random_uuid()::text; end if;
    item := item || jsonb_build_object('id', class_id);
    if nullif(trim(item->>'title'), '') is null then raise exception 'Class name is required.'; end if;
    if jsonb_typeof(item->'published') is distinct from 'boolean' then raise exception 'Class publish status is required.'; end if;
    if p_operation <> 'duplicate' then
      if jsonb_typeof(item->'price') is distinct from 'number' or (item->>'price')::numeric < 0 then raise exception 'Price must be a nonnegative number.'; end if;
      if jsonb_typeof(item->'capacity') is distinct from 'number' or (item->>'capacity')::numeric < 1
        or (item->>'capacity')::numeric <> trunc((item->>'capacity')::numeric) then raise exception 'Capacity must be a positive integer.'; end if;
    end if;
    if p_operation = 'update' then
      select coalesce(jsonb_agg(case when c->>'id' = class_id then item else c end), '[]'::jsonb) into items from jsonb_array_elements(items) c;
    else items := items || jsonb_build_array(item);
    end if;
  elsif p_operation = 'delete' then
    select coalesce(jsonb_agg(c), '[]'::jsonb) into items from jsonb_array_elements(items) c where c->>'id' is distinct from class_id;
  elsif p_operation = 'highlight' then
    select coalesce(jsonb_agg(c || jsonb_build_object('highlighted', c->>'id' = class_id and not coalesce((previous->>'highlighted')::boolean, false))), '[]'::jsonb)
      into items from jsonb_array_elements(items) c;
    select coalesce(jsonb_agg(c || jsonb_build_object('highlighted', c->>'id' = class_id and not coalesce((previous->>'highlighted')::boolean, false))), '[]'::jsonb)
      into live from jsonb_array_elements(live) c;
  else raise exception 'Unknown class operation.';
  end if;
  if p_operation <> 'highlight' then
    select coalesce(jsonb_agg(c), '[]'::jsonb) into live from jsonb_array_elements(live) c
      where c->>'id' is distinct from class_id and c->'published' is distinct from 'false'::jsonb;
    if item->'published' = 'true'::jsonb then live := live || jsonb_build_array(item); end if;
  end if;
  d := jsonb_set(d, '{classes}', items);
  update public.website_drafts set content = d, updated_at = now() where website_id = w.id;
  -- Class changes never promote unrelated website edits or private draft classes.
  update public.websites set published_content = jsonb_set(published_content, '{classes}', live), updated_at = now()
    where id = w.id returning * into w;
  return jsonb_build_object('draft_content', d, 'published_content', w.published_content, 'class_id', class_id);
end;
$$;
revoke all on function public.mutate_class(uuid, text, text, jsonb) from public, anon;
grant execute on function public.mutate_class(uuid, text, text, jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
