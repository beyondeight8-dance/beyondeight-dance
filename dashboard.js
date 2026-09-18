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
  let activeView = "overview"; let saving = false; let editingIndex = -1; let pendingDelete = -1;
  let classFilter = { search: "", status: "all" };
  let registrationFilter = { search: "", status: "all" };
  const UNBUILT_VIEWS = new Set(["instructors", "reviews", "analytics"]);

  const content = (state) => templates.buildWebsiteContent({ ...state, businessId: business.id, businessName: state.businessName || business.business_name, slug: business.slug, theme: state.theme || business.theme });
  const classes = () => (Array.isArray(draftState.classes) ? draftState.classes : []).map((item) => ({ registrationOpen: true, venmoRequired: true, ...item }));
  const dirty = () => JSON.stringify(draftState) !== JSON.stringify(publishedState);
  const toast = (message, error = false) => { document.querySelector("[data-owner-toast]")?.remove(); document.body.insertAdjacentHTML("beforeend", `<div class="owner-toast${error ? " is-error" : ""}" data-owner-toast role="status">${esc(message)}</div>`); setTimeout(() => document.querySelector("[data-owner-toast]")?.remove(), 3200); };
  const nav = () => `<nav class="owner-nav" aria-label="Dashboard navigation">${[["overview","Overview"],["classes","Classes"],["registrations","Registrations"],["website","Website"],["instructors","Instructors"],["reviews","Reviews"],["social","Social"],["analytics","Analytics"],["settings","Settings"]].map(([key,label]) => `<button type="button" class="${activeView === key ? "is-active" : ""}" data-view="${key}">${label}${UNBUILT_VIEWS.has(key) ? " <span>Soon</span>" : ""}</button>`).join("")}</nav>`;
  const row = (item, index) => { const count = registrations.filter((entry) => entry.class_id === item.id).length; return `<article class="owner-class-row${item.highlighted ? " is-highlighted" : ""}"><img src="${esc(imageUrl(item.image))}" alt="" loading="lazy"><div><strong>${esc(item.title || "Untitled class")}</strong><span>${esc([item.date,item.time].filter(Boolean).join(" • ") || "Schedule coming soon")}</span><small>${esc(item.venue || item.location || "Location coming soon")} • ${esc(item.instructor || "Instructor TBA")}</small></div><div class="owner-class-capacity"><strong>${count} / ${esc(item.capacity || "—")}</strong><span>registered</span></div><span class="owner-status ${item.published === false ? "is-draft" : ""}">${item.published === false ? "Draft" : "Published"}${item.highlighted ? " • Featured" : ""}</span><div class="owner-class-actions">${[["edit","Edit"],["duplicate","Duplicate"],["toggle",item.published === false ? "Publish" : "Unpublish"],["highlight",item.highlighted ? "Remove Highlight" : "Highlight"],["registrations","View Registrations"],["delete","Delete"]].map(([action,label]) => `<button type="button" data-class-action="${action}" data-index="${index}">${label}</button>`).join("")}</div></article>`; };
  const overview = () => { const live = (publishedState.classes || []).filter((item) => item.published !== false); const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "there"; return `<section class="owner-welcome"><div><p class="eyebrow">Owner dashboard</p><h1>Welcome back, ${esc(name)}.</h1><p>Manage your website, classes, and students from one place.</p></div><div class="owner-primary-actions"><button class="primary-button" data-view="website">Edit Website</button><a class="secondary-button" href="/${encodeURIComponent(business.slug)}" target="_blank">View Public Site</a><button class="secondary-button" data-add-class>Add Class</button></div></section>${dirty() ? `<section class="owner-draft-banner"><div><strong>Unpublished Changes</strong><span>Your draft is private until you publish.</span></div><button data-publish>Publish Changes</button></section>` : `<p class="owner-published-state">✓ Published and up to date</p>`}<section class="owner-metrics"><article><span>Live Classes</span><strong>${live.length}</strong><p>Visible on your website</p><button data-view="classes">Manage classes</button></article><article><span>Student Registrations</span><strong>${registrations.length}</strong><p>Bookings from your website</p><button data-view="registrations">View registrations</button></article><article><span>Upcoming Session</span><strong>${esc(live[0]?.date || "—")}</strong><p>${esc(live[0]?.title || "No sessions published")}</p><button data-view="classes">View class</button></article><article class="is-pro"><span>Website Views <b>PRO</b></span><strong>—</strong><p>Unlock visitor insights.</p></article></section>`; };
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
  const registrationRow = (item) => `<article><div><strong>${esc(item.student_name)}</strong><span>${esc(item.student_email)} • ${esc(item.student_phone)}</span></div><div><strong>${esc(item.class_snapshot?.title || "Class booking")}</strong><span>${esc(item.class_snapshot?.date || "")} ${esc(item.class_snapshot?.time || "")}</span></div><span class="owner-status is-draft">${esc(String(item.payment_status || "pending").replaceAll("_", " "))}</span></article>`;
  const registrationListMarkup = () => {
    if (!registrations.length) return `<div class="owner-empty-state"><strong>No registrations yet.</strong><p>Bookings appear here after a visitor completes registration.</p></div>`;
    const list = filteredRegistrations();
    if (!list.length) return `<div class="owner-empty-state"><strong>No registrations match your search.</strong><p>Try a different search or filter.</p></div>`;
    return list.map(registrationRow).join("");
  };
  const updateRegistrationList = () => { const container = root.querySelector("[data-registration-list]"); if (!container) return; container.innerHTML = registrationListMarkup(); };
  const registrationView = () => `<section class="owner-dashboard-section"><header><div><p class="eyebrow">Students</p><h1>Registrations</h1><p>Bookings from your published website.</p></div></header><div class="owner-list-filters"><input type="search" placeholder="Search registrations..." data-registration-search value="${esc(registrationFilter.search)}"><select data-registration-status-filter>${[["all","All statuses"],["payment_pending_verification","Pending verification"],["registered","Registered"]].map(([value,label]) => `<option value="${value}"${registrationFilter.status === value ? " selected" : ""}>${label}</option>`).join("")}</select></div><div class="owner-registration-list" data-registration-list>${registrationListMarkup()}</div></section>`;
  const websiteView = () => `<section class="owner-dashboard-section"><header><div><p class="eyebrow">Website</p><h1>Website content</h1><p>Edit the same shared website that visitors see. Click any section on the page to edit it.</p></div><a class="primary-button" href="/${encodeURIComponent(business.slug)}?owner=1">Open Website Editor</a></header></section>`;
  const settingsView = () => `<section class="owner-dashboard-section"><header><div><p class="eyebrow">Account</p><h1>Settings & Payments</h1><p>Configure the Venmo destination shown during booking.</p></div></header><form class="owner-settings-form" data-payment><label>Venmo Username<input name="venmoUsername" value="${esc(draftState.venmoUsername || "")}" placeholder="@yourname"></label><label>Venmo Payment URL<input name="venmoUrl" type="url" value="${esc(draftState.venmoUrl || "")}" placeholder="https://venmo.com/u/yourname"></label><small>Payments remain pending verification until you confirm them manually.</small><button class="primary-button">Save payment settings</button></form></section>`;
  const placeholder = (title) => `<section class="owner-dashboard-section"><header><div><p class="eyebrow">Website manager</p><h1>${title}</h1><p>Manage this content in your shared website editor. Click the ${title} section on the page to edit it.</p></div><a class="primary-button" href="/${encodeURIComponent(business.slug)}?owner=1">Open Website Editor</a></header></section>`;
  const comingSoon = (title, copy) => `<section class="owner-dashboard-section"><header><div><p class="eyebrow">Coming soon</p><h1>${title}</h1><p>${esc(copy)}</p></div></header><div class="owner-empty-state"><strong>${esc(title)} isn't available yet.</strong><p>We'll let you know as soon as it ships.</p></div></section>`;
  const render = () => { const views = { overview, classes: classView, registrations: registrationView, website: websiteView, settings: settingsView, instructors: () => comingSoon("Instructors", "Add co-teachers and let visitors see who's running each class."), reviews: () => comingSoon("Reviews", "Collect and showcase student reviews on your public site."), social: () => placeholder("Social"), analytics: () => comingSoon("Analytics", "Visitor traffic and booking insights for your website.") }; root.innerHTML = `<div class="owner-shell">${nav()}${views[activeView]()}</div>`; bind(); };
  const persist = async (publish, message) => { if (saving) return; saving = true; try { draftState.classes = classes(); await app.saveWebsiteDraft({ user, businessId: business.id, state: draftState }); if (publish) { await app.publishWebsiteDraft({ user, businessId: business.id, state: draftState }); publishedState = clone(draftState); } toast(message); } catch (error) { console.warn(error); toast("We couldn't save this class. Please try again.", true); } finally { saving = false; render(); } };

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
  const bind = () => { root.querySelectorAll("[data-view]").forEach((button)=>button.onclick=()=>{activeView=button.dataset.view;render();}); root.querySelectorAll("[data-add-class]").forEach((button)=>button.onclick=()=>openForm()); root.querySelectorAll("[data-class-action]").forEach((button)=>button.onclick=()=>action(button.dataset.classAction,Number(button.dataset.index))); root.querySelectorAll("[data-publish]").forEach((button)=>button.onclick=()=>persist(true,"Changes published.")); root.querySelector("[data-payment]")?.addEventListener("submit",async(event)=>{event.preventDefault();const data=new FormData(event.currentTarget);draftState.venmoUsername=String(data.get("venmoUsername")||"").replace(/^@/,"");draftState.venmoUrl=data.get("venmoUrl");await persist(false,"Payment settings saved.");}); root.querySelector("[data-class-search]")?.addEventListener("input",(event)=>{classFilter.search=event.target.value;updateClassList();}); root.querySelector("[data-class-status-filter]")?.addEventListener("change",(event)=>{classFilter.status=event.target.value;updateClassList();}); root.querySelector("[data-registration-search]")?.addEventListener("input",(event)=>{registrationFilter.search=event.target.value;updateRegistrationList();}); root.querySelector("[data-registration-status-filter]")?.addEventListener("change",(event)=>{registrationFilter.status=event.target.value;updateRegistrationList();}); };
  try { if (!app?.client) throw new Error(); user=await app.getSessionUser(); if (!user) return location.replace("/?login=1"); const result=await app.getPrimaryBusiness(user.id); business=result.business; if (!business) return location.replace("/?onboarding=1&app=1"); await app.assertBusinessOwner(user,business.id); bundle=await app.getBusinessBundle(business.id); draftState=clone(Object.keys(bundle.website?.draft_content||{}).length?bundle.website.draft_content:bundle.website?.published_content||bundle.settings?.generated_content||{}); publishedState=clone(bundle.website?.published_content||{}); draftState.classes=classes(); try{registrations=await app.listRegistrations({user,businessId:business.id});}catch(error){console.warn(error);} render(); } catch(error){console.warn(error);root.innerHTML=`<section class="route-loading"><h1>We couldn't load your dashboard.</h1><p>Please refresh or sign in again.</p><a class="primary-button" href="/?login=1">Sign in</a></section>`;}
  logout?.addEventListener("click",async()=>{await app.signOut();location.replace("/");});
})();
