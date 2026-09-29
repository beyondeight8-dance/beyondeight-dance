(async function () {
  const app = window.BeyondEight;
  const templates = window.BeyondEightWebsiteTemplates;
  const root = document.querySelector("[data-public-site-root]");
  const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const params = new URLSearchParams(window.location.search);
  const querySlug = params.get("slug");
  const slug = querySlug || window.location.pathname.split("/").filter(Boolean)[0];
  const LOCAL_PUBLISHED_SITES_KEY = "beyondeight.localPublishedSites";
  const clone = (value) => JSON.parse(JSON.stringify(value || {}));
  const classKey = (value = "") => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let user = null;
  let bundle = null;
  let state = {};

  const publicError = (title, copy) => {
    root.innerHTML = `<section class="route-loading"><h1>${esc(title)}</h1><p>${esc(copy)}</p><a class="primary-button" href="/">Go home</a></section>`;
  };
  const stateForBundle = (source, mode) => {
    const website = source.website || {};
    const stored = mode === "public" ? website.published_content : website.draft_content;
    const generated = stored && Object.keys(stored).length ? stored : website.published_content && Object.keys(website.published_content).length ? website.published_content : source.settings?.generated_content || {};
    return { ...clone(generated), businessId: source.business.id, businessName: generated.businessName || source.business.business_name, slug: source.business.slug, theme: generated.theme || website.theme || source.business.theme, domain: `${window.location.origin}/${source.business.slug}`, logoImage: generated.logoImage || generated.logoUrl || source.business.logo_url || "", stripeChargesEnabled: Boolean(source.stripeChargesEnabled), stripeAccountId: source.stripeAccountId || "" };
  };
  const isOwner = () => Boolean(user && bundle?.business?.owner_user_id === user.id);
  const contentForState = () => templates.buildWebsiteContent(state);
  // Editing (website appearance and classes) happens exclusively in the Dashboard now; this
  // toolbar is just a quick way back there, not an in-place editor toggle.
  const ownerToolbar = () => !isOwner() ? "" : `<div class="owner-toolbar" data-owner-toolbar><a href="/dashboard/">← Dashboard</a><a class="owner-publish" href="/dashboard/?view=website">Edit Website</a></div>`;

  const loadInstagram = () => {
    const mount = root.querySelector("[data-instagram-feed]");
    if (!mount || !bundle?.business?.id) return;
    fetch(`/api/instagram/feed?businessId=${encodeURIComponent(bundle.business.id)}`)
      .then((response) => response.ok ? response.json() : { items: [] })
      .then((feed) => {
        const html = templates.renderInstagramSection(feed);
        mount.innerHTML = html || "";
      })
      .catch(() => mount.replaceChildren());
  };
  const render = () => {
    const content = contentForState();
    document.body.classList.remove("generated-editorial", "generated-studio", "generated-electric", "generated-noir", "generated-muse", "generated-motion");
    document.body.classList.add(templates.themeClassFor(content.theme.name));
    document.title = `${content.brandName} | BeyondEight`;
    root.innerHTML = templates.renderPublicSite(content, { ownerToolbar: ownerToolbar(), logoUrl: state.logoImage || "" });
    bindOwnerEvents();
    loadInstagram();
  };
  const closeBooking = () => document.querySelector("[data-booking-modal]")?.remove();
  const bookingClass = (classId) => contentForState().classes.find((item) => String(item.id || classKey(item.title)) === String(classId));
  const venmoDestination = () => {
    if (state.venmoUrl) return state.venmoUrl;
    const username = String(state.venmoUsername || "").replace(/^@/, "");
    return username ? `https://venmo.com/u/${encodeURIComponent(username)}` : "";
  };
  // Mirrors website-template.js's classPrice: a bare numeric price ("1") reads as a typo next
  // to formatted date/duration text, so a digit-led value gets a "$" prefix; anything already
  // carrying its own symbol/word ("$25", "Free") passes through untouched.
  const formatPrice = (value) => {
    if (typeof value === "number") return `$${value.toFixed(2)}`;
    const raw = String(value ?? "").trim();
    if (!raw) return "$0";
    return /^\d/.test(raw) ? `$${raw}` : raw;
  };
  // Minimal line icons for the booking card's fact rows - no icon library in this
  // dependency-free codebase, so these are hand-rolled inline to match.
  const BOOKING_ICONS = {
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"></rect><path d="M8 3v4M16 3v4M3.5 9.5h17"></path></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg>`,
    pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"></path><circle cx="12" cy="9.5" r="2.4"></circle></svg>`,
    tag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12.5 12 4h7.5v7.5L11 20 3.5 12.5Z"></path><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"></circle></svg>`
  };
  const bookingFact = (icon, label, value) => `<div class="booking-fact"><span class="booking-fact-icon" aria-hidden="true">${BOOKING_ICONS[icon]}</span><div><dt>${esc(label)}</dt><dd>${value}</dd></div></div>`;
  // The class card's photo reuses the same real, already-configured content images the
  // public site itself falls back through for a class thumbnail (see website-template.js's
  // classThumbs) - never a stock/invented photo, and gracefully empty when none exist yet.
  const bookingVisual = (item) => {
    const content = contentForState();
    const thumb = item.image || [content.images?.gallery, content.images?.workshop, content.images?.performance, content.images?.hero].filter(Boolean)[0];
    const media = thumb
      ? `<div class="booking-visual-media"><img src="${esc(thumb)}" alt="" loading="lazy"></div>`
      : `<div class="booking-visual-media is-empty" aria-hidden="true"><span>${esc(String(item.title || "Class").charAt(0))}</span></div>`;
    const facts = bookingFact("calendar", "Date & Time", `${esc(item.date || "TBA")} &middot; ${esc(item.time || "TBA")}`)
      + bookingFact("clock", "Duration", esc(item.duration || "60 minutes"))
      + bookingFact("pin", "Location", esc(item.venue || item.location || "Details coming soon"))
      + bookingFact("tag", "Price", esc(formatPrice(item.price)));
    return `<aside class="booking-visual">${media}<div class="booking-visual-body"><h3>${esc(item.title)}</h3><p>with ${esc(item.instructor || content.instructorName)}</p><dl class="booking-facts">${facts}</dl></div></aside>`;
  };
  const bookingLayout = (item, title, panel) => `<header><div><small>Complete your booking</small><h2 id="booking-title">${esc(title)}</h2></div><button type="button" data-close-booking aria-label="Close">×</button></header><div class="booking-layout">${bookingVisual(item)}<div class="booking-form-panel">${panel}</div></div>`;
  const openBooking = (classId) => {
    const item = bookingClass(classId);
    if (!item || item.registrationOpen === false) return;
    const panel = `<form data-booking-details><label>Full Name<input required autocomplete="name" name="studentName"></label><label>Email<input required type="email" autocomplete="email" name="studentEmail"></label><label>Phone Number<input required type="tel" autocomplete="tel" name="studentPhone"></label><button type="submit">Continue to Payment</button></form>`;
    document.body.insertAdjacentHTML("beforeend", `<div class="booking-modal" data-booking-modal role="dialog" aria-modal="true" aria-labelledby="booking-title"><div class="booking-dialog">${bookingLayout(item, "Your Details", panel)}</div></div>`);
    const modal = document.querySelector("[data-booking-modal]");
    modal.querySelector("[data-close-booking]").addEventListener("click", closeBooking);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeBooking(); });
    modal.querySelector("form").addEventListener("submit", (event) => showPayment(event, item));
    modal.querySelector("input")?.focus();
  };
  const usesStripe = () => state.paymentMethod === "stripe" && state.stripeChargesEnabled;
  const showPayment = (event, item) => {
    event.preventDefault();
    const details = Object.fromEntries(new FormData(event.currentTarget));
    const dialog = document.querySelector("[data-booking-modal] .booking-dialog");
    if (usesStripe()) return showStripePayment(dialog, item, details);
    const destination = venmoDestination();
    const panel = `<section class="booking-payment"><p class="booking-payment-label">Pay with Venmo</p><p>Pay the instructor directly, then return here to record your registration. Payment will remain pending verification.</p>${destination ? `<a class="primary-button" href="${esc(destination)}" target="_blank" rel="noopener">Pay ${item.price ? esc(formatPrice(item.price)) : "the instructor"} with Venmo</a>` : `<p class="booking-warning">The instructor has not configured a Venmo destination. Contact them before confirming payment.</p>`}<button type="button" data-confirm-booking>I’ve completed payment</button><small data-booking-error></small></section>`;
    dialog.innerHTML = bookingLayout(item, "Payment", panel);
    dialog.querySelector("[data-close-booking]").addEventListener("click", closeBooking);
    dialog.querySelector("[data-confirm-booking]").addEventListener("click", () => completeBooking(item, details));
  };
  // Configured in Checkout Studio - see STRIPE_INTEGRATION_TODO.md. Colors match the
  // booking dialog's own rose/cream palette (see .public-site-route's booking-dialog
  // overrides in public-site.css) rather than Stripe's default blue, since this form is
  // mounted directly inside our own styled card, not a separate Stripe-hosted page.
  const STRIPE_FORM_APPEARANCE = {
    theme: "stripe",
    labels: "auto",
    inputs: "spaced",
    variables: {
      borderRadius: "8px",
      colorBackground: "#ffffff",
      colorDanger: "#df1b41",
      colorPrimary: "#a8675f",
      colorSuccess: "#00c853",
      colorText: "#24211f",
      fontFamily: "default",
      fontSizeBase: "16px",
      spacingUnit: "4px"
    }
  };
  const showStripePayment = (dialog, item, details) => {
    const panel = `<section class="booking-payment"><p class="booking-payment-label">Card details</p><div id="checkout-form" data-checkout-form><p class="booking-checkout-loading">Loading secure payment form…</p></div><small data-booking-error></small></section>`;
    dialog.innerHTML = bookingLayout(item, "Payment", panel);
    dialog.querySelector("[data-close-booking]").addEventListener("click", closeBooking);
    mountStripeCheckoutForm(item, details);
  };
  const mountStripeCheckoutForm = async (item, details) => {
    const container = document.querySelector("[data-checkout-form]");
    const errorNode = document.querySelector("[data-booking-error]");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: bundle.business.id, websiteId: bundle.website.id, classId: item.id || item.title,
          classTitle: item.title, classInstructor: item.instructor || contentForState().instructorName,
          classDate: item.date, classTime: item.time, classDuration: item.duration, classVenue: item.venue || item.location, classPrice: item.price,
          studentName: details.studentName, studentEmail: details.studentEmail, studentPhone: details.studentPhone, notes: details.notes
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.client_secret) throw new Error(payload.error || "We couldn't start card payment. Please try again.");
      if (!window.Stripe) throw new Error("Payment form failed to load. Please refresh and try again.");
      if (!window.BeyondEightConfig?.STRIPE_PUBLISHABLE_KEY) throw new Error("Card payment isn't configured yet. Please try Venmo, or contact the instructor.");
      // stripeAccount scopes Stripe.js to the instructor's own connected account -
      // this is a Connect (multi-account) integration, not a single-account one.
      const stripe = window.Stripe(window.BeyondEightConfig.STRIPE_PUBLISHABLE_KEY, {
        stripeAccount: state.stripeAccountId,
        betas: ["custom_checkout_payment_form_1"]
      });
      const checkout = await stripe.initCheckoutFormSdk({ clientSecret: payload.client_secret, appearance: STRIPE_FORM_APPEARANCE });
      container.innerHTML = "";
      const form = checkout.createForm({ layout: "expanded" });
      form.mount(container);
      const loadActionsResult = await checkout.loadActions();
      if (loadActionsResult.type === "success") {
        form.on("confirm", async (event) => {
          errorNode.textContent = "";
          try {
            await loadActionsResult.actions.confirm({ formConfirmEvent: event });
            container.innerHTML = `<p class="booking-checkout-loading">Payment submitted — confirming your booking…</p>`;
          } catch (error) {
            console.warn("Stripe payment confirmation failed:", error);
            errorNode.textContent = error.message || "We couldn't confirm your payment. Please try again.";
          }
        });
      }
    } catch (error) {
      console.warn("Stripe checkout failed:", error);
      container.innerHTML = "";
      errorNode.textContent = error.message || "We couldn't start card payment. Please try again.";
    }
  };
  const completeBooking = async (item, details) => {
    const button = document.querySelector("[data-confirm-booking]"); const errorNode = document.querySelector("[data-booking-error]");
    if (!button || button.disabled) return; button.disabled = true; button.textContent = "Saving your spot…";
    try {
      await app.createRegistration({ businessId: bundle.business.id, websiteId: bundle.website.id, registration: { classId: item.id || item.title, ...details, paymentMethod: "venmo", paymentStatus: item.venmoRequired === false ? "registered" : "payment_pending_verification", classSnapshot: { title: item.title, instructor: item.instructor, date: item.date, time: item.time, duration: item.duration, location: item.venue || item.location, price: item.price } } });
      const dialog = document.querySelector("[data-booking-modal] .booking-dialog");
      dialog.innerHTML = `<section class="booking-success"><span aria-hidden="true">✓</span><h2>You’re registered!</h2><p><strong>${esc(item.title)}</strong><br>${esc(item.date || "Date TBA")} • ${esc(item.time || "Time TBA")}</p><p>Payment: ${item.venmoRequired === false ? "Registration confirmed" : "Pending Venmo confirmation"}</p><a href="#contact" data-contact-instructor>Contact instructor</a><button type="button" data-close-booking>Done</button></section>`;
      dialog.querySelector("[data-close-booking]").addEventListener("click", closeBooking);
      dialog.querySelector("[data-contact-instructor]").addEventListener("click", closeBooking);
    } catch (error) { console.warn("Booking failed:", error); errorNode.textContent = "We couldn't complete your booking. Please try again."; button.disabled = false; button.textContent = "I’ve completed payment"; }
  };
  function bindOwnerEvents() {
    root.querySelectorAll("[data-book-class]").forEach((button) => button.addEventListener("click", () => openBooking(button.dataset.bookClass)));
  }
  const bookingReturnBanner = () => {
    const status = params.get("booking");
    const messages = {
      stripe_success: ["You’re registered!", "Payment received — the instructor has your booking details."],
      stripe_cancelled: ["Payment cancelled", "Your booking wasn’t completed. You can try again anytime."]
    };
    const copy = messages[status];
    if (!copy) return;
    document.body.insertAdjacentHTML("beforeend", `<div class="booking-return-banner" data-booking-return-banner role="status"><strong>${esc(copy[0])}</strong><p>${esc(copy[1])}</p><button type="button" data-close-banner aria-label="Close">×</button></div>`);
    document.querySelector("[data-close-banner]")?.addEventListener("click", () => document.querySelector("[data-booking-return-banner]")?.remove());
    window.history.replaceState({}, "", window.location.pathname);
  };
  try {
    if (!slug || app.reservedSlugs?.has(slug)) return publicError("Page not found.", "This BeyondEight page does not exist.");
    if (querySlug && window.location.pathname.includes("404.html")) window.history.replaceState({}, "", `/${slug}`);
    const localSites = JSON.parse(window.localStorage.getItem(LOCAL_PUBLISHED_SITES_KEY) || "{}");
    const remoteBundle = await app.getBusinessBundleBySlug(slug).catch(() => null);
    const publicBundle = remoteBundle || localSites[slug];
    if (!publicBundle) return publicError("Website not published yet.", "This BeyondEight site is private or unavailable.");
    user = await app.getSessionUser?.().catch(() => null);
    const ownsPublicBundle = Boolean(user && publicBundle.business.owner_user_id === user.id && !String(publicBundle.business.id).startsWith("local-"));
    bundle = ownsPublicBundle ? await app.getBusinessBundle(publicBundle.business.id) : publicBundle;
    state = stateForBundle(bundle, ownsPublicBundle ? "owner" : "public");
    if (!templates) return publicError("We could not load this website.", "The shared BeyondEight template system did not load.");
    render();
    bookingReturnBanner();
  } catch (error) {
    console.warn("Public site failed:", error);
    publicError("We could not load this website.", "Please try again soon.");
  }
})();
