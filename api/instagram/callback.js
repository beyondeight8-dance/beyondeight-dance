const crypto = require("crypto");
const { db, required, encryptToken, instagramRequest, refreshMedia } = require("../_lib/instagram");

module.exports = async (request, response) => {
  const appOrigin = (process.env.PUBLIC_APP_URL || "https://beyond8dance.com").replace(/\/$/, "");
  let returnTo = "/dashboard/website/?";
  const fail = (reason) => response.redirect(302, `${appOrigin}${returnTo}${returnTo.includes("?") ? "&" : "?"}instagram=${encodeURIComponent(reason)}`);
  try {
    const code = request.query?.code;
    const state = request.query?.state;
    if (!state) return fail(request.query?.error ? "cancelled" : "invalid");
    const stateHash = crypto.createHash("sha256").update(state).digest("hex");
    const rows = await db(`instagram_oauth_states?select=*&state_hash=eq.${encodeURIComponent(stateHash)}&limit=1`);
    const stored = rows?.[0];
    if (!stored || stored.used_at || new Date(stored.expires_at).getTime() < Date.now()) return fail("expired");
    returnTo = stored.return_to || returnTo;
    await db(`instagram_oauth_states?state_hash=eq.${encodeURIComponent(stateHash)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ used_at: new Date().toISOString() })
    });
    if (!code) return fail(request.query?.error ? "cancelled" : "invalid");

    const tokenBody = new URLSearchParams({
      client_id: required("META_INSTAGRAM_APP_ID"),
      client_secret: required("META_INSTAGRAM_APP_SECRET"),
      grant_type: "authorization_code",
      redirect_uri: required("META_INSTAGRAM_REDIRECT_URI"),
      code: String(code).replace(/#_$/, "")
    });
    const shortResponse = await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body: tokenBody });
    const shortToken = await shortResponse.json();
    if (!shortResponse.ok || !shortToken.access_token) throw new Error(shortToken.error_message || "Instagram token exchange failed");
    const longUrl = new URL(`${process.env.INSTAGRAM_GRAPH_BASE_URL || "https://graph.instagram.com"}/access_token`);
    longUrl.searchParams.set("grant_type", "ig_exchange_token");
    longUrl.searchParams.set("client_secret", required("META_INSTAGRAM_APP_SECRET"));
    longUrl.searchParams.set("access_token", shortToken.access_token);
    const longResponse = await fetch(longUrl);
    const longToken = await longResponse.json();
    const accessToken = longToken.access_token || shortToken.access_token;
    const expiresIn = Number(longToken.expires_in || 3600);
    const profile = await instagramRequest("/me?fields=user_id,username,account_type,media_count", accessToken);
    const accountType = String(profile.account_type || "").toUpperCase();
    if (accountType && !["BUSINESS", "MEDIA_CREATOR", "CREATOR"].includes(accountType)) return fail("professional_required");
    const encrypted = encryptToken(accessToken);
    const connection = {
      business_id: stored.business_id,
      user_id: stored.user_id,
      instagram_user_id: String(profile.user_id || profile.id || shortToken.user_id || ""),
      username: profile.username || "instagram",
      account_type: accountType || "PROFESSIONAL",
      ...encrypted,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      show_on_website: true,
      last_error: null
    };
    const saved = await db("instagram_connections?on_conflict=business_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(connection)
    });
    await refreshMedia(saved?.[0] || connection, { force: true }).catch(() => null);
    response.redirect(302, `${appOrigin}${returnTo}${returnTo.includes("?") ? "&" : "?"}instagram=connected`);
  } catch (error) {
    console.error("Instagram OAuth callback failed:", error);
    fail("failed");
  }
};
