-- BeyondEight live schema stabilizer.
-- Run this when Supabase reports null values in old required columns during publish.
--
-- Why this exists:
-- Some live projects were created before the current schema and may still have
-- old NOT NULL columns such as owner_id, business_id, or slug on tables where
-- the current app no longer writes them. This script keeps the current app
-- schema intact and relaxes only unexpected legacy required columns.

do $$
declare
  legacy_table text;
  legacy_column record;
begin
  -- Known legacy owner aliases should never block current writes.
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

  -- Relax any unexpected app-table columns that are still required from an
  -- older prototype schema. Current required columns are excluded below.
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

notify pgrst, 'reload schema';

-- This should return zero rows. If it returns anything, that column is still a
-- required field with no default and may need a deliberate app/schema decision.
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
