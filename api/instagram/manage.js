const { db, getUser, assertBusinessAccess, connectionForBusiness, decryptToken, refreshMedia, sendError } = require("../_lib/instagram");

const publicConnection = (connection) => connection && ({
  connected: Boolean(connection.is_active),
  username: connection.username,
  accountType: connection.account_type,
  showOnWebsite: connection.show_on_website,
  postLimit: connection.post_limit,
  lastSyncedAt: connection.last_synced_at,
  needsReconnect: Boolean(connection.last_error || (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()))
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
    if (!connection && action !== "settings") return response.status(404).json({ error: "Instagram is not connected." });
    if (action === "refresh") {
      await refreshMedia(connection, { force: true });
    } else if (action === "settings") {
      const postLimit = Number(request.body.postLimit) === 4 ? 4 : 6;
      await db(`instagram_connections?business_id=eq.${encodeURIComponent(businessId)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ show_on_website: Boolean(request.body.showOnWebsite), post_limit: postLimit, updated_at: new Date().toISOString() })
      });
    } else if (action === "disconnect") {
      const token = decryptToken(connection);
      await fetch(`https://graph.instagram.com/me/permissions?access_token=${encodeURIComponent(token)}`, { method: "DELETE" }).catch(() => null);
      await db(`instagram_connections?business_id=eq.${encodeURIComponent(businessId)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ is_active: false, show_on_website: false, access_token_encrypted: null, token_iv: null, token_auth_tag: null, updated_at: new Date().toISOString() })
      });
      await db(`instagram_media_cache?business_id=eq.${encodeURIComponent(businessId)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      });
    } else {
      return response.status(400).json({ error: "Unknown action." });
    }
    connection = await connectionForBusiness(businessId);
    response.status(200).json(publicConnection(connection) || { connected: false });
  } catch (error) {
    sendError(response, error);
  }
};
