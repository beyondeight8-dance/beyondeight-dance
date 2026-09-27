const { db, required } = require("../_lib/shared");
const { verifyWebhookSignature } = require("../_lib/stripe");

const readRawBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
};

const handleCheckoutCompleted = async (session) => {
  const meta = session.metadata || {};
  if (!meta.businessId || !meta.websiteId || !meta.classId) return;
  const payload = {
    business_id: meta.businessId,
    website_id: meta.websiteId,
    class_id: meta.classId,
    student_name: meta.studentName || "",
    student_email: meta.studentEmail || "",
    student_phone: meta.studentPhone || "",
    notes: meta.notes || "",
    payment_method: "stripe",
    payment_status: "paid",
    class_snapshot: {
      title: meta.classTitle || "",
      instructor: meta.classInstructor || "",
      date: meta.classDate || "",
      time: meta.classTime || "",
      duration: meta.classDuration || "",
      location: meta.classVenue || "",
      price: meta.classPrice || ""
    },
    stripe_checkout_session_id: session.id
  };
  // on_conflict + merge-duplicates makes this safe against Stripe's at-least-once
  // webhook delivery: a retried event for the same session is a no-op, not a
  // second registration.
  await db("registrations?on_conflict=stripe_checkout_session_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(payload)
  });
};

const handleAccountUpdated = async (account) => {
  await db(`stripe_connections?stripe_account_id=eq.${encodeURIComponent(account.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      charges_enabled: Boolean(account.charges_enabled),
      details_submitted: Boolean(account.details_submitted),
      updated_at: new Date().toISOString()
    })
  }).catch((error) => console.warn("Stripe account.updated sync failed (account may not be connected yet):", error.message));
};

const handler = async (request, response) => {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  let rawBody;
  try {
    rawBody = await readRawBody(request);
    verifyWebhookSignature(rawBody, request.headers["stripe-signature"], required("STRIPE_WEBHOOK_SECRET"));
  } catch (error) {
    console.warn("Stripe webhook signature verification failed:", error.message);
    return response.status(400).json({ error: "Invalid signature." });
  }
  try {
    const event = JSON.parse(rawBody);
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object);
    } else if (event.type === "account.updated") {
      await handleAccountUpdated(event.data.object);
    }
    response.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    // Acknowledge receipt anyway: Stripe retries on non-2xx, and a processing
    // bug shouldn't cause the same event to hammer this endpoint indefinitely.
    response.status(200).json({ received: true, error: "processing_failed" });
  }
};

// Vercel's Node runtime parses JSON bodies by default; the raw bytes are
// needed here to verify Stripe's signature, so parsing is disabled.
handler.config = { api: { bodyParser: false } };

module.exports = handler;
