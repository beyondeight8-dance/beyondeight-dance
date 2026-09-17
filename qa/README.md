# Persistence regression checks

Run `npm ci --prefix qa`, then `npm --prefix qa test` from the repository root.

The class persistence suite executes the actual migration in PGlite (Postgres),
using authenticated and anonymous database roles. It covers normalization,
error propagation, missing sessions, draft/public separation, create, edit,
duplicate IDs, highlight, unpublish, delete, migration reruns and cross-owner RLS.
It does not substitute for live browser, storage, or Google login verification.

Production requires `supabase-class-persistence.sql` before deploying the
dashboard that calls `mutate_class`. This migration retains JSON class storage
in `website_drafts.content` and `websites.published_content`; there is no separate
classes table. Owners are resolved through `businesses.owner_user_id = auth.uid()`.
