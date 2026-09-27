const { db, getUser, assertBusinessAccess, sendError } = require("../_lib/shared");
const { stripeRequest } = require("../_lib/stripe");

const appOrigin = () => (process.env.PUBLIC_APP_URL || "https://beyond8dance.com").replace(/\/$/, "");

module.exports = async (request, response) => {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  try {
    const user = await getUser(request);
    const businessId = request.body?.businessId;
    await assertBusinessAccess(user.id, businessId);
    const existing = await db(`stripe_connections?select=stripe_account_id&business_id=eq.${encodeURIComponent(businessId)}&limit=1`);
    let accountId = existing?.[0]?.stripe_account_id;
    if (!accountId) {
      const account = await stripeRequest("/accounts", { method: "POST", body: { type: "express", email: user.email || undefined } });
      accountId = account.id;
      await db("stripe_connections?on_conflict=business_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ business_id: businessId, stripe_account_id: accountId, connected_at: new Date().toISOString() })
      });
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
