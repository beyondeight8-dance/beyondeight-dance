const crypto = require("crypto");
const { required, db, getUser, assertBusinessAccess, sendError: sendSharedError } = require("./shared");

const encryptionKey = () => {
  const raw = required("INSTAGRAM_TOKEN_ENCRYPTION_KEY");
  const key = /^[a-f0-9]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("INSTAGRAM_TOKEN_ENCRYPTION_KEY must decode to 32 bytes");
  return key;
};

const encryptToken = (token) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return {
    access_token_encrypted: encrypted.toString("base64"),
    token_iv: iv.toString("base64"),
    token_auth_tag: cipher.getAuthTag().toString("base64")
  };
};

const decryptToken = (connection) => {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(connection.token_iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(connection.token_auth_tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(connection.access_token_encrypted, "base64")),
    decipher.final()
  ]).toString("utf8");
};

const graphBase = () => (process.env.INSTAGRAM_GRAPH_BASE_URL || "https://graph.instagram.com").replace(/\/$/, "");
const instagramRequest = async (path, token, options = {}) => {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${graphBase()}${path}${separator}access_token=${encodeURIComponent(token)}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(data.error?.message || `Instagram request failed (${response.status})`);
  return data;
};

const connectionForBusiness = async (businessId) => {
  const rows = await db(`instagram_connections?select=*&business_id=eq.${encodeURIComponent(businessId)}&limit=1`);
  return rows?.[0] || null;
};

const normalizeMedia = (item, businessId) => ({
  business_id: businessId,
  instagram_media_id: item.id,
  media_type: item.media_type || "IMAGE",
  media_url: item.media_url || null,
  thumbnail_url: item.thumbnail_url || item.media_url || null,
  permalink: item.permalink,
  caption: String(item.caption || "").slice(0, 2200),
  posted_at: item.timestamp || null,
  fetched_at: new Date().toISOString()
});

const refreshMedia = async (connection, { force = false } = {}) => {
  if (!connection?.is_active) return [];
  const lastSync = connection.last_synced_at ? new Date(connection.last_synced_at).getTime() : 0;
  if (!force && Date.now() - lastSync < 30 * 60 * 1000) return null;
  let token = decryptToken(connection);
  try {
    const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
    if (expiresAt && expiresAt - Date.now() < 7 * 24 * 60 * 60 * 1000) {
      const refreshed = await instagramRequest("/refresh_access_token?grant_type=ig_refresh_token", token);
      if (refreshed.access_token) {
        token = refreshed.access_token;
        await db(`instagram_connections?business_id=eq.${encodeURIComponent(connection.business_id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            ...encryptToken(token),
            token_expires_at: new Date(Date.now() + Number(refreshed.expires_in || 5184000) * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
        });
      }
    }
    const media = await instagramRequest(
      "/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=12",
      token
    );
    const normalized = (media.data || [])
      .filter((item) => item.permalink && (item.media_url || item.thumbnail_url))
      .slice(0, 6)
      .map((item) => normalizeMedia(item, connection.business_id));
    if (normalized.length) {
      await db("instagram_media_cache?on_conflict=business_id,instagram_media_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(normalized)
      });
    }
    await db(`instagram_connections?business_id=eq.${encodeURIComponent(connection.business_id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ last_synced_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() })
    });
    return normalized;
  } catch (error) {
    await db(`instagram_connections?business_id=eq.${encodeURIComponent(connection.business_id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ last_error: error.message.slice(0, 500), updated_at: new Date().toISOString() })
    }).catch(() => null);
    throw error;
  }
};

const sendError = (response, error) => sendSharedError(response, error, { label: "Instagram" });

module.exports = {
  required,
  db,
  getUser,
  assertBusinessAccess,
  encryptToken,
  decryptToken,
  connectionForBusiness,
  instagramRequest,
  refreshMedia,
  sendError
};
