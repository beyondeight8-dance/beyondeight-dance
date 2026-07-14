# BeyondEight Supabase Setup

This app uses Supabase Auth for identity and Supabase Postgres for persistent onboarding, business settings, website pages, and published client websites.

## 1. Run the database migration

1. Open Supabase.
2. Go to **SQL Editor**.
3. Paste and run the full contents of `supabase-schema.sql`.

The migration creates the application tables, indexes, update triggers, Row Level Security policies, and public read policies for published websites.

You can safely run `supabase-schema.sql` again if Supabase reports a missing column such as `profiles.avatar_url`. The file includes `alter table ... add column if not exists` repair statements for databases that were created before the latest schema.

## 2. Configure Auth URLs

In **Authentication > URL Configuration**:

- Site URL, local: `http://127.0.0.1:8080`
- Site URL, deployed: your public app URL

Add redirect URLs:

- `http://127.0.0.1:8080/auth/callback/`
- `http://localhost:8080/auth/callback/`
- `https://YOUR-PUBLIC-DOMAIN/auth/callback/`

## 3. Configure Google provider

In **Authentication > Providers > Google**:

- Enable Google.
- Add your Google OAuth Client ID.
- Add your Google OAuth Client Secret.

In Google Cloud Console, add this authorized redirect URI:

- `https://awycvqzoijlwivxjgzak.supabase.co/auth/v1/callback`

## 4. Configure frontend environment

For the current static prototype, `app-config.js` provides the browser Supabase settings. For build-based hosting, use the variables from `.env.example`:

```bash
SUPABASE_URL=https://awycvqzoijlwivxjgzak.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
```

Never put a Supabase service-role key in browser code.

## 5. Production notes

- Email/password signup is handled by Supabase Auth. Do not store passwords in application tables.
- Public websites are readable only when the related website is published.
- Draft business, website, page, media, and settings records are protected by RLS.
- The first version publishes website edits immediately when the owner clicks **Publish Changes**.
