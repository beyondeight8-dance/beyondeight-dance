const crypto = require("crypto");
const { db, getUser, assertBusinessAccess, required, sendError } = require("../_lib/instagram");

module.exports = async (request, response) => {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  try {
    const user = await getUser(request);
    const businessId = request.body?.businessId;
    const business = await assertBusinessAccess(user.id, businessId);
    const state = crypto.randomBytes(32).toString("base64url");
    const stateHash = crypto.createHash("sha256").update(state).digest("hex");
    await db("instagram_oauth_states", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        state_hash: stateHash,
        user_id: user.id,
        business_id: businessId,
        return_to: `/${encodeURIComponent(business.slug)}?owner=1`,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      })
    });
    const url = new URL(process.env.INSTAGRAM_AUTHORIZATION_URL || "https://www.instagram.com/oauth/authorize");
    url.searchParams.set("client_id", required("META_INSTAGRAM_APP_ID"));
    url.searchParams.set("redirect_uri", required("META_INSTAGRAM_REDIRECT_URI"));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "instagram_business_basic");
    url.searchParams.set("state", state);
    url.searchParams.set("force_authentication", "1");
    response.status(200).json({ authorizationUrl: url.toString() });
  } catch (error) {
    sendError(response, error);
  }
};
