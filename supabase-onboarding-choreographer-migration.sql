-- BeyondEight onboarding simplification migration.
-- Run after the main schema/repair script if your Supabase project predates
-- the independent-choreographer onboarding flow.

alter table public.businesses add column if not exists slug text;
alter table public.businesses alter column business_type drop not null;

alter table public.business_settings add column if not exists dance_styles jsonb not null default '[]'::jsonb;
alter table public.business_settings add column if not exists selected_pages jsonb not null default '[]'::jsonb;
alter table public.business_settings add column if not exists generated_content jsonb not null default '{}'::jsonb;

create unique index if not exists businesses_slug_unique_idx on public.businesses(slug);

notify pgrst, 'reload schema';
