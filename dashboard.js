(async function () {
  const app = window.BeyondEight;
  const templates = window.BeyondEightWebsiteTemplates;
  const root = document.querySelector("[data-dashboard-root]");
  const logout = document.querySelector("[data-dashboard-logout]");
  const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const clone = (value) => JSON.parse(JSON.stringify(value || {}));
  const uid = () => window.crypto?.randomUUID?.() || `class-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const imageUrl = (value) => /^https?:\/\//i.test(value || "") ? value : `/${String(value || "assets/starter-dance-class.jpg").replace(/^\//, "")}`;
  let user; let business; let bundle; let draftState = {}; let publishedState = {}; let registrations = [];
  let activeView = new URLSearchParams(window.location.search).get("view") === "website" ? "website" : "overview";
  let websiteTab = "look";
  let saving = false; let editingIndex = -1; let pendingDelete = -1;
  let classFilter = { search: "", status: "all" };
  let registrationFilter = { search: "", status: "all" };
  const UNBUILT_VIEWS = new Set(["instructors", "reviews", "analytics"]);

  const content = (state) => templates.buildWebsiteContent({ ...state, businessId: business.id, businessName: state.businessName || business.business_name, slug: business.slug, theme: state.theme || business.theme });
  const classes = () => (Array.isArray(draftState.classes) ? draftState.classes : []).map((item) => ({ registrationOpen: true, venmoRequired: true, ...item }));
  const dirty = () => JSON.stringify(draftState) !== JSON.stringify(publishedState);
  const toast = (message, error = false) => { document.querySelector("[data-owner-toast]")?.remove(); document.body.insertAdjacentHTML("beforeend", `<div class="owner-toast${error ? " is-error" : ""}" data-owner-toast role="status">${esc(message)}</div>`); setTimeout(() => document.querySelector("[data-owner-toast]")?.remove(), 3200); };
  const nav = () => {
    const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Owner";
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    const links = [["overview","Overview"],["classes","Classes"],["registrations","Registrations"],["website","Website"],["instructors","Instructors"],["reviews","Reviews"],["analytics","Analytics"],["settings","Settings"]];
    return `<nav class="owner-nav" aria-label="Dashboard navigation"><div class="owner-nav-links">${links.map(([key,label]) => `<button type="button" class="${activeView === key ? "is-active" : ""}" data-view="${key}">${label}${UNBUILT_VIEWS.has(key) ? " <span>Soon</span>" : ""}</button>`).join("")}</div><div class="owner-nav-footer"><a href="/${encodeURIComponent(business.slug)}" target="_blank">View My Website <span aria-hidden="true">↗</span></a><div class="owner-profile"><b aria-hidden="true">${esc(initials)}</b><span><strong>${esc(name)}</strong><small>Owner</small></span></div></div></nav>`;
  };
  const row = (item, index) => { const count = registrations.filter((entry) => entry.class_id === item.id).length; return `<article class="owner-class-row${item.highlighted ? " is-highlighted" : ""}"><img src="${esc(imageUrl(item.image))}" alt="" loading="lazy"><div><strong>${esc(item.title || "Untitled class")}</strong><span>${esc([item.date,item.time].filter(Boolean).join(" • ") || "Schedule coming soon")}</span><small>${esc(item.venue || item.location || "Location coming soon")} • ${esc(item.instructor || "Instructor TBA")}</small></div><div class="owner-class-capacity"><strong>${count} / ${esc(item.capacity || "—")}</strong><span>registered</span></div><span class="owner-status ${item.published === false ? "is-draft" : ""}">${item.published === false ? "Draft" : "Published"}${item.highlighted ? " • Featured" : ""}</span><div class="owner-class-actions">${[["edit","Edit"],["duplicate","Duplicate"],["toggle",item.published === false ? "Publish" : "Unpublish"],["highlight",item.highlighted ? "Remove Highlight" : "Highlight"],["registrations","View Registrations"],["delete","Delete"]].map(([action,label]) => `<button type="button" data-class-action="${action}" data-index="${index}">${label}</button>`).join("")}</div></article>`; };
  const overview = () => {
    const live = (publishedState.classes || []).filter((item) => item.published !== false);
    const today = new Date().toISOString().slice(0, 10);
    const nextSession = live.filter((item) => item.date && item.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
    const pendingCount = registrations.filter((item) => (item.payment_status || "payment_pending_verification") === "payment_pending_verification").length;
    const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "there";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const upcoming = live.filter((item) => !item.date || item.date >= today).sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))).slice(0, 4);
    const activity = registrations.slice(0, 3);
    const upcomingMarkup = upcoming.length ? upcoming.map((item) => { const count = registrations.filter((entry) => entry.class_id === item.id).length; return `<article class="owner-overview-class"><img src="${esc(imageUrl(item.image))}" alt=""><div><strong>${esc(item.title || "Untitled class")}</strong><span>${esc([item.date, item.time].filter(Boolean).join(" · ") || "Schedule coming soon")}</span><small>${esc(item.venue || item.location || "Location coming soon")}</small></div><div><strong>${count}/${esc(item.capacity || "—")}</strong><span>registered</span></div><button type="button" data-view="classes">View</button></article>`; }).join("") : `<div class="owner-empty-state"><strong>No upcoming classes.</strong><p>Your next published class will appear here.</p><button class="primary-button" data-add-class>Create a Class</button></div>`;
    const activityMarkup = activity.length ? activity.map((item) => `<article><span class="owner-activity-mark" aria-hidden="true">${(item.payment_status || "").includes("paid") ? "$" : "+"}</span><p><strong>${esc(item.student_name || "A student")}</strong> registered for ${esc(item.class_snapshot?.title || "a class")}</p><small>${esc((item.payment_status || "registered").replaceAll("_", " "))}</small></article>`).join("") : `<div class="owner-empty-state"><strong>No recent activity.</strong><p>New registrations will appear here.</p></div>`;
    return `<section class="owner-welcome"><div><h1>${greeting}, ${esc(name)}.</h1><p>Here's what's happening with your dance business.</p></div><button class="primary-button owner-create-class" data-add-class><span aria-hidden="true">+</span> Create New Class</button></section>${dirty() ? `<section class="owner-draft-banner"><div><strong>Unpublished Changes</strong><span>Your draft is private until you publish.</span></div><button data-publish>Publish Changes</button></section>` : `<p class="owner-published-state">Published and up to date</p>`}<section class="owner-metrics"><article><span>Live Classes</span><strong>${live.length}</strong><p>Visible on your website</p></article><article><span>Total Registrations</span><strong>${registrations.length}</strong><p>Across all classes</p></article><article><span>Upcoming Classes</span><strong>${live.filter((item) => item.date && item.date >= today).length}</strong><p>${esc(nextSession?.title || "Nothing scheduled")}</p></article><article${pendingCount ? " class=\"is-attention\"" : ""}><span>Pending Payments</span><strong>${pendingCount}</strong><p>Awaiting confirmation</p></article></section><div class="owner-overview-grid"><div class="owner-overview-main"><section class="owner-overview-section"><header><h2>Upcoming Classes</h2><button type="button" data-view="classes">View All →</button></header><div>${upcomingMarkup}</div></section><section class="owner-overview-section owner-activity"><header><h2>Recent Activity</h2><button type="button" data-view="registrations">View All →</button></header><div>${activityMarkup}</div></section></div><aside class="owner-overview-rail"><section class="owner-site-status"><div><p>Your Website is ${dirty() ? "in draft" : "Live"}</p><a href="/${encodeURIComponent(business.slug)}" target="_blank">beyond8dance.com/${esc(business.slug)} ↗</a></div><img src="${esc(imageUrl(draftState.heroImage || "assets/starter-hero-dance.jpg"))}" alt=""></section><section class="owner-rail-actions"><h2>Quick Actions</h2><button type="button" data-add-class>+ Create a New Class</button><button type="button" data-view="registrations">View Registrations</button><button type="button" data-view="website">Edit My Website</button><a href="/${encodeURIComponent(business.slug)}" target="_blank">Share My Link ↗</a></section><blockquote>More dance.<br><em>Less admin.</em></blockquote></aside></div>`;
  };
  const filteredClasses = () => classes().map((item, index) => ({ item, index })).filter(({ item }) => {
    if (classFilter.status === "published" && item.published === false) return false;
    if (classFilter.status === "draft" && item.published !== false) return false;
    if (!classFilter.search) return true;
    const query = classFilter.search.toLowerCase();
    return [item.title, item.instructor, item.style, item.venue || item.location].some((value) => String(value || "").toLowerCase().includes(query));
  });
  const classListMarkup = () => {
    if (!classes().length) return `<div class="owner-empty-state"><strong>Add your first class.</strong><p>Publish when you are ready for bookings.</p><button class="primary-button" data-add-class>Add a Class</button></div>`;
    const list = filteredClasses();
    if (!list.length) return `<div class="owner-empty-state"><strong>No classes match your search.</strong><p>Try a different search or filter.</p></div>`;
    return list.map(({ item, index }) => row(item, index)).join("");
  };
  const bindClassList = () => { const container = root.querySelector("[data-class-list]"); if (!container) return; container.querySelectorAll("[data-add-class]").forEach((button) => button.onclick = () => openForm()); container.querySelectorAll("[data-class-action]").forEach((button) => button.onclick = () => action(button.dataset.classAction, Number(button.dataset.index))); };
  const updateClassList = () => { const container = root.querySelector("[data-class-list]"); if (!container) return; container.innerHTML = classListMarkup(); bindClassList(); };
  const classView = () => `<section class="owner-dashboard-section"><header><div><p class="eyebrow">Schedule</p><h1>Classes</h1><p>Create, publish, and manage classes without leaving your dashboard.</p></div><button class="primary-button" data-add-class>+ Add Class</button></header><div class="owner-list-filters"><input type="search" placeholder="Search classes..." data-class-search value="${esc(classFilter.search)}"><select data-class-status-filter>${[["all","All statuses"],["published","Published"],["draft","Draft"]].map(([value,label]) => `<option value="${value}"${classFilter.status === value ? " selected" : ""}>${label}</option>`).join("")}</select></div><div class="owner-class-list" data-class-list>${classListMarkup()}</div></section>`;
  const filteredRegistrations = () => registrations.filter((item) => {
    if (registrationFilter.status !== "all" && item.payment_status !== registrationFilter.status) return false;
    if (!registrationFilter.search) return true;
    const query = registrationFilter.search.toLowerCase();
    return [item.student_name, item.student_email, item.class_snapshot?.title].some((value) => String(value || "").toLowerCase().includes(query));
  });
  const registrationRow = (item) => { const status = item.payment_status || "payment_pending_verification"; const isPending = status === "payment_pending_verification"; const actionButton = isPending ? `<button type="button" data-registration-confirm="${esc(item.id)}">Mark as Paid</button>` : status === "paid" ? `<button type="button" data-registration-pending="${esc(item.id)}">Mark as Pending</button>` : ""; return `<article><div><strong>${esc(item.student_name)}</strong><span>${esc(item.student_email)} • ${esc(item.student_phone)}</span></div><div><strong>${esc(item.class_snapshot?.title || "Class booking")}</strong><span>${esc(item.class_snapshot?.date || "")} ${esc(item.class_snapshot?.time || "")}</span></div><span class="owner-status ${isPending ? "is-draft" : ""}">${esc(status.replaceAll("_", " "))}</span>${actionButton ? `<div class="owner-class-actions">${actionButton}</div>` : ""}</article>`; };
  const registrationListMarkup = () => {
    if (!registrations.length) return `<div class="owner-empty-state"><strong>No registrations yet.</strong><p>Bookings appear here after a visitor completes registration.</p></div>`;
    const list = filteredRegistrations();
    if (!list.length) return `<div class="owner-empty-state"><strong>No registrations match your search.</strong><p>Try a different search or filter.</p></div>`;
    return list.map(registrationRow).join("");
  };
  const updateRegistrationPayment = async (id, paymentStatus) => {
    try {
      await app.updateRegistrationStatus({ user, businessId: business.id, registrationId: id, paymentStatus });
      const entry = registrations.find((item) => item.id === id);
      if (entry) entry.payment_status = paymentStatus;
      toast(paymentStatus === "paid" ? "Marked as paid." : "Marked as pending.");
      updateRegistrationList();
    } catch (error) {
      console.warn(error);
      toast("We couldn't update this registration. Please try again.", true);
    }
  };
  const bindRegistrationList = () => { const container = root.querySelector("[data-registration-list]"); if (!container) return; container.querySelectorAll("[data-registration-confirm]").forEach((button) => button.onclick = () => updateRegistrationPayment(button.dataset.registrationConfirm, "paid")); container.querySelectorAll("[data-registration-pending]").forEach((button) => button.onclick = () => updateRegistrationPayment(button.dataset.registrationPending, "payment_pending_verification")); };
  const updateRegistrationList = () => { const container = root.querySelector("[data-registration-list]"); if (!container) return; container.innerHTML = registrationListMarkup(); bindRegistrationList(); };
  const registrationView = () => `<section class="owner-dashboard-section"><header><div><p class="eyebrow">Students</p><h1>Registrations</h1><p>Bookings from your published website.</p></div></header><div class="owner-list-filters"><input type="search" placeholder="Search registrations..." data-registration-search value="${esc(registrationFilter.search)}"><select data-registration-status-filter>${[["all","All statuses"],["payment_pending_verification","Pending verification"],["paid","Paid"],["registered","Registered"]].map(([value,label]) => `<option value="${value}"${registrationFilter.status === value ? " selected" : ""}>${label}</option>`).join("")}</select></div><div class="owner-registration-list" data-registration-list>${registrationListMarkup()}</div></section>`;
  // Classes = what you teach (managed exclusively on the Classes tab above); Website = how you
  // look. This panel is intentionally limited to appearance/brand - no section labels, no
  // header/footer controls, no class management. Picking a theme here also restyles class cards
  // on the public site, since setup-preview-class-card is themed by data-theme-key already.
  const wfield = (label, name, value = "", type = "text", placeholder = "") => `<label>${esc(label)}<input type="${type}" name="${esc(name)}" value="${esc(value)}"${placeholder ? ` placeholder="${esc(placeholder)}"` : ""}></label>`;
  const warea = (label, name, value = "", rows = 4, placeholder = "") => `<label>${esc(label)}<textarea name="${esc(name)}" rows="${rows}"${placeholder ? ` placeholder="${esc(placeholder)}"` : ""}>${esc(value)}</textarea></label>`;
  const photoCard = (label, key, current = "", ratio = "16/9") => `<div class="owner-photo-card" data-photo-field><span class="owner-photo-label">${esc(label)}</span><div class="owner-photo-preview" style="aspect-ratio:${esc(ratio)}">${current ? `<img src="${esc(current)}" alt="">` : `<span class="owner-photo-placeholder" aria-hidden="true">🖼️</span>`}<label class="owner-photo-upload">Change photo<input type="file" accept="image/jpeg,image/png,image/webp" data-photo-upload="${esc(key)}" hidden></label></div><input type="hidden" name="${esc(key)}" value="${esc(current)}"><small data-upload-status>JPG, PNG, or WEBP up to 5MB</small></div>`;
  const galleryGrid = (images) => images.length ? `<div class="owner-gallery-manager">${images.map((src, index) => `<article><img src="${esc(src)}" alt="Gallery image ${index + 1}"><div><button type="button" data-gallery-move="${index}" data-direction="-1">Up</button><button type="button" data-gallery-move="${index}" data-direction="1">Down</button><button type="button" data-gallery-remove="${index}">Remove</button></div></article>`).join("")}</div>` : `<div class="owner-empty-state"><strong>No gallery images yet.</strong><p>Upload your first photo below.</p></div>`;
  const instagramControls = () => `<section class="owner-instagram" data-owner-instagram><div><small>Instagram feed</small><strong data-instagram-status>Checking connection...</strong><p data-instagram-help>Connect a Creator or Business account to show recent posts.</p></div><div data-instagram-settings hidden><label><input type="checkbox" data-instagram-visible> Show on website</label><label>Posts<select data-instagram-limit><option value="4">4</option><option value="6">6</option></select></label></div><div class="owner-instagram-actions"><button type="button" data-instagram-connect>Connect Instagram</button><button type="button" data-instagram-refresh hidden>Refresh</button><button type="button" data-instagram-disconnect hidden>Disconnect</button></div><small data-instagram-message></small></section>`;
  const websiteTabs = [["look", "Look & Theme"], ["hero", "Hero"], ["about", "About Me"], ["gallery", "Gallery"], ["socials", "Socials"]];
  const websiteTabNav = () => `<nav class="owner-website-tabs" aria-label="Website sections">${websiteTabs.map(([key, label]) => `<button type="button" class="${websiteTab === key ? "is-active" : ""}" data-website-tab="${key}">${label}</button>`).join("")}</nav>`;
  const websiteBanner = () => dirty() ? `<section class="owner-draft-banner"><div><strong>Unpublished changes</strong><span>Your website draft is private until you publish.</span></div><button data-publish>Publish Changes</button></section>` : `<p class="owner-published-state">✓ Published and up to date</p>`;
  const websiteLookTab = () => {
    const c = content(draftState);
    return `<div class="owner-website-panel">
      <div class="owner-theme-picker-wrap">
        <h3>Theme</h3>
        <p>Pick the overall look. Your class cards on the live site automatically match this theme.</p>
        <div class="setup-theme-picker" data-theme-picker>${templates.renderThemePicker(draftState.theme || c.theme.name)}</div>
      </div>
      <form class="owner-settings-form" data-website-form="look">
        <h3>Brand</h3>
        ${wfield("Business name", "businessName", draftState.businessName || business.business_name)}
        ${photoCard("Logo", "logoImage", draftState.logoImage || "", "1/1")}
        <button type="submit" class="primary-button">Save Changes</button>
      </form>
    </div>`;
  };
  const websiteHeroTab = () => {
    const c = content(draftState);
    return `<div class="owner-website-panel">
      <form class="owner-settings-form" data-website-form="hero">
        <h3>Hero</h3>
        ${photoCard("Hero photo", "heroImage", draftState.heroImage || c.images.hero)}
        ${wfield("Headline", "tagline", draftState.tagline || "", "text", c.headline)}
        <p>Leave blank to use your business name (set under Look & Theme). Only fill this in if you want different hero text.</p>
        <button type="submit" class="primary-button">Save Changes</button>
      </form>
    </div>`;
  };
  const websiteAboutTab = () => {
    const c = content(draftState);
    return `<div class="owner-website-panel">
      <form class="owner-settings-form" data-website-form="about">
        <h3>About Me</h3>
        ${photoCard("Your photo", "instructorImage", draftState.instructorImage || c.images.instructor, "1/1")}
        ${wfield("Your name", "instructorName", draftState.instructorName || "", "text", c.instructorName)}
        <p>Leave blank to use your business name. Only fill this in if the instructor's name differs from the business name.</p>
        ${warea("Bio", "instructorBio", draftState.instructorBio || "", 6, c.instructorBio)}
        <button type="submit" class="primary-button">Save Changes</button>
      </form>
    </div>`;
  };
  const websiteGalleryTab = () => {
    const c = content(draftState);
    const images = draftState.gallery || c.gallery;
    return `<div class="owner-website-panel">
      <h3>Gallery</h3>
      <p>Photos that showcase your studio, students, and performances.</p>
      ${galleryGrid(images)}
      <label class="owner-gallery-add">+ Add photo<input type="file" accept="image/jpeg,image/png,image/webp" data-photo-upload="gallery:add" hidden></label>
    </div>`;
  };
  const websiteSocialsTab = () => `<div class="owner-website-panel">
      <form class="owner-settings-form" data-website-form="socials">
        <h3>Social links</h3>
        ${wfield("Instagram", "instagram", draftState.instagram || "")}
        ${wfield("TikTok", "tiktok", draftState.tiktok || "")}
        ${wfield("YouTube", "youtube", draftState.youtube || "")}
        <button type="submit" class="primary-button">Save Changes</button>
      </form>
      ${instagramControls()}
    </div>`;
  const websiteTabBody = () => ({ look: websiteLookTab, hero: websiteHeroTab, about: websiteAboutTab, gallery: websiteGalleryTab, socials: websiteSocialsTab })[websiteTab]();
  const websiteView = () => `<section class="owner-dashboard-section"><header><div><p class="eyebrow">Style your website</p><h1>Look, feel, and story.</h1><p>Classes are managed from the Classes tab. This is just how your website looks.</p></div><a class="secondary-button" href="/${encodeURIComponent(business.slug)}" target="_blank">View Public Site</a></header>${websiteBanner()}${websiteTabNav()}${websiteTabBody()}</section>`;
  const settingsView = () => `<section class="owner-dashboard-section"><header><div><p class="eyebrow">Account</p><h1>Settings & Payments</h1><p>Configure the Venmo destination shown during booking.</p></div></header><form class="owner-settings-form" data-payment><label>Venmo Username<input name="venmoUsername" value="${esc(draftState.venmoUsername || "")}" placeholder="@yourname"></label><label>Venmo Payment URL<input name="venmoUrl" type="url" value="${esc(draftState.venmoUrl || "")}" placeholder="https://venmo.com/u/yourname"></label><small>Payments remain pending verification until you confirm them manually.</small><button class="primary-button">Save payment settings</button></form></section>`;
  const comingSoon = (title, copy) => `<section class="owner-dashboard-section"><header><div><p class="eyebrow">Coming soon</p><h1>${title}</h1><p>${esc(copy)}</p></div></header><div class="owner-empty-state"><strong>${esc(title)} isn't available yet.</strong><p>We'll let you know as soon as it ships.</p></div></section>`;
  const render = () => { const views = { overview, classes: classView, registrations: registrationView, website: websiteView, settings: settingsView, instructors: () => comingSoon("Instructors", "Add co-teachers and let visitors see who's running each class."), reviews: () => comingSoon("Reviews", "Collect and showcase student reviews on your public site."), analytics: () => comingSoon("Analytics", "Visitor traffic and booking insights for your website.") }; root.innerHTML = `<div class="owner-shell">${nav()}${views[activeView]()}</div>`; bind(); };
  const persist = async (publish, message) => { if (saving) return; saving = true; try { draftState.classes = classes(); await app.saveWebsiteDraft({ user, businessId: business.id, state: draftState }); if (publish) { await app.publishWebsiteDraft({ user, businessId: business.id, state: draftState }); publishedState = clone(draftState); } toast(message); } catch (error) { console.warn(error); toast("We couldn't save your changes. Please try again.", true); } finally { saving = false; render(); } };
  const selectTheme = async (themeName) => { draftState.theme = themeName; await persist(false, "Theme updated."); };
  const moveGalleryImage = async (from, direction) => {
    const gallery = draftState.gallery || content(draftState).gallery;
    const to = from + direction;
    if (to < 0 || to >= gallery.length) return;
    const next = [...gallery];
    [next[from], next[to]] = [next[to], next[from]];
    draftState.gallery = next;
    await persist(false, "Gallery updated.");
  };
  const removeGalleryImage = async (index) => {
    const gallery = [...(draftState.gallery || content(draftState).gallery)];
    gallery.splice(index, 1);
    draftState.gallery = gallery;
    await persist(false, "Gallery updated.");
  };
  const uploadWebsiteImage = async (input) => {
    const file = input.files?.[0];
    if (!file) return;
    const key = input.dataset.photoUpload;
    input.disabled = true;
    try {
      const result = await app.uploadBusinessMedia({ user, businessId: business.id, file, kind: key });
      if (key === "gallery:add") {
        draftState.gallery = [...(draftState.gallery || content(draftState).gallery), result.publicUrl];
        await persist(false, "Gallery updated.");
        return;
      }
      const card = input.closest("[data-photo-field]");
      const hidden = card?.querySelector(`input[type=hidden][name="${key}"]`);
      if (hidden) hidden.value = result.publicUrl;
      const preview = card?.querySelector(".owner-photo-preview");
      preview?.querySelector("img, .owner-photo-placeholder")?.remove();
      preview?.insertAdjacentHTML("afterbegin", `<img src="${esc(result.publicUrl)}" alt="">`);
      const status = card?.querySelector("[data-upload-status]");
      if (status) status.textContent = "Photo updated — click Save Changes to publish.";
    } catch (error) {
      toast(error.message || "Upload failed. Please try again.", true);
    } finally {
      input.disabled = false;
    }
  };
  const saveWebsiteForm = async (event, message) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    for (const [key, value] of data.entries()) draftState[key] = value;
    await persist(false, message);
  };
  const ownerApiRequest = async (url, options = {}) => {
    const { data } = await app.client.auth.getSession();
    const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}`, ...(options.headers || {}) } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Instagram request failed.");
    return payload;
  };
  const bindInstagramEditor = (scope) => {
    const card = scope.querySelector("[data-owner-instagram]");
    if (!card) return;
    const statusNode = card.querySelector("[data-instagram-status]");
    const help = card.querySelector("[data-instagram-help]");
    const settings = card.querySelector("[data-instagram-settings]");
    const visible = card.querySelector("[data-instagram-visible]");
    const limit = card.querySelector("[data-instagram-limit]");
    const connect = card.querySelector("[data-instagram-connect]");
    const refresh = card.querySelector("[data-instagram-refresh]");
    const disconnect = card.querySelector("[data-instagram-disconnect]");
    const message = card.querySelector("[data-instagram-message]");
    const showStatus = (result = {}) => {
      const connected = Boolean(result.connected);
      statusNode.textContent = connected ? `Connected as @${result.username}` : "Not connected";
      help.textContent = result.needsReconnect ? "Reconnect Instagram to resume updates." : connected ? "Recent posts are cached securely for your website." : "Requires an Instagram Creator or Business account.";
      settings.hidden = !connected; refresh.hidden = !connected; disconnect.hidden = !connected;
      connect.textContent = connected ? "Reconnect" : "Connect Instagram";
      visible.checked = result.showOnWebsite !== false; limit.value = String(result.postLimit || 6);
    };
    const requestStatus = () => ownerApiRequest(`/api/instagram/manage?businessId=${encodeURIComponent(business.id)}`).then(showStatus).catch((error) => { statusNode.textContent = "Connection unavailable"; message.textContent = error.message; });
    connect.addEventListener("click", async () => { try { message.textContent = "Opening Instagram..."; const result = await ownerApiRequest("/api/instagram/connect", { method: "POST", body: JSON.stringify({ businessId: business.id }) }); window.location.assign(result.authorizationUrl); } catch (error) { message.textContent = error.message; } });
    refresh.addEventListener("click", async () => { try { message.textContent = "Refreshing..."; showStatus(await ownerApiRequest("/api/instagram/manage", { method: "POST", body: JSON.stringify({ businessId: business.id, action: "refresh" }) })); message.textContent = "Feed refreshed."; } catch { message.textContent = "Refresh failed. Cached posts remain available."; } });
    const saveSettings = async () => { try { showStatus(await ownerApiRequest("/api/instagram/manage", { method: "POST", body: JSON.stringify({ businessId: business.id, action: "settings", showOnWebsite: visible.checked, postLimit: Number(limit.value) }) })); message.textContent = "Instagram settings saved."; } catch (error) { message.textContent = error.message; } };
    visible.addEventListener("change", saveSettings); limit.addEventListener("change", saveSettings);
    disconnect.addEventListener("click", async () => { if (!window.confirm("Disconnect Instagram and remove its feed from your website?")) return; try { showStatus(await ownerApiRequest("/api/instagram/manage", { method: "POST", body: JSON.stringify({ businessId: business.id, action: "disconnect" }) })); message.textContent = "Instagram disconnected."; } catch (error) { message.textContent = error.message; } });
    requestStatus();
  };

  const formHtml = (item = {}) => `<form class="owner-class-form" data-class-form><header><div><p class="eyebrow">${editingIndex < 0 ? "New class" : "Edit class"}</p><h2>${editingIndex < 0 ? "Add Class" : esc(item.title)}</h2></div><button type="button" data-close aria-label="Close">×</button></header><div class="owner-form-grid"><fieldset><legend>Class details</legend><label>Class Name<input required name="title" value="${esc(item.title || "")}"></label><label>Dance Style<input required name="style" value="${esc(item.style || "")}"></label><label>Short Description<textarea required name="description">${esc(item.description || "")}</textarea></label><label class="owner-image-field">Class Image<img src="${esc(imageUrl(item.image))}" data-image-preview alt="Preview"><input type="file" accept="image/jpeg,image/png,image/webp" data-image><small data-upload>JPG, PNG, or WEBP up to 5MB</small></label><input type="hidden" name="image" value="${esc(item.image || "")}"></fieldset><fieldset><legend>Schedule</legend><label>Date<input required type="date" name="date" value="${esc(item.date || "")}"></label><label>Start Time<input required type="time" name="time" value="${esc(item.time || "")}"></label><label>Duration<input required name="duration" value="${esc(item.duration || "60 minutes")}"></label><legend>Location</legend><label>Format<select name="format"><option${item.format !== "Online" ? " selected" : ""}>In Person</option><option${item.format === "Online" ? " selected" : ""}>Online</option></select></label><label>Venue Name<input name="venue" value="${esc(item.venue || item.location || "")}"></label><label>Address<input name="address" value="${esc(item.address || "")}"></label><label>City<input name="city" value="${esc(item.city || "")}"></label><label>Online Link<input type="url" name="onlineLink" value="${esc(item.onlineLink || "")}"></label></fieldset><fieldset><legend>Class info</legend><label>Level<select name="level">${["Beginner","Intermediate","Advanced","Open Level"].map((value) => `<option${String(item.level || "Open Level").toLowerCase() === value.toLowerCase() ? " selected" : ""}>${value}</option>`).join("")}</select></label><label>Instructor<input name="instructor" value="${esc(item.instructor || draftState.instructorName || "")}"></label><label>Price<input required name="price" value="${esc(item.price ?? "$25")}"></label><label>Capacity<input required type="number" min="1" name="capacity" value="${esc(item.capacity || "20")}"></label><legend>Booking</legend><label class="owner-check"><input type="checkbox" name="registrationOpen"${item.registrationOpen !== false ? " checked" : ""}> Registration open</label><label class="owner-check"><input type="checkbox" name="venmoRequired"${item.venmoRequired !== false ? " checked" : ""}> Venmo payment required</label><label>Booking Notes<textarea name="bookingNotes">${esc(item.bookingNotes || "")}</textarea></label></fieldset></div><footer><button type="button" data-close>Cancel</button><button type="submit" value="draft">Save Draft</button><button class="primary-button" type="submit" value="publish">Publish Class</button></footer></form>`;
  const openForm = (index = -1) => { editingIndex = index; const item = index >= 0 ? classes()[index] : {}; document.body.insertAdjacentHTML("beforeend", `<div class="owner-modal" data-modal role="dialog" aria-modal="true"><div>${formHtml(item)}</div></div>`); const modal = document.querySelector("[data-modal]"); modal.querySelectorAll("[data-close]").forEach((button) => button.onclick = closeModal); modal.querySelector("[data-image]").onchange = uploadImage; modal.querySelector("form").onsubmit = saveClass; modal.querySelector("input")?.focus(); };
  const closeModal = () => { document.querySelector("[data-modal]")?.remove(); editingIndex = -1; };
  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = event.target.form;
    const status = form.querySelector("[data-upload]");
    const controls = [...form.querySelectorAll("button[type=submit], [data-image]")];
    form.dataset.uploading = "true";
    controls.forEach((control) => control.disabled = true);
    status.textContent = "Uploading...";
    try {
      const result = await app.uploadBusinessMedia({ user, businessId: business.id, file, kind: "class" });
      form.elements.image.value = result.publicUrl;
      form.querySelector("[data-image-preview]").src = result.publicUrl;
      status.textContent = "Image uploaded.";
    } catch (error) {
      console.warn("Class image upload failed:", error);
      status.textContent = `Image upload failed: ${error.message || "Please try again."} You can still save without a new image.`;
    } finally {
      form.dataset.uploading = "false";
      controls.forEach((control) => control.disabled = false);
    }
  };
  const saveError = (error) => `${error.message || "Class could not be saved."}${error.code ? ` (${error.code})` : ""}`;
  const runClassMutation = async (operation, message, onSuccess) => {
    if (saving) return false;
    saving = true;
    const controls = [...document.querySelectorAll("[data-modal] button, [data-modal] input, [data-class-action], [data-add-class]")];
    controls.forEach((control) => control.disabled = true);
    try {
      const result = await operation();
      draftState = clone(result.draft_content);
      publishedState = clone(result.published_content);
      onSuccess?.();
      render();
      toast(message);
      return true;
    } catch (error) {
      console.warn("Class persistence failed:", error);
      const form = document.querySelector("[data-class-form]");
      if (form) {
        form.querySelector("[data-save-error]")?.remove();
        form.querySelector("footer").insertAdjacentHTML("beforebegin", `<p role="alert" data-save-error>${esc(saveError(error))}</p>`);
      }
      toast(saveError(error), true);
      return false;
    } finally {
      saving = false;
      controls.forEach((control) => control.disabled = false);
    }
  };
  const saveClass = async (event) => {
    event.preventDefault();
    if (saving || event.currentTarget.dataset.uploading === "true") return;
    const intent = event.submitter?.value || "draft";
    const data = new FormData(event.currentTarget);
    const old = editingIndex >= 0 ? classes()[editingIndex] : null;
    const values = { ...old, ...Object.fromEntries(data), location: data.get("venue"), registrationOpen: data.has("registrationOpen"), venmoRequired: data.has("venmoRequired"), published: intent === "publish" };
    await runClassMutation(() => old
      ? app.updateClass({ businessId: business.id, classId: old.id, values })
      : app.createClass({ businessId: business.id, values }),
    intent === "publish" ? "Class published." : "Class saved as draft.", closeModal);
  };
  const action = async (name, index) => {
    if (saving) return;
    const item = classes()[index];
    if (name === "edit") return openForm(index);
    if (name === "registrations") { activeView = "registrations"; return render(); }
    const target = { businessId: business.id, classId: item.id };
    if (name === "duplicate") return runClassMutation(() => app.duplicateClass(target), "Class duplicated as a draft.");
    if (name === "toggle") return runClassMutation(() => app.updateClass({ ...target, values: { ...item, published: item.published === false } }), item.published === false ? "Class published." : "Class unpublished.");
    if (name === "highlight") return runClassMutation(() => app.highlightClass(target), item.highlighted ? "Class highlight removed." : "Class highlighted.");
    if (name === "delete") {
      document.body.insertAdjacentHTML("beforeend", `<div class="owner-modal owner-confirm" data-confirm role="alertdialog"><div><h2>Delete “${esc(item.title)}”?</h2><p>This cannot be undone. Registration history will remain available.</p><footer><button data-cancel-delete>Cancel</button><button class="owner-danger" data-delete>Delete Class</button></footer></div></div>`);
      const close = () => document.querySelector("[data-confirm]")?.remove();
      document.querySelector("[data-cancel-delete]").onclick = close;
      document.querySelector("[data-delete]").onclick = () => runClassMutation(() => app.deleteClass(target), "Class deleted.", close);
    }
  };
  const bind = () => { root.querySelectorAll("[data-view]").forEach((button)=>button.onclick=()=>{activeView=button.dataset.view;render();}); root.querySelectorAll("[data-add-class]").forEach((button)=>button.onclick=()=>openForm()); root.querySelectorAll("[data-class-action]").forEach((button)=>button.onclick=()=>action(button.dataset.classAction,Number(button.dataset.index))); root.querySelectorAll("[data-publish]").forEach((button)=>button.onclick=()=>persist(true,"Changes published.")); root.querySelector("[data-payment]")?.addEventListener("submit",async(event)=>{event.preventDefault();const data=new FormData(event.currentTarget);draftState.venmoUsername=String(data.get("venmoUsername")||"").replace(/^@/,"");draftState.venmoUrl=data.get("venmoUrl");await persist(false,"Payment settings saved.");}); root.querySelector("[data-class-search]")?.addEventListener("input",(event)=>{classFilter.search=event.target.value;updateClassList();}); root.querySelector("[data-class-status-filter]")?.addEventListener("change",(event)=>{classFilter.status=event.target.value;updateClassList();}); root.querySelector("[data-registration-search]")?.addEventListener("input",(event)=>{registrationFilter.search=event.target.value;updateRegistrationList();}); root.querySelector("[data-registration-status-filter]")?.addEventListener("change",(event)=>{registrationFilter.status=event.target.value;updateRegistrationList();}); bindRegistrationList(); root.querySelector("[data-pending-payments]")?.addEventListener("click",()=>{registrationFilter.status="payment_pending_verification";activeView="registrations";render();}); root.querySelectorAll("[data-website-tab]").forEach((button) => button.onclick = () => { websiteTab = button.dataset.websiteTab; render(); }); root.querySelector("[data-theme-picker]")?.addEventListener("change", (event) => { if (event.target.name === "setupTheme") selectTheme(event.target.value); }); root.querySelectorAll("[data-website-form]").forEach((form) => form.addEventListener("submit", (event) => saveWebsiteForm(event, "Website updated."))); root.querySelectorAll("[data-photo-upload]").forEach((input) => input.addEventListener("change", () => uploadWebsiteImage(input))); root.querySelectorAll("[data-gallery-move]").forEach((button) => button.onclick = () => moveGalleryImage(Number(button.dataset.galleryMove), Number(button.dataset.direction))); root.querySelectorAll("[data-gallery-remove]").forEach((button) => button.onclick = () => removeGalleryImage(Number(button.dataset.galleryRemove))); bindInstagramEditor(root); };
  try { if (!app?.client) throw new Error(); user=await app.getSessionUser(); if (!user) return location.replace("/?login=1"); const result=await app.getPrimaryBusiness(user.id); business=result.business; if (!business) return location.replace("/?onboarding=1&app=1"); await app.assertBusinessOwner(user,business.id); bundle=await app.getBusinessBundle(business.id); draftState=clone(Object.keys(bundle.website?.draft_content||{}).length?bundle.website.draft_content:bundle.website?.published_content||bundle.settings?.generated_content||{}); publishedState=clone(bundle.website?.published_content||{}); draftState.classes=classes(); try{registrations=await app.listRegistrations({user,businessId:business.id});}catch(error){console.warn(error);} render(); } catch(error){console.warn(error);root.innerHTML=`<section class="route-loading"><h1>We couldn't load your dashboard.</h1><p>Please refresh or sign in again.</p><a class="primary-button" href="/?login=1">Sign in</a></section>`;}
  logout?.addEventListener("click",async()=>{await app.signOut();location.replace("/");});
})();
