-- BeyondEight repair for old schemas with legacy owner_id columns still marked NOT NULL.
-- Run this if Supabase reports: null value in column "owner_id" violates not-null constraint.

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
end $$;

notify pgrst, 'reload schema';
