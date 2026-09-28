const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
};

const supabaseUrl = () => required("SUPABASE_URL").replace(/\/$/, "");
const serviceKey = () => required("SUPABASE_SERVICE_ROLE_KEY");
const restHeaders = (extra = {}) => ({
  apikey: serviceKey(),
  Authorization: `Bearer ${serviceKey()}`,
  "Content-Type": "application/json",
  ...extra
});

const db = async (path, options = {}) => {
  const response = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    ...options,
    headers: restHeaders(options.headers)
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.hint || `Database request failed (${response.status})`);
  return data;
};

const getUser = async (request) => {
  const bearer = String(request.headers.authorization || "");
  if (!bearer.startsWith("Bearer ")) throw new Error("AUTH_REQUIRED");
  const response = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_ANON_KEY || serviceKey(), Authorization: bearer }
  });
  if (!response.ok) throw new Error("AUTH_REQUIRED");
  return response.json();
};

const assertBusinessAccess = async (userId, businessId) => {
  const businesses = await db(`businesses?select=id,slug,owner_user_id,theme&id=eq.${encodeURIComponent(businessId)}&limit=1`);
  const business = businesses?.[0];
  if (!business) throw new Error("BUSINESS_NOT_FOUND");
  if (business.owner_user_id === userId) return business;
  const memberships = await db(
    `business_members?select=role&business_id=eq.${encodeURIComponent(businessId)}&user_id=eq.${encodeURIComponent(userId)}&role=in.(owner,admin)&limit=1`
  );
  if (!memberships?.length) throw new Error("FORBIDDEN");
  return business;
};

const sendError = (response, error, { label = "This service" } = {}) => {
  const code = error.message === "AUTH_REQUIRED" ? 401 : error.message === "FORBIDDEN" ? 403 : error.message === "BUSINESS_NOT_FOUND" ? 404 : 400;
  const publicMessage = code === 401 ? "Please sign in again." : code === 403 ? "You do not have access to this business." : `${label} could not complete that request.`;
  console.error(`${label} integration error:`, error);
  response.status(code).json({ error: publicMessage });
};

module.exports = {
  required,
  db,
  getUser,
  assertBusinessAccess,
  sendError
};
