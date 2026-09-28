# Stripe Embedded Checkout — Integration TODO

This integration moved card payments from redirecting to a Stripe-hosted checkout
page to an embedded Checkout Form rendered directly on the booking page. This is
the single source of truth for what's left to do before it's safe to rely on in
production.

## ⚠️ Needs live verification before you trust this

An existing, already-live Checkout Session call was found (`api/stripe/checkout.js`)
and only its parameters were changed — no new files, no restructuring — per the
integration instructions. But the specific API surface this integration relies on
(`ui_mode: "form"`, the `Stripe-Version: 2026-03-25.dahlia; custom_checkout_payment_form_preview=v1`
header, `stripe.initCheckoutFormSdk(...)`, the `custom_checkout_payment_form_1` beta
flag, and the `https://js.stripe.com/dahlia/stripe.js` build) could not be checked
against Stripe's live API or docs from this environment — there is no network access
to Stripe here, and this project has never used the Stripe npm SDK (every call is a
hand-rolled REST request), so there was nothing in the codebase to cross-check
against either. Before this replaces the working redirect flow in production:

1. Run one real test-mode booking end to end (see **Testing** below) and confirm the
   embedded form actually renders and the registration shows up as **Paid**.
2. If creating the Checkout Session fails immediately with an error mentioning
   `return_url` — the old `success_url`/`cancel_url` params were removed because they
   weren't part of the Checkout Studio config and the client-side flow no longer
   navigates away from the page. If the live API rejects the session for missing a
   return URL (e.g. for cards that need 3D Secure authentication), that's the first
   thing to add back.
3. The `Stripe-Version` header is set once in `api/_lib/stripe.js` and applies to
   *every* Stripe API call this project makes (account creation, Connect onboarding,
   branding updates — not just checkout). If anything in the existing Stripe Connect
   onboarding flow starts behaving differently, this pinned preview version is the
   first thing to suspect.

## Values to Replace

✅ Done — `STRIPE_PUBLISHABLE_KEY` in [app-config.js](app-config.js) has been set to the
real **test-mode** publishable key. No placeholders remain. When this integration
moves to live payments, that value needs to be swapped for the **live-mode**
publishable key (Stripe Dashboard → toggle out of Test mode → API keys) — test and
live keys are different values, and this one is still `pk_test_...`.

Everything else the Checkout Session already sent (`mode: "payment"`, the dynamic
`line_items` built from each class's real price/title, `metadata`, `customer_email`)
already had real, working values before this change and was left untouched, per the
integration rules — only the Checkout Studio UI parameters below were added.

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly
in the code.

**Files containing these parameters:**
- [api/stripe/checkout.js](api/stripe/checkout.js)
- [public-site.js](public-site.js) (client-side form appearance)

| Parameter | Value |
|-----------|-------|
| `ui_mode` | `form` |
| `billing_address_collection` | `auto` |
| `phone_number_collection.enabled` | `false` |
| `automatic_tax.enabled` | `false` |
| `submit_type` | `auto` |
| `name_collection.individual.enabled` | `true` (optional) |
| `integration_identifier` | `custom_embedded_web_0001` |

`payment_method_collection` was intentionally **not** added — it only applies when
`mode: "subscription"`, and this integration books one-time class payments
(`mode: "payment"`).

## Setup and next steps

### Environment / keys
- `STRIPE_PUBLISHABLE_KEY` in `app-config.js` — see **Values to Replace** above.
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` were already configured in Vercel
  from the original Stripe Connect setup earlier this project — no change needed.

### What changed (no new files)
This project already had a working Checkout Session call, so per the integration
rules this was a parameter-level change only:
- `api/_lib/stripe.js` — added the required `Stripe-Version` header to every request.
- `api/stripe/checkout.js` — added the Checkout Studio UI parameters, and the
  endpoint now returns `{ client_secret }` instead of `{ url }`.
- `app-services.js` — the public business bundle now also exposes `stripeAccountId`
  (the instructor's connected account id), needed to scope Stripe.js correctly.
- `public-site.js` — the booking flow now loads the embedded Checkout Form instead
  of redirecting; see the flow overview below.
- `404.html` (the public-site shell) — loads `stripe.js` directly from Stripe.
- `app-config.js` — added the placeholder `STRIPE_PUBLISHABLE_KEY`.
- `styles.css` — minimal styles for the embedded form's loading state.

### How it works
1. A student fills out the booking form and picks Card as the payment method.
2. The client immediately calls `POST /api/stripe/checkout`, same as before — this
   still creates the Checkout Session directly on the instructor's own connected
   Stripe account (this is a Stripe Connect integration: each instructor is paid
   directly, there's no platform fee).
3. Instead of redirecting to `session.url`, the client now gets back
   `session.client_secret`, initializes Stripe.js scoped to that connected account
   (`stripeAccount: ...`), and mounts an embedded payment form directly in the
   booking modal via `stripe.initCheckoutFormSdk(...)`.
4. The student pays without ever leaving the site.
5. **Unchanged:** `api/stripe/webhook.js` still listens for `checkout.session.completed`
   and creates the `registrations` row from the session's `metadata` — this part of
   the flow doesn't care whether the session was hosted or embedded, so it needed no
   changes.

### Testing
Use Stripe's test mode and test card numbers — none of this touches real money
until you switch to live keys:
- Success: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
- Requires authentication (3D Secure): `4000 0025 0000 3155`.
- Declined: `4000 0000 0000 9995`.

Full list: https://docs.stripe.com/testing

### Next steps
- Set the real `STRIPE_PUBLISHABLE_KEY` (see above), then run a real test-mode
  booking and confirm the registration shows as **Paid** in the dashboard.
- If it works, do the same test with a card that requires 3D Secure
  (`4000 0025 0000 3155`) to check the authentication step behaves correctly inside
  the embedded form.
- Resources: https://support.stripe.com and https://docs.stripe.com/mcp
