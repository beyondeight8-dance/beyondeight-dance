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
    return { ...clone(generated), businessId: source.business.id, businessName: generated.businessName || source.business.business_name, slug: source.business.slug, theme: generated.theme || website.theme || source.business.theme, domain: `${window.location.origin}/${source.business.slug}`, logoImage: generated.logoImage || generated.logoUrl || source.business.logo_url || "" };
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
    document.body.classList.remove("generated-elegant", "generated-bold", "generated-soft", "generated-vibrant", "generated-minimal");
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
  const bookingSummary = (item) => `<dl class="booking-summary"><div><dt>Class</dt><dd>${esc(item.title)}</dd></div><div><dt>Instructor</dt><dd>${esc(item.instructor || contentForState().instructorName)}</dd></div><div><dt>Date & time</dt><dd>${esc(item.date || "TBA")} • ${esc(item.time || "TBA")}</dd></div><div><dt>Duration</dt><dd>${esc(item.duration || "60 minutes")}</dd></div><div><dt>Location</dt><dd>${esc(item.venue || item.location || "Details coming soon")}</dd></div><div><dt>Price</dt><dd>${esc(item.price ?? "$0")}</dd></div></dl>`;
  const openBooking = (classId) => {
    const item = bookingClass(classId);
    if (!item || item.registrationOpen === false) return;
    document.body.insertAdjacentHTML("beforeend", `<div class="booking-modal" data-booking-modal role="dialog" aria-modal="true" aria-labelledby="booking-title"><div class="booking-dialog"><header><div><small>Book a spot</small><h2 id="booking-title">${esc(item.title)}</h2></div><button type="button" data-close-booking aria-label="Close">×</button></header>${bookingSummary(item)}<form data-booking-details><h3>Your Details</h3><label>Full Name<input required autocomplete="name" name="studentName"></label><label>Email<input required type="email" autocomplete="email" name="studentEmail"></label><label>Phone Number<input required type="tel" autocomplete="tel" name="studentPhone"></label><label>Notes (optional)<textarea name="notes" rows="3"></textarea></label><button type="submit">Continue to Payment</button></form></div></div>`);
    const modal = document.querySelector("[data-booking-modal]");
    modal.querySelector("[data-close-booking]").addEventListener("click", closeBooking);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeBooking(); });
    modal.querySelector("form").addEventListener("submit", (event) => showPayment(event, item));
    modal.querySelector("input")?.focus();
  };
  const showPayment = (event, item) => {
    event.preventDefault();
    const details = Object.fromEntries(new FormData(event.currentTarget));
    const dialog = document.querySelector("[data-booking-modal] .booking-dialog");
    const destination = venmoDestination();
    dialog.innerHTML = `<header><div><small>Step 2 of 2</small><h2>Payment</h2></div><button type="button" data-close-booking aria-label="Close">×</button></header>${bookingSummary(item)}<section class="booking-payment"><strong>Venmo</strong><p>Pay the instructor directly, then return here to record your registration. Payment will remain pending verification.</p>${destination ? `<a class="primary-button" href="${esc(destination)}" target="_blank" rel="noopener">Pay ${esc(item.price || "the instructor")} with Venmo</a>` : `<p class="booking-warning">The instructor has not configured a Venmo destination. Contact them before confirming payment.</p>`}<button type="button" data-confirm-booking>I’ve completed payment</button><small data-booking-error></small></section>`;
    dialog.querySelector("[data-close-booking]").addEventListener("click", closeBooking);
    dialog.querySelector("[data-confirm-booking]").addEventListener("click", () => completeBooking(item, details));
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
  } catch (error) {
    console.warn("Public site failed:", error);
    publicError("We could not load this website.", "Please try again soon.");
  }
})();
