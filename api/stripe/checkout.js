const { db } = require("../_lib/shared");
const { stripeRequest } = require("../_lib/stripe");

// Same pattern as api/stripe/connect.js - required even for the embedded Checkout Form:
// Stripe needs somewhere to send the browser back to for payment methods that require an
// authentication redirect (e.g. 3D Secure), which the confirm() call alone can't cover.
const appOrigin = () => (process.env.PUBLIC_APP_URL || "https://beyond8dance.com").replace(/\/$/, "");

const priceInCents = (raw) => {
  const num = typeof raw === "number" ? raw : Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(num) && num > 0 ? Math.round(num * 100) : 0;
};

const metaString = (value, max = 450) => String(value ?? "").slice(0, max);

module.exports = async (request, response) => {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  try {
    const body = request.body || {};
    const businessId = body.businessId;
    const websiteId = body.websiteId;
    const classId = body.classId;
    const studentName = String(body.studentName || "").trim();
    const studentEmail = String(body.studentEmail || "").trim();
    const studentPhone = String(body.studentPhone || "").trim();
    if (!businessId || !websiteId || !classId) return response.status(400).json({ error: "This class is not available for booking." });
    if (!studentName || !studentEmail || !studentPhone) return response.status(400).json({ error: "Please complete your name, email, and phone number." });

    const businesses = await db(
      `businesses?select=id,slug,status,websites!inner(id,published)&id=eq.${encodeURIComponent(businessId)}&status=eq.published&websites.published=eq.true&limit=1`
    );
    const business = businesses?.[0];
    if (!business) return response.status(404).json({ error: "This class is not available for booking." });

    const connections = await db(`stripe_connections?select=stripe_account_id,charges_enabled&business_id=eq.${encodeURIComponent(businessId)}&limit=1`);
    const connection = connections?.[0];
    if (!connection?.charges_enabled) return response.status(400).json({ error: "Card payments are not available for this business." });

    const amount = priceInCents(body.classPrice);
    if (!amount) return response.status(400).json({ error: "This class does not have a valid price for card payment." });

    const session = await stripeRequest("/checkout/sessions", {
      method: "POST",
      account: connection.stripe_account_id,
      body: {
        // Configured in Checkout Studio - see STRIPE_INTEGRATION_TODO.md.
        ui_mode: "form",
        billing_address_collection: "auto",
        phone_number_collection: { enabled: false },
        automatic_tax: { enabled: false },
        submit_type: "auto",
        name_collection: { individual: { enabled: true, optional: true } },
        integration_identifier: "custom_embedded_web_0001",
        return_url: `${appOrigin()}/${business.slug}?booking=stripe_success`,
        mode: "payment",
        customer_email: studentEmail,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: { name: metaString(body.classTitle || "Class booking", 250) }
          }
        }],
        metadata: {
          businessId: metaString(businessId),
          websiteId: metaString(websiteId),
          classId: metaString(classId),
          studentName: metaString(studentName),
          studentEmail: metaString(studentEmail),
          studentPhone: metaString(studentPhone),
          notes: metaString(body.notes),
          classTitle: metaString(body.classTitle),
          classInstructor: metaString(body.classInstructor),
          classDate: metaString(body.classDate),
          classTime: metaString(body.classTime),
          classDuration: metaString(body.classDuration),
          classVenue: metaString(body.classVenue),
          classPrice: metaString(body.classPrice)
        }
      }
    });
    response.status(200).json({ client_secret: session.client_secret });
  } catch (error) {
    console.error("Stripe checkout session failed:", error);
    response.status(400).json({ error: "We couldn't start card payment. Please try again." });
  }
};
