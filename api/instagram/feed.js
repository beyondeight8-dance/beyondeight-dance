const { db, connectionForBusiness, refreshMedia } = require("../_lib/instagram");

module.exports = async (request, response) => {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });
  const businessId = request.query?.businessId;
  if (!businessId) return response.status(200).json({ items: [] });
  try {
    const published = await db(
      `businesses?select=id,status,websites!inner(published)&id=eq.${encodeURIComponent(businessId)}&status=eq.published&websites.published=eq.true&limit=1`
    );
    if (!published?.length) return response.status(200).json({ items: [] });
    const connection = await connectionForBusiness(businessId);
    if (!connection?.is_active || !connection.show_on_website) return response.status(200).json({ items: [] });
    await refreshMedia(connection).catch((error) => console.warn("Serving cached Instagram media:", error.message));
    const limit = connection.post_limit === 4 ? 4 : 6;
    const items = await db(
      `instagram_media_cache?select=instagram_media_id,media_type,media_url,thumbnail_url,permalink,caption,posted_at&business_id=eq.${encodeURIComponent(businessId)}&order=posted_at.desc&limit=${limit}`
    );
    response.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
    response.status(200).json({ username: connection.username, items: items || [] });
  } catch (error) {
    console.error("Instagram feed failed:", error);
    response.status(200).json({ items: [] });
  }
};
