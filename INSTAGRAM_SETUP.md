# Official Instagram integration setup

BeyondEight uses **Instagram API with Instagram Login** for Creator and Business accounts. It does not use the retired Basic Display API, page scraping, embeds, or unofficial libraries.

## 1. Database

Run `supabase-instagram-integration.sql` once in Supabase SQL Editor. The migration creates:

- `instagram_connections`: private connection metadata and encrypted tokens.
- `instagram_media_cache`: normalized media metadata used by published sites.
- `instagram_oauth_states`: short-lived, one-use OAuth state records for CSRF protection.

RLS remains enabled. Token and OAuth-state tables have no browser policies. Only Vercel server functions use the Supabase service role.

## 2. Vercel environment variables

Add every variable listed in `.env.example` to the feature-branch Preview environment. Do not prefix server secrets with `VITE_`, `NEXT_PUBLIC_`, or any other public prefix.

Generate `INSTAGRAM_TOKEN_ENCRYPTION_KEY` as 32 random bytes, encoded as either 64 hexadecimal characters or base64. Keep it stable: changing it prevents existing tokens from being decrypted.

## 3. Meta app

In Meta for Developers:

1. Add the Instagram product and configure **Instagram API with Instagram Login**.
2. Add the exact `META_INSTAGRAM_REDIRECT_URI` as an allowed OAuth redirect URI.
3. Add the feature preview and production domains to the app's allowed domains as appropriate.
4. Request only `instagram_business_basic` for profile and media read access.
5. Add test Creator/Business accounts while the Meta app is in Development mode.
6. Complete Meta App Review before allowing customers who are not app-role testers.

Personal Instagram accounts are not supported by this professional-account API. BeyondEight keeps the typed Instagram handle as a normal profile link and explains how to switch to a Creator or Business account.

## 4. Refresh and caching

Public pages call `/api/instagram/feed`, which reads normalized Supabase cache. If the cache is older than 30 minutes, the server refreshes it from Meta. API failures return the last cached media and never expose errors publicly. Long-lived tokens are refreshed server-side when they are within seven days of expiry.

## 5. Security notes

- Tokens are encrypted with AES-256-GCM before database storage.
- OAuth state is random, hashed in storage, expires after ten minutes, and is one-use.
- The Meta App Secret, service-role key, and access tokens never enter browser code.
- Disconnect attempts to revoke permissions and always erases the stored encrypted token.
- Production should additionally monitor refresh failures and rotate encryption keys with a managed re-encryption process.
