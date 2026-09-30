# BeyondEight — project notes

## Pre-launch TODO: Instagram App Review (tabled for now)

The Instagram integration (`api/instagram/*`, `bindInstagramEditor` in `dashboard.js`) currently
only works for Instagram accounts manually added as **testers** in the Meta App Dashboard — the
app is still in Development mode. This is fine for testing with a handful of real users, but it
will NOT work for the general public until the app goes through Meta's **App Review** and is
switched to Live mode.

Revisit this when close to rolling out the product publicly. What's needed at that point:

1. **Build real `/privacy` and `/terms` pages.** The footer in `index.html` already links to
   `/privacy` and `/terms`, but neither route/page actually exists yet — they're dead links.
   Meta requires a working, publicly-reachable Privacy Policy URL before you can even start an
   App Review submission.
2. **Build a Data Deletion Instructions page/endpoint.** Required by the Instagram API alongside
   the privacy policy — explains how a user can request their data be deleted.
3. **Submit for App Review** requesting the `instagram_business_basic` permission. This needs a
   screen recording showing the exact use: owner clicks Connect Instagram in the dashboard →
   approves on Instagram's side → an imported photo shows up when creating a class. The user
   needs to record this themselves (no live-Instagram-login browser access in this environment).
4. Once approved, switch the app from Development to **Live** mode in the Meta App Dashboard —
   only then can any business owner's Instagram Business/Creator account connect without being
   manually added as a tester first.

Drafting the three pages above is something Claude can do directly when asked — content should
be specific to what BeyondEight actually collects (student bookings, Venmo/Stripe payment
status, Instagram photos imported by the owner), not generic boilerplate. Still needs a lawyer's
sanity check before it's truly final, but a specific draft beats a placeholder.
