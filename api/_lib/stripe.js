const crypto = require("crypto");
const { required } = require("./shared");

const apiBase = () => (process.env.STRIPE_API_BASE_URL || "https://api.stripe.com/v1").replace(/\/$/, "");

// Stripe's API takes application/x-www-form-urlencoded bodies with nested
// objects/arrays expressed via bracket notation, e.g.
// line_items[0][price_data][currency]=usd. There's no Stripe SDK in this
// dependency-free repo, so we encode that convention by hand.
const encodeForm = (value, prefix = "", pairs = []) => {
  if (value === undefined || value === null) return pairs;
  if (Array.isArray(value)) {
    value.forEach((item, index) => encodeForm(item, `${prefix}[${index}]`, pairs));
  } else if (typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => encodeForm(item, prefix ? `${prefix}[${key}]` : key, pairs));
  } else {
    pairs.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
  }
  return pairs;
};

const stripeRequest = async (path, { method = "GET", body, account, query } = {}) => {
  const url = new URL(`${apiBase()}${path}`);
  if (query) Object.entries(query).forEach(([key, value]) => value !== undefined && url.searchParams.set(key, String(value)));
  const headers = { Authorization: `Basic ${Buffer.from(`${required("STRIPE_SECRET_KEY")}:`).toString("base64")}` };
  if (account) headers["Stripe-Account"] = account;
  let requestBody;
  if (body) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    requestBody = encodeForm(body).join("&");
  }
  const response = await fetch(url, { method, headers, body: requestBody });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(data.error?.message || `Stripe request failed (${response.status})`);
  return data;
};

// Manual implementation of Stripe's documented webhook signature scheme:
// https://stripe.com/docs/webhooks#verify-manually
// The header looks like "t=<timestamp>,v1=<signature>[,v0=<older signature>]".
const verifyWebhookSignature = (rawBody, signatureHeader, secret, { toleranceSeconds = 300 } = {}) => {
  const parts = Object.fromEntries(
    String(signatureHeader || "")
      .split(",")
      .map((part) => part.split("=").map((piece) => piece.trim()))
      .filter((pair) => pair.length === 2)
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) throw new Error("Missing Stripe-Signature header.");
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    throw new Error("Stripe webhook signature mismatch.");
  }
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > toleranceSeconds) throw new Error("Stripe webhook timestamp outside tolerance.");
  return true;
};

module.exports = { stripeRequest, verifyWebhookSignature };
