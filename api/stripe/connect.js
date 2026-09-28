const { db, getUser, assertBusinessAccess, sendError } = require("../_lib/shared");
const { stripeRequest } = require("../_lib/stripe");

const appOrigin = () => (process.env.PUBLIC_APP_URL || "https://beyond8dance.com").replace(/\/$/, "");

// Matches --site-accent per theme in styles.css. Stripe's hosted Checkout/onboarding
// pages read branding from the connected account, not from the session - a plain
// default blue button reads as a jarring, generic hand-off from a themed site, so this
// gives each business's checkout the same accent color as their own public site.
const THEME_ACCENT_COLORS = {
  editorial: "#6b1f34",
  studio: "#1d4ed8",
  electric: "#ff2f8f",
  noir: "#d0185c",
  muse: "#b5623a",
  motion: "#1650ff"
};
const brandingFor = (business) => ({ primary_color: THEME_ACCENT_COLORS[business.theme] || "#a8675f" });

module.exports = async (request, response) => {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  try {
    const user = await getUser(request);
    const businessId = request.body?.businessId;
    const business = await assertBusinessAccess(user.id, businessId);
    const branding = brandingFor(business);
    const existing = await db(`stripe_connections?select=stripe_account_id&business_id=eq.${encodeURIComponent(businessId)}&limit=1`);
    let accountId = existing?.[0]?.stripe_account_id;
    if (!accountId) {
      const account = await stripeRequest("/accounts", {
        method: "POST",
        body: {
          type: "express",
          email: user.email || undefined,
          capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
          settings: { branding }
        }
      });
      accountId = account.id;
      await db("stripe_connections?on_conflict=business_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ business_id: businessId, stripe_account_id: accountId, connected_at: new Date().toISOString() })
      });
    } else {
      // Self-heals accounts connected before capabilities/branding were set at creation
      // time - a harmless no-op if they're already active/correct. Without this, an
      // existing connection can look "charges_enabled" yet still reject real charges,
      // and keeps showing Stripe's generic default branding instead of the site's own.
      await stripeRequest(`/accounts/${encodeURIComponent(accountId)}`, {
        method: "POST",
        body: { capabilities: { card_payments: { requested: true }, transfers: { requested: true } }, settings: { branding } }
      }).catch((error) => console.warn("Stripe capability/branding re-request failed:", error.message));
    }
    const returnUrl = `${appOrigin()}/api/stripe/callback?businessId=${encodeURIComponent(businessId)}`;
    const link = await stripeRequest("/account_links", {
      method: "POST",
      body: { account: accountId, refresh_url: returnUrl, return_url: returnUrl, type: "account_onboarding" }
    });
    response.status(200).json({ authorizationUrl: link.url });
  } catch (error) {
    sendError(response, error, { label: "Stripe" });
  }
};
