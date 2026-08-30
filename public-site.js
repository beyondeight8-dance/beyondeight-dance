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
  let user = null;
  let bundle = null;
  let state = {};
  let savedState = {};
  let publishedState = {};
  let activeSection = "";
  let editMode = false;
  let dirty = false;
  let saveTimer = 0;
  let saving = false;

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
  const statusText = () => saving ? "Saving..." : dirty ? "Unpublished changes" : "All changes published";
  const ownerToolbar = () => !isOwner() ? "" : `<div class="owner-toolbar" data-owner-toolbar><strong>BeyondEight Owner</strong><span data-owner-status>${esc(statusText())}</span><button type="button" data-owner-edit>${editMode ? "Done Editing" : "Edit Website"}</button>${dirty ? `<button type="button" class="owner-publish" data-owner-publish>Publish Changes</button>` : ""}<a href="/dashboard/">Manage Classes</a><button type="button" data-owner-visitor>View as Visitor</button></div>`;

  const loadInstagram = () => {
    const mount = root.querySelector("[data-instagram-feed]");
    if (!mount || !bundle?.business?.id) return;
    fetch(`/api/instagram/feed?businessId=${encodeURIComponent(bundle.business.id)}`)
      .then((response) => response.ok ? response.json() : { items: [] })
      .then((feed) => { mount.innerHTML = templates.renderInstagramSection(feed); })
      .catch(() => mount.replaceChildren());
  };
  const render = ({ keepDrawer = true } = {}) => {
    const content = contentForState();
    document.body.classList.remove("generated-elegant", "generated-bold", "generated-soft", "generated-vibrant", "generated-minimal", "owner-edit-mode");
    document.body.classList.add(templates.themeClassFor(content.theme.name));
    if (editMode) document.body.classList.add("owner-edit-mode");
    document.title = `${content.brandName} | BeyondEight`;
    root.innerHTML = templates.renderPublicSite(content, { ownerToolbar: ownerToolbar(), logoUrl: state.logoImage || "" });
    if (editMode) root.querySelectorAll("[data-edit-section]").forEach((section) => { section.tabIndex = 0; section.setAttribute("aria-label", `Edit ${section.dataset.editSection} section`); });
    bindOwnerEvents();
    loadInstagram();
    if (keepDrawer && activeSection) openEditor(activeSection, false);
  };
  const markDirty = () => {
    dirty = JSON.stringify(state) !== JSON.stringify(publishedState);
    const status = root.querySelector("[data-owner-status]");
    if (status) status.textContent = statusText();
    const toolbar = root.querySelector("[data-owner-toolbar]");
    if (toolbar && dirty && !toolbar.querySelector("[data-owner-publish]")) {
      toolbar.querySelector("[data-owner-edit]")?.insertAdjacentHTML("afterend", `<button type="button" class="owner-publish" data-owner-publish>Publish Changes</button>`);
      toolbar.querySelector("[data-owner-publish]").addEventListener("click", publishChanges);
    }
  };
  const saveDraft = async () => {
    if (!isOwner() || !dirty || saving) return;
    saving = true;
    const status = root.querySelector("[data-owner-status]");
    if (status) status.textContent = "Saving...";
    try {
      await app.saveWebsiteDraft({ user, businessId: bundle.business.id, state });
      savedState = clone(state);
      if (status) status.textContent = "Draft saved";
    } catch (error) {
      if (status) status.textContent = error.message || "Draft could not be saved";
    } finally { saving = false; }
  };
  const scheduleSave = () => { window.clearTimeout(saveTimer); markDirty(); saveTimer = window.setTimeout(saveDraft, 800); };
  const field = (label, name, value = "", type = "text") => `<label>${esc(label)}<input type="${type}" name="${esc(name)}" value="${esc(value)}"></label>`;
  const area = (label, name, value = "") => `<label>${esc(label)}<textarea name="${esc(name)}" rows="4">${esc(value)}</textarea></label>`;
  const instagramControls = () => `<section class="owner-instagram" data-owner-instagram><div><small>Instagram feed</small><strong data-instagram-status>Checking connection...</strong><p data-instagram-help>Connect a Creator or Business account to show recent posts.</p></div><div data-instagram-settings hidden><label><input type="checkbox" data-instagram-visible> Show on website</label><label>Posts<select data-instagram-limit><option value="4">4</option><option value="6">6</option></select></label></div><div class="owner-instagram-actions"><button type="button" data-instagram-connect>Connect Instagram</button><button type="button" data-instagram-refresh hidden>Refresh</button><button type="button" data-instagram-disconnect hidden>Disconnect</button></div><small data-instagram-message></small></section>`;
  const imageField = (label, key, current = "") => `<label class="owner-image-field">${esc(label)}${current ? `<img src="${esc(current)}" alt="Current ${esc(label.toLowerCase())}">` : ""}<input type="file" accept="image/jpeg,image/png,image/webp" data-owner-image="${esc(key)}"><small>JPG, PNG, or WEBP up to 10MB</small></label>`;
  const classEditor = () => (state.classes || contentForState().classes).map((item, index) => `<fieldset data-class-index="${index}"><legend>Class ${index + 1}</legend><div class="owner-reorder"><button type="button" data-move-class="${index}" data-direction="-1" aria-label="Move class up">Up</button><button type="button" data-move-class="${index}" data-direction="1" aria-label="Move class down">Down</button></div>${field("Class name", "title", item.title)}${field("Dance style", "style", item.style)}${field("Date", "date", item.date)}${field("Time", "time", item.time)}${field("Duration", "duration", item.duration || "60 minutes")}${field("Location", "location", item.location)}${field("Format (online or in person)", "format", item.format || "In person")}${field("Level", "level", item.level)}${field("Price", "price", item.price)}${field("Capacity", "capacity", item.capacity || "20")}${field("Available spots", "spots", item.spots)}${field("Instructor", "instructor", item.instructor)}${field("Booking link", "bookingUrl", item.bookingUrl || "#contact")}${area("Description", "description", item.description || "")}${imageField("Class image", `class:${index}`, item.image)}<button type="button" class="owner-remove" data-remove-class="${index}">Remove class</button></fieldset>`).join("");
  const editorBody = (section) => {
    const content = contentForState();
    const workshop = state.workshop || content.workshop;
    return ({
      header: `${field("Brand name", "businessName", state.businessName)}${imageField("Logo", "logoImage", state.logoImage)}${field("Instagram", "instagram", state.instagram)}${field("TikTok", "tiktok", state.tiktok)}${field("YouTube", "youtube", state.youtube)}`,
      hero: `${field("Headline", "tagline", state.tagline || content.headline)}${area("Supporting text", "whatYouDo", state.whatYouDo || content.whatYouDo)}${field("Dance styles (comma separated)", "styles", (state.styles || content.styles).join(", "))}${field("Call to action", "ctaText", state.ctaText || content.ctaText)}${field("Call to action link", "ctaLink", state.ctaLink || content.ctaLink)}${imageField("Hero image", "heroImage", state.heroImage || content.images.hero)}`,
      classes: `<div data-class-list>${classEditor()}</div><button type="button" data-add-class>+ Add Class</button>`,
      workshop: `${field("Title", "workshop.title", workshop.title)}${area("Description", "workshop.description", workshop.description)}${field("Date", "workshop.date", workshop.date)}${field("Time", "workshop.time", workshop.time)}${field("Location", "workshop.location", workshop.location)}${field("Level", "workshop.level", workshop.level)}${field("Price", "workshop.price", workshop.price)}${imageField("Workshop image", "workshopImage", state.workshopImage || content.images.workshop)}`,
      about: `${field("Instructor name", "instructorName", state.instructorName || content.instructorName)}${area("Biography", "instructorBio", state.instructorBio || content.instructorBio)}${area("Teaching philosophy", "mission", state.mission || content.mission)}${area("Why dancers join", "whyJoin", state.whyJoin || content.whyJoin)}${imageField("Instructor portrait", "instructorImage", state.instructorImage || content.images.instructor)}`,
      gallery: `${area("Gallery image URLs (one per line)", "gallery", (state.gallery || content.gallery).join("\n"))}${imageField("Add gallery image", "gallery:add")}`,
      testimonials: area("Testimonials (Name | Quote, one per line)", "testimonials", (state.testimonials || content.testimonials).map((item) => item.join(" | ")).join("\n")),
      faq: area("FAQ (Question | Answer, one per line)", "faqs", (state.faqs || content.faqs).map((item) => item.join(" | ")).join("\n")),
      contact: `${field("Email", "email", state.email || "")}${field("Instagram", "instagram", state.instagram || "")}${field("TikTok", "tiktok", state.tiktok || "")}${field("YouTube", "youtube", state.youtube || "")}${field("Website", "website", state.website || "")}${field("Location", "location", state.location || "")}${instagramControls()}`,
      footer: `${field("Brand tagline", "tagline", state.tagline || content.tagline)}${field("Email", "email", state.email || "")}${field("Instagram", "instagram", state.instagram || "")}`
    })[section] || "";
  };
  const updateStateFromForm = (form) => {
    const active = document.activeElement;
    const activeName = active?.name || "";
    const selectionStart = typeof active?.selectionStart === "number" ? active.selectionStart : null;
    const selectionEnd = typeof active?.selectionEnd === "number" ? active.selectionEnd : null;
    if (form.dataset.editorSection === "classes") {
      state.classes = [...form.querySelectorAll("[data-class-index]")].map((group) => Object.fromEntries([...group.querySelectorAll("input:not([type=file]), textarea")].map((input) => [input.name, input.value])));
    } else new FormData(form).forEach((value, key) => {
      if (key === "styles") state.styles = String(value).split(",").map((item) => item.trim()).filter(Boolean);
      else if (key === "gallery") state.gallery = String(value).split(/\n+/).map((item) => item.trim()).filter(Boolean);
      else if (key === "testimonials" || key === "faqs") state[key] = String(value).split(/\n+/).map((line) => line.split("|").map((part) => part.trim())).filter((item) => item[0] && item[1]);
      else if (key.startsWith("workshop.")) state.workshop = { ...(state.workshop || contentForState().workshop), [key.split(".")[1]]: value };
      else state[key] = value;
    });
    scheduleSave();
    render();
    if (activeName) {
      const replacement = [...document.querySelectorAll("[data-owner-drawer] [name]")].find((input) => input.name === activeName);
      replacement?.focus({ preventScroll: true });
      if (selectionStart !== null && replacement?.setSelectionRange) replacement.setSelectionRange(selectionStart, selectionEnd);
    }
  };
  const uploadImage = async (input) => {
    const file = input.files?.[0];
    if (!file) return;
    const message = input.parentElement.querySelector("small");
    message.textContent = "Uploading...";
    try {
      const key = input.dataset.ownerImage;
      const result = await app.uploadBusinessMedia({ user, businessId: bundle.business.id, file, kind: key });
      if (key.startsWith("class:")) {
        state.classes = state.classes || clone(contentForState().classes);
        state.classes[Number(key.split(":")[1])].image = result.publicUrl;
      }
      else if (key === "gallery:add") state.gallery = [...(state.gallery || contentForState().gallery), result.publicUrl];
      else state[key] = result.publicUrl;
      scheduleSave(); render();
    } catch (error) { message.textContent = error.message || "Upload failed"; }
  };
  const ownerApiRequest = async (url, options = {}) => {
    const { data } = await app.client.auth.getSession();
    const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}`, ...(options.headers || {}) } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Instagram request failed.");
    return payload;
  };
  const bindInstagramEditor = (drawer) => {
    const card = drawer.querySelector("[data-owner-instagram]");
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
    const requestStatus = () => ownerApiRequest(`/api/instagram/manage?businessId=${encodeURIComponent(bundle.business.id)}`).then(showStatus).catch((error) => { statusNode.textContent = "Connection unavailable"; message.textContent = error.message; });
    connect.addEventListener("click", async () => { try { message.textContent = "Opening Instagram..."; const result = await ownerApiRequest("/api/instagram/connect", { method: "POST", body: JSON.stringify({ businessId: bundle.business.id }) }); window.location.assign(result.authorizationUrl); } catch (error) { message.textContent = error.message; } });
    refresh.addEventListener("click", async () => { try { message.textContent = "Refreshing..."; showStatus(await ownerApiRequest("/api/instagram/manage", { method: "POST", body: JSON.stringify({ businessId: bundle.business.id, action: "refresh" }) })); message.textContent = "Feed refreshed."; loadInstagram(); } catch { message.textContent = "Refresh failed. Cached posts remain available."; } });
    const saveSettings = async () => { try { showStatus(await ownerApiRequest("/api/instagram/manage", { method: "POST", body: JSON.stringify({ businessId: bundle.business.id, action: "settings", showOnWebsite: visible.checked, postLimit: Number(limit.value) }) })); message.textContent = "Instagram settings saved."; loadInstagram(); } catch (error) { message.textContent = error.message; } };
    visible.addEventListener("change", saveSettings); limit.addEventListener("change", saveSettings);
    disconnect.addEventListener("click", async () => { if (!window.confirm("Disconnect Instagram and remove its feed from your website?")) return; try { showStatus(await ownerApiRequest("/api/instagram/manage", { method: "POST", body: JSON.stringify({ businessId: bundle.business.id, action: "disconnect" }) })); message.textContent = "Instagram disconnected."; loadInstagram(); } catch (error) { message.textContent = error.message; } });
    requestStatus();
  };
  const openEditor = (section, focus = true) => {
    if (!editMode) return;
    activeSection = section;
    document.querySelector("[data-owner-drawer]")?.remove();
    document.body.insertAdjacentHTML("beforeend", `<aside class="owner-editor-drawer" data-owner-drawer aria-label="Edit ${esc(section)}"><header><div><small>Editing section</small><h2>${esc(section.replace(/^./, (letter) => letter.toUpperCase()))}</h2></div><button type="button" data-close-editor aria-label="Close editor">Close</button></header><form data-editor-section="${esc(section)}">${editorBody(section)}<footer><button type="button" data-cancel-editor>Cancel</button><button type="button" class="owner-done" data-done-editor>Done</button></footer></form></aside>`);
    const drawer = document.querySelector("[data-owner-drawer]");
    const form = drawer.querySelector("form");
    form.addEventListener("input", (event) => { if (!event.target.closest("[data-owner-instagram]") && !event.target.matches("[type=file]")) updateStateFromForm(form); });
    form.addEventListener("change", (event) => { if (event.target.matches("[data-owner-image]")) uploadImage(event.target); });
    drawer.querySelector("[data-close-editor]").addEventListener("click", closeEditor);
    drawer.querySelector("[data-done-editor]").addEventListener("click", closeEditor);
    drawer.querySelector("[data-cancel-editor]").addEventListener("click", () => { state = clone(savedState); dirty = JSON.stringify(state) !== JSON.stringify(publishedState); closeEditor(); render({ keepDrawer: false }); });
    form.querySelector("[data-add-class]")?.addEventListener("click", () => { state.classes = [...(state.classes || contentForState().classes), { title: "New Class", style: "Open", date: "Coming soon", time: "TBA", duration: "60 minutes", location: "In studio", level: "Open level", price: "$25", spots: "12 spots left", instructor: state.instructorName || contentForState().instructorName }]; scheduleSave(); render(); });
    form.querySelectorAll("[data-move-class]").forEach((button) => button.addEventListener("click", () => { const from = Number(button.dataset.moveClass); const to = from + Number(button.dataset.direction); state.classes = state.classes || clone(contentForState().classes); if (to < 0 || to >= state.classes.length) return; [state.classes[from], state.classes[to]] = [state.classes[to], state.classes[from]]; scheduleSave(); render(); }));
    form.querySelectorAll("[data-remove-class]").forEach((button) => button.addEventListener("click", () => { state.classes.splice(Number(button.dataset.removeClass), 1); scheduleSave(); render(); }));
    bindInstagramEditor(drawer);
    if (focus) drawer.querySelector("input, textarea, button")?.focus();
  };
  const closeEditor = () => { activeSection = ""; document.querySelector("[data-owner-drawer]")?.remove(); };
  const publishChanges = async () => {
    if (!isOwner() || saving) return;
    const button = root.querySelector("[data-owner-publish]");
    if (button) { button.disabled = true; button.textContent = "Publishing..."; }
    try {
      await app.publishWebsiteDraft({ user, businessId: bundle.business.id, state });
      savedState = clone(state); publishedState = clone(state); dirty = false; closeEditor(); editMode = false; render({ keepDrawer: false });
      root.insertAdjacentHTML("afterbegin", `<div class="owner-publish-toast" role="status">Your website is live.</div>`);
      window.setTimeout(() => root.querySelector(".owner-publish-toast")?.remove(), 3000);
    } catch (error) { if (button) { button.disabled = false; button.textContent = error.message || "Try publishing again"; } }
  };
  function bindOwnerEvents() {
    root.querySelectorAll("[data-booking-url]").forEach((button) => button.addEventListener("click", () => {
      const destination = button.dataset.bookingUrl || "#contact";
      if (destination.startsWith("#")) document.querySelector(destination)?.scrollIntoView({ behavior: "smooth" });
      else window.location.assign(destination);
    }));
    root.querySelector("[data-owner-edit]")?.addEventListener("click", () => { editMode = !editMode; closeEditor(); render({ keepDrawer: false }); });
    root.querySelector("[data-owner-publish]")?.addEventListener("click", publishChanges);
    root.querySelector("[data-owner-visitor]")?.addEventListener("click", () => { editMode = false; root.querySelector("[data-owner-toolbar]")?.remove(); closeEditor(); });
    if (editMode) root.querySelectorAll("[data-edit-section]").forEach((section) => section.addEventListener("click", (event) => { if (event.target.closest("a, button, input")) return; event.preventDefault(); openEditor(section.dataset.editSection); }));
  }
  try {
    if (!slug || app.reservedSlugs?.has(slug)) return publicError("Page not found.", "This BeyondEight page does not exist.");
    if (querySlug && window.location.pathname.includes("404.html")) window.history.replaceState({}, "", `/${slug}`);
    const localSites = JSON.parse(window.localStorage.getItem(LOCAL_PUBLISHED_SITES_KEY) || "{}");
    const publicBundle = localSites[slug] || await app.getBusinessBundleBySlug(slug);
    if (!publicBundle) return publicError("Website not published yet.", "This BeyondEight site is private or unavailable.");
    user = await app.getSessionUser?.().catch(() => null);
    const ownsPublicBundle = Boolean(user && publicBundle.business.owner_user_id === user.id && !String(publicBundle.business.id).startsWith("local-"));
    bundle = ownsPublicBundle ? await app.getBusinessBundle(publicBundle.business.id) : publicBundle;
    state = stateForBundle(bundle, ownsPublicBundle ? "owner" : "public");
    savedState = clone(state);
    publishedState = stateForBundle({ ...bundle, mode: "public" }, "public");
    dirty = ownsPublicBundle && Object.keys(bundle.website?.published_content || {}).length > 0 && JSON.stringify(state) !== JSON.stringify(publishedState);
    if (!templates) return publicError("We could not load this website.", "The shared BeyondEight template system did not load.");
    render({ keepDrawer: false });
  } catch (error) {
    console.warn("Public site failed:", error);
    publicError("We could not load this website.", "Please try again soon.");
  }
})();
