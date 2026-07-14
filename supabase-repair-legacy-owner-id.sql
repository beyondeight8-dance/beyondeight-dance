-- BeyondEight repair for old schemas with businesses.owner_id still marked NOT NULL.
-- Run this if Supabase reports: null value in column "owner_id" of relation "businesses" violates not-null constraint.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'businesses'
      and column_name = 'owner_id'
  ) then
    alter table public.businesses alter column owner_id drop not null;

    update public.businesses
    set owner_user_id = coalesce(owner_user_id, owner_id)
    where owner_user_id is null
      and owner_id is not null;
  end if;
end $$;

notify pgrst, 'reload schema';
