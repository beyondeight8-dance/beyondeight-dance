const { db, getUser, assertBusinessAccess, sendError } = require("../_lib/shared");
const { stripeRequest } = require("../_lib/stripe");

const connectionForBusiness = async (businessId) => {
  const rows = await db(`stripe_connections?select=*&business_id=eq.${encodeURIComponent(businessId)}&limit=1`);
  return rows?.[0] || null;
};

const publicConnection = (connection) => connection && ({
  connected: Boolean(connection.stripe_account_id),
  chargesEnabled: Boolean(connection.charges_enabled),
  detailsSubmitted: Boolean(connection.details_submitted)
});

module.exports = async (request, response) => {
  try {
    const user = await getUser(request);
    const businessId = request.method === "GET" ? request.query?.businessId : request.body?.businessId;
    await assertBusinessAccess(user.id, businessId);
    let connection = await connectionForBusiness(businessId);
    if (request.method === "GET") return response.status(200).json(publicConnection(connection) || { connected: false });
    if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
    const action = request.body?.action;
    if (!connection && action !== "disconnect") return response.status(404).json({ error: "Stripe is not connected." });
    if (action === "refresh") {
      const account = await stripeRequest(`/accounts/${encodeURIComponent(connection.stripe_account_id)}`);
      await db(`stripe_connections?business_id=eq.${encodeURIComponent(businessId)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          charges_enabled: Boolean(account.charges_enabled),
          details_submitted: Boolean(account.details_submitted),
          updated_at: new Date().toISOString()
        })
      });
    } else if (action === "disconnect") {
      // Removes our record of the connection. The underlying Stripe Express account
      // is left intact (not deleted) - reconnecting later creates a fresh one.
      await db(`stripe_connections?business_id=eq.${encodeURIComponent(businessId)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      });
    } else {
      return response.status(400).json({ error: "Unknown action." });
    }
    connection = await connectionForBusiness(businessId);
    response.status(200).json(publicConnection(connection) || { connected: false });
  } catch (error) {
    sendError(response, error, { label: "Stripe" });
  }
};
