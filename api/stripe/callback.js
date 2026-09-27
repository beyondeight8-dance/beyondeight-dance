const { db } = require("../_lib/shared");
const { stripeRequest } = require("../_lib/stripe");

const appOrigin = () => (process.env.PUBLIC_APP_URL || "https://beyond8dance.com").replace(/\/$/, "");

module.exports = async (request, response) => {
  const redirect = (status) => response.redirect(302, `${appOrigin()}/dashboard/?view=payments&stripe=${encodeURIComponent(status)}`);
  try {
    const businessId = request.query?.businessId;
    if (!businessId) return redirect("invalid");
    const rows = await db(`stripe_connections?select=stripe_account_id&business_id=eq.${encodeURIComponent(businessId)}&limit=1`);
    const stripeAccountId = rows?.[0]?.stripe_account_id;
    if (!stripeAccountId) return redirect("invalid");
    const account = await stripeRequest(`/accounts/${encodeURIComponent(stripeAccountId)}`);
    await db(`stripe_connections?business_id=eq.${encodeURIComponent(businessId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        charges_enabled: Boolean(account.charges_enabled),
        details_submitted: Boolean(account.details_submitted),
        updated_at: new Date().toISOString()
      })
    });
    redirect(account.charges_enabled ? "connected" : "pending");
  } catch (error) {
    console.error("Stripe OAuth callback failed:", error);
    redirect("failed");
  }
};
