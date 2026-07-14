-- BeyondEight repair for old schemas with legacy required columns.
-- Run this if Supabase reports null values in legacy owner_id/business_id/slug columns.

do $$
declare
  legacy_table text;
begin
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
