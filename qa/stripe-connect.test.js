const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const shared = read("api/_lib/shared.js");
const instagramLib = read("api/_lib/instagram.js");
const stripeLib = read("api/_lib/stripe.js");
const connect = read("api/stripe/connect.js");
const callback = read("api/stripe/callback.js");
const manage = read("api/stripe/manage.js");
const checkout = read("api/stripe/checkout.js");
const webhook = read("api/stripe/webhook.js");
const dashboard = read("dashboard.js");
const publicSite = read("public-site.js");
const services = read("app-services.js");
const schema = read("supabase-stripe-connect.sql");

// _lib/shared.js must exist so instagram.js and stripe.js aren't duplicating
// getUser/assertBusinessAccess/db/sendError between themselves.
assert.match(shared, /const required = /);
assert.match(shared, /const db = async/);
assert.match(shared, /const getUser = async/);
assert.match(shared, /const assertBusinessAccess = async/);
assert.match(shared, /const sendError = /);
assert.match(instagramLib, /require\("\.\/shared"\)/, "instagram.js must reuse shared.js instead of redefining its own copies");
assert.doesNotMatch(instagramLib, /const assertBusinessAccess = async/, "assertBusinessAccess must not be duplicated in instagram.js");

// api/_lib/stripe.js
assert.match(stripeLib, /const stripeRequest = async/);
assert.match(stripeLib, /const verifyWebhookSignature = /);
assert.match(stripeLib, /Authorization: `Basic \$\{Buffer\.from/, "Stripe auth must use Basic auth with the secret key, matching the REST-only (no SDK) pattern");
assert.match(stripeLib, /timingSafeEqual/, "webhook signature comparison must be constant-time");

// connect.js / callback.js / manage.js: owner-authed Connect onboarding flow
assert.match(connect, /assertBusinessAccess/);
assert.match(connect, /type: "express"/);
assert.match(connect, /account_onboarding/);
// Without explicitly requesting these, an Express account can end up "charges_enabled"
// yet still reject real charges with "card_payments capability enabled" - this was hit
// live during testing, so both the initial creation and existing-account healing path
// must request them.
const capabilityRequests = connect.match(/capabilities: \{ card_payments: \{ requested: true \}, transfers: \{ requested: true \} \}/g) || [];
assert.equal(capabilityRequests.length, 2, "card_payments/transfers must be requested both when creating a new account and when healing an existing one");
// Stripe's hosted Checkout/onboarding pages default to a generic blue button unless the
// connected account's branding is set - a jarring hand-off from a themed public site.
// Each theme's accent color must be mapped and applied on both the create and heal paths.
assert.match(connect, /THEME_ACCENT_COLORS/);
assert.match(connect, /editorial: "#6b1f34"/);
const brandingApplications = connect.match(/settings: \{ branding \}/g) || [];
assert.equal(brandingApplications.length, 2, "branding must be applied both when creating a new account and when healing an existing one");
assert.match(callback, /charges_enabled: Boolean\(account\.charges_enabled\)/);
assert.match(callback, /view=payments/, "the callback must return the owner to the Payments tab");
assert.match(manage, /assertBusinessAccess/);
assert.match(manage, /action === "disconnect"/);

// checkout.js: public endpoint, must verify the business is published and Stripe is
// actually chargeable before creating a session - mirrors the registrations RLS check.
assert.match(checkout, /status=eq\.published/);
assert.match(checkout, /websites\.published=eq\.true/);
assert.match(checkout, /charges_enabled/);
assert.match(checkout, /mode: "payment"/);

// webhook.js: raw body for signature verification, idempotent registration creation
// Must be the literal `module.exports.config` form, not assigned via an intermediate
// variable - Vercel's build-time detection for disabling the body parser looks for this
// exact pattern, and an indirect assignment silently leaves JSON parsing on, which
// breaks signature verification since the raw body is no longer available. Hit this
// live: every webhook delivery failed with "Invalid signature" until this was fixed.
assert.match(webhook, /module\.exports\.config = \{ api: \{ bodyParser: false \} \};/, "bodyParser must be disabled via the literal module.exports.config form");
assert.match(webhook, /verifyWebhookSignature/);
assert.match(webhook, /checkout\.session\.completed/);
assert.match(webhook, /account\.updated/);
assert.match(webhook, /on_conflict=stripe_checkout_session_id/, "checkout.session.completed must be idempotent against Stripe's at-least-once webhook delivery");
assert.match(webhook, /payment_method: "stripe"/);
assert.match(webhook, /payment_status: "paid"/);

// supabase-stripe-connect.sql: owner-only browser access, no public write path, and the
// unique index the webhook's on_conflict upsert depends on.
assert.match(schema, /owner_user_id = auth\.uid\(\)/);
assert.doesNotMatch(schema, /for insert/i, "there must be no public/browser insert policy - only the service-role webhook writes stripe_connections");
assert.match(schema, /create unique index if not exists registrations_stripe_session_idx/);
// A partial index can't serve as an ON CONFLICT target - Postgres rejects it with
// "there is no unique or exclusion constraint matching the ON CONFLICT specification",
// which broke every webhook-created registration live. The index must be unconditional.
assert.doesNotMatch(schema, /registrations_stripe_session_idx[\s\S]*?where stripe_checkout_session_id is not null/i, "the unique index must not be partial - Postgres can't use a partial index as an ON CONFLICT target");

// dashboard.js: Payments tab gets a Stripe card and a payment-method selector
assert.match(dashboard, /data-owner-stripe/);
assert.match(dashboard, /const bindStripeSettings = /);
assert.match(dashboard, /bindStripeSettings\(root\)/, "bindStripeSettings must actually be wired up in bind()");
assert.match(dashboard, /name="paymentMethod"/);
assert.match(dashboard, /draftState\.paymentMethod=data\.get\("paymentMethod"\)/, "the chosen payment method must be saved with the rest of the website draft");
assert.match(dashboard, /\["payments","Payments"\]/, "Payments must be its own top-level nav tab, not folded into a generic Settings tab");

// The Venmo fields and the Stripe connect card must not both sit permanently visible -
// only the panel matching the selected payment method should show, toggled live.
assert.match(dashboard, /data-venmo-fields/);
assert.match(dashboard, /data-stripe-fields/);
assert.match(dashboard, /data-payment-method-select/);
assert.match(dashboard, /toggleAttribute\("hidden",isStripe\)/, "switching the payment method dropdown must toggle which panel is visible");

// A studio owner with no way to collect money must not be able to publish bookable
// classes - adding a class is gated on having at least one payment method configured.
assert.match(dashboard, /const hasPaymentMethod = \(\) => /);
assert.match(dashboard, /if \(index < 0 && !hasPaymentMethod\(\)\)/, "creating a new class must be blocked until Venmo or Stripe is configured");
assert.match(dashboard, /stripeChargesEnabled=Boolean\(bundle\.stripeChargesEnabled\)/, "the payment gate must reflect live Stripe status from the bundle on load");

// app-services.js: both bundle fetchers must expose live Stripe status so the public
// booking flow can decide whether "Pay with Card" is actually usable.
assert.match(services, /getBusinessBundle = async \(businessId\) => \{[\s\S]*?stripeChargesEnabled: Boolean\(stripeConnection\?\.charges_enabled\)/);
assert.match(services, /getBusinessBundleBySlug = async \(slug\) => \{[\s\S]*?stripeChargesEnabled: Boolean\(stripeConnection\?\.charges_enabled\)/);

// public-site.js: the choreographer's chosen method decides Venmo vs. Stripe, not the student
assert.match(publicSite, /const usesStripe = \(\) => state\.paymentMethod === "stripe" && state\.stripeChargesEnabled/);
assert.match(publicSite, /\/api\/stripe\/checkout/);
assert.match(publicSite, /bookingReturnBanner/);

console.log("stripe connect regression tests passed");
