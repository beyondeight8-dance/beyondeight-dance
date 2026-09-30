(async function () {
  const app = window.BeyondEight;
  const templates = window.BeyondEightWebsiteTemplates;
  const root = document.querySelector("[data-dashboard-root]");
  const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const clone = (value) => JSON.parse(JSON.stringify(value || {}));
  const uid = () => window.crypto?.randomUUID?.() || `class-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const imageUrl = (value) => /^https?:\/\//i.test(value || "") ? value : value ? `/${String(value).replace(/^\//, "")}` : "";
  // Keyed by dance style, populated once real photos exist for each category (see
  // CLASS_STYLE_IMAGES_TODO.md). Until then, classFallbackImage() returns "" and the class
  // card shows the same clean initial-letter placeholder already used on the public site
  // and booking modal, rather than a generic stock photo unrelated to the class.
  const CLASS_STYLE_IMAGES = {};
  const classFallbackImage = (style) => {
    const key = String(style || "").trim().toLowerCase();
    if (!key) return "";
    if (CLASS_STYLE_IMAGES[key]) return CLASS_STYLE_IMAGES[key];
    const match = Object.keys(CLASS_STYLE_IMAGES).find((name) => key.includes(name) || name.includes(key));
    return match ? CLASS_STYLE_IMAGES[match] : "";
  };
  const classImage = (item) => imageUrl(item.image) || classFallbackImage(item.style);
  const formatClassDate = (value = "") => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };
  // <input type="time"> always stores 24h "HH:MM", so this parse is exact - never guessed.
  const parseTimeToMinutes = (value = "") => {
    const match = String(value).match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  };
  // Duration is free text on the class form ("60 minutes", "1.5 hours", ...) - only sum the
  // units we can confidently recognize; anything unparseable returns null so callers fall
  // back to showing the raw text instead of a guessed range.
  const parseDurationMinutes = (value = "") => {
    const text = String(value).toLowerCase();
    let minutes = 0; let matched = false;
    const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b)/);
    if (hourMatch) { minutes += parseFloat(hourMatch[1]) * 60; matched = true; }
    const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m\b)/);
    if (minuteMatch) { minutes += parseFloat(minuteMatch[1]); matched = true; }
    return matched ? Math.round(minutes) : null;
  };
  const formatMinutesAsTime = (totalMinutes) => {
    const h24 = Math.floor((((totalMinutes % 1440) + 1440) % 1440) / 60);
    const m = ((totalMinutes % 60) + 60) % 60;
    const ampm = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };
  // Only shows a computed end time when both the start time and duration are confidently
  // parseable - otherwise falls back to the raw stored values rather than a guess.
  const classTimeRange = (item) => {
    const startMin = parseTimeToMinutes(item.time);
    if (startMin === null) return item.time || "";
    const start = formatMinutesAsTime(startMin);
    const durationMin = parseDurationMinutes(item.duration);
    if (durationMin === null) return start;
    return `${start} – ${formatMinutesAsTime(startMin + durationMin)}`;
  };
  let user; let business; let bundle; let draftState = {}; let publishedState = {}; let registrations = [];
  let stripeChargesEnabled = false;
  const hasPaymentMethod = () => Boolean(String(draftState.venmoUsername || "").trim() || String(draftState.venmoUrl || "").trim()) || stripeChargesEnabled;
  const initialView = new URLSearchParams(window.location.search).get("view");
  let activeView = initialView === "website" || initialView === "payments" ? initialView : "overview";
  let websiteTab = "look";
  let saving = false; let editingIndex = -1; let pendingDelete = -1;
  let classFilter = { search: "", status: "all", time: "upcoming", style: "all" };
  let registrationFilter = { search: "", status: "all", classId: "all", sort: "newest" };
  const UNBUILT_VIEWS = new Set(["instructors", "reviews", "analytics"]);

  const content = (state) => templates.buildWebsiteContent({ ...state, businessId: business.id, businessName: state.businessName || business.business_name, slug: business.slug, theme: state.theme || business.theme });
  const classes = () => (Array.isArray(draftState.classes) ? draftState.classes : []).map((item) => ({ registrationOpen: true, venmoRequired: true, ...item }));
  const dirty = () => JSON.stringify(draftState) !== JSON.stringify(publishedState);
  const toast = (message, error = false) => { document.querySelector("[data-owner-toast]")?.remove(); document.body.insertAdjacentHTML("beforeend", `<div class="owner-toast${error ? " is-error" : ""}" data-owner-toast role="status">${esc(message)}</div>`); setTimeout(() => document.querySelector("[data-owner-toast]")?.remove(), 3200); };
  // Minimal line icons, same stroke-based style already used on the public site (booking
  // modal fact rows, class card facts) - kept in one place here since dashboard.js has no
  // shared module with those files.
  const ICONS = {
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"></path><path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9"></path></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"></rect><path d="M8 3v4M16 3v4M3.5 9.5h17"></path></svg>`,
    list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"></rect><path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z"></path><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4"></path></svg>`,
    card: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2.2"></rect><path d="M3 10.5h18"></path><path d="M7 15h4"></path></svg>`,
    globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"></circle><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.4 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.4-3.6-8.5S9.6 5.9 12 3.5Z"></path></svg>`,
    person: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.3" r="3.6"></circle><path d="M5 20c0-3.6 3.1-6.3 7-6.3s7 2.7 7 6.3"></path></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m12 4 2.4 5.1 5.6.6-4.2 3.8 1.2 5.5L12 16.2l-5 2.8 1.2-5.5-4.2-3.8 5.6-.6L12 4Z"></path></svg>`,
    chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V11M10 20V5M16 20v-8"></path><path d="M3 20h18"></path></svg>`,
    people: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8.5" r="3"></circle><path d="M3.5 19c0-3 2.5-5.3 5.5-5.3s5.5 2.3 5.5 5.3"></path><circle cx="17" cy="9" r="2.3"></circle><path d="M15.3 13.4c2.3.3 4.2 2.2 4.2 4.7"></path></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="6.5" y="3" width="11" height="18" rx="2.2"></rect><path d="M10.5 18h3"></path></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5 9 17l10.5-11"></path></svg>`,
    bank: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9.5 12 4l8.5 5.5"></path><path d="M4.5 9.5h15v1.5h-15z"></path><path d="M6 11v7.5M10 11v7.5M14 11v7.5M18 11v7.5"></path><path d="M3.5 20.5h17"></path></svg>`,
    lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.2"></rect><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"></path></svg>`,
    pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"></path><circle cx="12" cy="9.5" r="2.4"></circle></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg>`,
    dots: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"></circle><circle cx="12" cy="12" r="1.8"></circle><circle cx="12" cy="19" r="1.8"></circle></svg>`,
    camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2.5"></rect><path d="M8 7l1.4-2.4h5.2L16 7"></path><circle cx="12" cy="13.5" r="3.4"></circle></svg>`,
    dollar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"></path><path d="M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3c0 4 9 2.5 9 6.5 0 1.7-2 3-4.5 3s-4.5-1.3-4.5-3"></path></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m20 20-4.35-4.35"></path></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v11"></path><path d="m7.5 10.5 4.5 4.5 4.5-4.5"></path><path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2"></path></svg>`
  };
  const navIcon = (key) => `<span class="owner-nav-icon" aria-hidden="true">${ICONS[key]}</span>`;
  const factIcon = (key) => `<span class="owner-class-fact-icon" aria-hidden="true">${ICONS[key]}</span>`;
  const nav = () => {
    const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Owner";
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    const links = [["overview","Overview","home"],["classes","Classes","calendar"],["registrations","Registrations","list"],["payments","Payments","card"],["website","Website","globe"],["instructors","Instructors","person"],["reviews","Reviews","star"],["analytics","Analytics","chart"]];
    return `<nav class="owner-nav" aria-label="Dashboard navigation"><a class="owner-nav-brand" href="/dashboard/" aria-label="BeyondEight dashboard"><span class="brand-mark"><img src="/assets/Logo.png?v=20260928-brand-consistency" alt=""></span><span class="brand-name">Beyond<span>Eight</span></span></a><div class="owner-nav-links">${links.map(([key,label,icon]) => `<button type="button" class="${activeView === key ? "is-active" : ""}" data-view="${key}">${navIcon(icon)}<span>${label}</span>${UNBUILT_VIEWS.has(key) ? " <small>Soon</small>" : ""}</button>`).join("")}</div><div class="owner-nav-footer"><a href="/${encodeURIComponent(business.slug)}" target="_blank">View My Website <span aria-hidden="true">↗</span></a><div class="owner-profile"><b aria-hidden="true">${esc(initials)}</b><span><strong>${esc(name)}</strong><small>Owner</small></span></div><button type="button" data-dashboard-logout>Log out</button></div></nav>`;
  };
  const row = (item, index) => { const count = registrations.filter((entry) => entry.class_id === item.id).length; const img = classImage(item); const initial = String(item.title || "Class").trim().charAt(0).toUpperCase() || "C"; const media = img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<div class="owner-class-media-empty" aria-hidden="true"><span>${esc(initial)}</span></div>`; const facts = [item.date ? `<span>${factIcon("calendar")}${esc(formatClassDate(item.date))}</span>` : "", item.time ? `<span>${factIcon("clock")}${esc(classTimeRange(item))}</span>` : "", (item.venue || item.location) ? `<span>${factIcon("pin")}${esc(item.venue || item.location)}</span>` : ""].filter(Boolean).join(""); const tags = [item.format || "In Person", item.duration].filter(Boolean).map((value) => `<span>${esc(value)}</span>`).join(""); const isDraft = item.published === false; const primaryAction = isDraft ? `<button type="button" class="owner-class-primary is-publish" data-class-action="toggle" data-index="${index}">Publish</button>` : `<button type="button" class="owner-class-primary" data-class-action="registrations" data-index="${index}">View Registrations</button>`; const menuItems = [["edit","Edit"],["duplicate","Duplicate"],["toggle",isDraft ? "Publish" : "Unpublish"],["highlight",item.highlighted ? "Remove Highlight" : "Highlight"],["delete","Delete"]]; return `<article class="owner-class-card${item.highlighted ? " is-highlighted" : ""}"><div class="owner-class-media">${media}</div><div class="owner-class-body"><strong>${esc(item.title || "Untitled class")}</strong><div class="owner-class-facts">${facts || `<span>Schedule coming soon</span>`}</div>${tags ? `<div class="owner-class-tags">${tags}</div>` : ""}</div><div class="owner-class-count"><strong>${count} / ${esc(item.capacity || "—")}</strong><span>registered</span></div><span class="owner-status ${isDraft ? "is-draft" : ""}">${isDraft ? "Draft" : "Published"}${item.highlighted ? " · Featured" : ""}</span>${primaryAction}<details class="owner-class-menu" name="class-menu"><summary aria-label="More actions">${ICONS.dots}</summary><div>${menuItems.map(([action,label]) => `<button type="button"${action === "delete" ? ' class="is-danger"' : ""} data-class-action="${action}" data-index="${index}">${label}</button>`).join("")}</div></details></article>`; };
  const formatDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return value || "";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const activityStatusLabel = (status) => ({ paid: "Paid", payment_pending_verification: "Pending", registered: "Registered" }[status] || "Registered");
  const statCard = (icon, value, label, sublabel, attention = false) => `<div class="owner-stat-card${attention ? " is-attention" : ""}"><span class="owner-stat-icon" aria-hidden="true">${ICONS[icon]}</span><strong>${value}</strong><span>${label}</span><small>${sublabel}</small></div>`;
  const overview = () => {
    const live = (publishedState.classes || []).filter((item) => item.published !== false);
    const today = new Date().toISOString().slice(0, 10);
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const upcoming30 = live.filter((item) => item.date && item.date >= today && item.date <= in30Days);
    const pendingCount = registrations.filter((item) => (item.payment_status || "payment_pending_verification") === "payment_pending_verification").length;
    const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "there";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const upcoming = live.filter((item) => !item.date || item.date >= today).sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))).slice(0, 4);
    const activity = registrations.slice(0, 3);
    const upcomingMarkup = upcoming.length ? upcoming.map((item) => { const count = registrations.filter((entry) => entry.class_id === item.id).length; return `<article class="owner-overview-class"><img src="${esc(imageUrl(item.image))}" alt=""><div><strong>${esc(item.title || "Untitled class")}</strong><span>${esc([item.date, item.time].filter(Boolean).join(" · ") || "Schedule coming soon")}</span><small>${esc(item.venue || item.location || "Location coming soon")}</small></div><div><strong>${count}/${esc(item.capacity || "—")}</strong><span>registered</span></div><button type="button" data-view="classes">View →</button></article>`; }).join("") : `<div class="owner-empty-state is-centered"><span class="owner-empty-state-icon" aria-hidden="true">${ICONS.calendar}</span><strong>No upcoming classes yet.</strong><p>Your next published class will appear here.</p><button class="primary-button" data-add-class>Create a Class</button></div>`;
    const statCardsMarkup = statCard("people", live.length, "Live Classes", "on your website")
      + statCard("person", registrations.length, "Total Registrations", "all time")
      + statCard("calendar", upcoming30.length, "Upcoming Classes", "next 30 days")
      + statCard("card", pendingCount, "Pending Payments", "awaiting confirmation", pendingCount > 0);
    const activityMarkup = activity.length ? activity.map((item) => {
      const status = item.payment_status || "registered";
      const initial = String(item.student_name || "A").trim().charAt(0).toUpperCase() || "A";
      return `<article><span class="owner-activity-mark" aria-hidden="true">${esc(initial)}</span><p><strong>${esc(item.student_name || "A student")}</strong> registered for ${esc(item.class_snapshot?.title || "a class")}</p><span class="owner-activity-status${status === "payment_pending_verification" ? " is-pending" : ""}">${activityStatusLabel(status)}</span><small>${esc(formatDate(item.class_snapshot?.date))}</small></article>`;
    }).join("") : `<p class="owner-empty-compact">No recent activity. New registrations will appear here.</p>`;
    const siteContent = content(draftState);
    const siteMarkup = `<section class="owner-site-status"><div class="owner-site-head"><h2>Your Website</h2><a href="/${encodeURIComponent(business.slug)}" target="_blank">View Live <span aria-hidden="true">↗</span></a></div><div class="owner-site-media"><img src="${esc(imageUrl(draftState.heroImage || "assets/starter-hero-dance.jpg"))}" alt=""><p class="owner-site-tagline">${esc(siteContent.headline)}</p></div><div class="owner-site-body"><span class="owner-site-badge${dirty() ? " is-draft" : ""}">${dirty() ? "Draft" : "Live"}</span><a class="owner-site-url" href="/${encodeURIComponent(business.slug)}" target="_blank">beyond8dance.com/${esc(business.slug)}</a><button type="button" class="owner-site-edit" data-view="website"><span aria-hidden="true">✎</span> Edit Website <span aria-hidden="true">→</span></button></div></section>`;
    const quickActionsMarkup = `<section class="owner-quick-panel"><h2>Quick Actions</h2><button type="button" data-add-class><span aria-hidden="true">${ICONS.calendar}</span><strong>Create a Class</strong><span aria-hidden="true">›</span></button><button type="button" data-view="registrations"><span aria-hidden="true">${ICONS.people}</span><strong>Manage Registrations</strong><span aria-hidden="true">›</span></button><button type="button" data-view="analytics"><span aria-hidden="true">${ICONS.chart}</span><strong>View Analytics</strong><span aria-hidden="true">›</span></button></section>`;
    return `<section class="owner-welcome"><div><p class="eyebrow">Dashboard</p><h1>${greeting}, ${esc(name)}!</h1><p>Here's what's happening with your dance business.</p></div><button class="primary-button owner-create-class" data-add-class><span aria-hidden="true">+</span> Create New Class</button></section>${dirty() ? `<section class="owner-draft-banner"><div><strong>Unpublished Changes</strong><span>Your draft is private until you publish.</span></div><button data-publish>Publish Changes</button></section>` : `<p class="owner-published-state">Published and up to date</p>`}<div class="owner-stat-cards">${statCardsMarkup}</div><div class="owner-overview-grid"><div class="owner-overview-main"><section class="owner-overview-section owner-overview-primary"><header><h2>Upcoming Classes</h2><button type="button" data-view="classes">View All →</button></header><div>${upcomingMarkup}</div></section><section class="owner-overview-section owner-activity"><header><h2>Recent Activity</h2><button type="button" data-view="registrations">View All →</button></header><div>${activityMarkup}</div></section></div><aside class="owner-overview-rail">${siteMarkup}${quickActionsMarkup}</aside></div>`;
  };
  const classStyleOptions = () => { const seen = new Set(); classes().forEach((item) => { const style = String(item.style || "").trim(); if (style) seen.add(style); }); return Array.from(seen).sort((a, b) => a.localeCompare(b)); };
  const filteredClasses = () => { const today = new Date().toISOString().slice(0, 10); return classes().map((item, index) => ({ item, index })).filter(({ item }) => {
    if (classFilter.status === "published" && item.published === false) return false;
    if (classFilter.status === "draft" && item.published !== false) return false;
    if (classFilter.time === "upcoming" && item.date && item.date < today) return false;
    if (classFilter.time === "past" && item.date && item.date >= today) return false;
    if (classFilter.style !== "all" && String(item.style || "") !== classFilter.style) return false;
    if (!classFilter.search) return true;
    const query = classFilter.search.toLowerCase();
    return [item.title, item.instructor, item.style, item.venue || item.location].some((value) => String(value || "").toLowerCase().includes(query));
  }); };
  const classListMarkup = () => {
    if (!classes().length) return `<div class="owner-empty-state"><strong>Add your first class.</strong><p>Publish when you are ready for bookings.</p><button class="primary-button" data-add-class>Add a Class</button></div>`;
    const list = filteredClasses();
    if (!list.length) return `<div class="owner-empty-state"><strong>No classes match your search.</strong><p>Try a different search or filter.</p></div>`;
    return list.map(({ item, index }) => row(item, index)).join("");
  };
  const bindClassList = () => { const container = root.querySelector("[data-class-list]"); if (!container) return; container.querySelectorAll("[data-add-class]").forEach((button) => button.onclick = () => openForm()); container.querySelectorAll("[data-class-action]").forEach((button) => button.onclick = () => action(button.dataset.classAction, Number(button.dataset.index))); };
  const updateClassList = () => { const container = root.querySelector("[data-class-list]"); if (!container) return; container.innerHTML = classListMarkup(); bindClassList(); };
  const classView = () => { const styleOptions = classStyleOptions(); return `<section class="owner-dashboard-section"><header><div><p class="eyebrow">Schedule</p><h1>Classes</h1><p>Create, publish, and manage classes without leaving your dashboard.</p></div><div class="owner-header-actions"><button class="secondary-button" type="button" data-import-instagram><span aria-hidden="true">${ICONS.camera}</span> Import from Instagram</button><button class="primary-button" type="button" data-add-class>+ Add Class</button></div></header><div class="owner-list-filters"><input type="search" placeholder="Search classes..." data-class-search value="${esc(classFilter.search)}"><select data-class-status-filter>${[["all","All statuses"],["published","Published"],["draft","Draft"]].map(([value,label]) => `<option value="${value}"${classFilter.status === value ? " selected" : ""}>${label}</option>`).join("")}</select><select data-class-time-filter>${[["upcoming","Upcoming"],["past","Past"],["all","All dates"]].map(([value,label]) => `<option value="${value}"${classFilter.time === value ? " selected" : ""}>${label}</option>`).join("")}</select><select data-class-style-filter>${[["all","Class type"], ...styleOptions.map((style) => [style, style])].map(([value,label]) => `<option value="${esc(value)}"${classFilter.style === value ? " selected" : ""}>${esc(label)}</option>`).join("")}</select></div><div class="owner-class-list" data-class-list>${classListMarkup()}</div></section>`; };
  // Distinct classes actually present in the registrations list, never a hardcoded taxonomy -
  // mirrors classStyleOptions()'s approach for the Classes page's own type filter.
  const registrationClassOptions = () => { const seen = new Map(); registrations.forEach((item) => { const title = item.class_snapshot?.title; if (item.class_id && title && !seen.has(item.class_id)) seen.set(item.class_id, title); }); return Array.from(seen, ([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title)); };
  const filteredRegistrations = () => { const list = registrations.filter((item) => {
    if (registrationFilter.status !== "all" && item.payment_status !== registrationFilter.status) return false;
    if (registrationFilter.classId !== "all" && item.class_id !== registrationFilter.classId) return false;
    if (!registrationFilter.search) return true;
    const query = registrationFilter.search.toLowerCase();
    return [item.student_name, item.student_email, item.class_snapshot?.title].some((value) => String(value || "").toLowerCase().includes(query));
  }); return list.slice().sort((a, b) => { const da = new Date(a.registered_at || 0).getTime(); const db = new Date(b.registered_at || 0).getTime(); return registrationFilter.sort === "oldest" ? da - db : db - da; }); };
  const registrationRow = (item) => {
    const status = item.payment_status || "payment_pending_verification";
    const isPending = status === "payment_pending_verification";
    // A Stripe payment is confirmed automatically by the webhook, not by the owner - offering
    // "Mark as Pending" on it (the manual-Venmo-verification toggle) reads as if the owner can
    // revert a real, already-settled card charge, which isn't true and looks unfinished.
    const isStripePaid = status === "paid" && item.payment_method === "stripe";
    const actionButton = isPending
      ? `<button type="button" data-registration-confirm="${esc(item.id)}">Mark as Paid</button>`
      : status === "paid" && !isStripePaid
        ? `<button type="button" data-registration-pending="${esc(item.id)}">Mark as Pending</button>`
        : "";
    const statusLabel = { paid: "Paid", payment_pending_verification: "Pending", registered: "Registered" }[status] || "Registered";
    const statusClass = status === "paid" ? "is-paid" : isPending ? "is-pending" : "is-registered";
    const initial = String(item.student_name || "?").trim().charAt(0).toUpperCase() || "?";
    // The live class (if it still exists) supplies a current photo/format for a nicer row -
    // never claimed as historical fact, since only class_snapshot reflects what was true when
    // the student actually booked.
    const liveClass = classes().find((entry) => entry.id === item.class_id);
    const classImg = liveClass ? classImage(liveClass) : "";
    const classInitial = String(item.class_snapshot?.title || "Class").trim().charAt(0).toUpperCase() || "C";
    const classMedia = classImg ? `<img src="${esc(classImg)}" alt="" loading="lazy">` : `<div class="owner-reg-class-media-empty" aria-hidden="true"><span>${esc(classInitial)}</span></div>`;
    const classMeta = [item.class_snapshot?.location, liveClass?.format].filter(Boolean).join(" • ");
    const dateTime = [item.class_snapshot?.date ? formatClassDate(item.class_snapshot.date) : "", item.class_snapshot?.time ? classTimeRange({ time: item.class_snapshot.time, duration: item.class_snapshot.duration }) : ""].filter(Boolean);
    const hasAmount = item.class_snapshot?.price !== undefined && item.class_snapshot?.price !== null && item.class_snapshot?.price !== "";
    const amount = hasAmount ? `$${Number(item.class_snapshot.price).toFixed(2)}` : "—";
    const menuBody = actionButton || `<span class="owner-reg-menu-empty">No actions available</span>`;
    return `<article class="owner-reg-row"><div class="owner-reg-student"><span class="owner-reg-avatar" aria-hidden="true">${esc(initial)}</span><div><strong>${esc(item.student_name || "Student")}</strong><span>${esc(item.student_email || "")}</span></div></div><div class="owner-reg-class"><div class="owner-reg-class-media">${classMedia}</div><div><strong>${esc(item.class_snapshot?.title || "Class booking")}</strong>${classMeta ? `<span>${esc(classMeta)}</span>` : ""}</div></div><div class="owner-reg-datetime">${dateTime.map((value) => `<span>${esc(value)}</span>`).join("") || "<span>—</span>"}</div><span class="owner-reg-status ${statusClass}"><i aria-hidden="true"></i>${esc(statusLabel)}</span><div class="owner-reg-amount">${esc(amount)}</div><details class="owner-class-menu" name="reg-menu"><summary aria-label="More actions">${ICONS.dots}</summary><div>${menuBody}</div></details></article>`;
  };
  const registrationListMarkup = () => {
    if (!registrations.length) return `<div class="owner-empty-state"><strong>No registrations yet.</strong><p>Bookings appear here after a visitor completes registration.</p></div>`;
    const list = filteredRegistrations();
    if (!list.length) return `<div class="owner-empty-state"><strong>No registrations match your filters.</strong><p>Try a different search or filter.</p></div>`;
    const head = `<div class="owner-reg-head"><span>Student</span><span>Class</span><span>Date &amp; Time</span><span>Status</span><span>Amount</span><span>Actions</span></div>`;
    return head + list.map(registrationRow).join("");
  };
  const csvField = (value) => { const text = String(value ?? ""); return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; };
  const exportRegistrations = () => {
    const list = filteredRegistrations();
    const headers = ["Student Name", "Email", "Phone", "Class", "Date", "Time", "Status", "Amount"];
    const rows = list.map((item) => [
      item.student_name || "",
      item.student_email || "",
      item.student_phone || "",
      item.class_snapshot?.title || "",
      item.class_snapshot?.date || "",
      item.class_snapshot?.time || "",
      (item.payment_status || "payment_pending_verification").replaceAll("_", " "),
      item.class_snapshot?.price !== undefined && item.class_snapshot?.price !== null && item.class_snapshot?.price !== "" ? Number(item.class_snapshot.price).toFixed(2) : ""
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvField).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
  const registrationView = () => {
    const now = new Date();
    const monthLabel = now.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const thisMonthCount = registrations.filter((item) => { const date = item.registered_at ? new Date(item.registered_at) : null; return date && !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(); }).length;
    const uniqueStudents = new Set(registrations.map((item) => (item.student_email || item.student_name || "").toLowerCase().trim()).filter(Boolean)).size;
    const totalRevenue = registrations.filter((item) => item.payment_status === "paid").reduce((sum, item) => sum + (Number(item.class_snapshot?.price) || 0), 0);
    const statCardsMarkup = statCard("people", registrations.length, "Total Registrations", "all time")
      + statCard("calendar", thisMonthCount, "This Month", monthLabel)
      + statCard("person", uniqueStudents, "Unique Students", "all time")
      + statCard("dollar", `$${totalRevenue.toFixed(2)}`, "Total Revenue", "all time");
    const classOptions = registrationClassOptions();
    return `<section class="owner-dashboard-section"><header><div><p class="eyebrow">Students</p><h1>Registrations</h1><p>Bookings from your published website.</p></div><div class="owner-header-actions"><button class="primary-button" type="button" data-export-registrations><span aria-hidden="true">${ICONS.download}</span> Export Registrations</button></div></header><div class="owner-stat-cards">${statCardsMarkup}</div><div class="owner-list-filters"><label class="owner-search-field"><span aria-hidden="true">${ICONS.search}</span><input type="search" placeholder="Search by name, email or class..." data-registration-search value="${esc(registrationFilter.search)}"></label><select data-registration-class-filter>${[["all","All classes"], ...classOptions.map((option) => [option.id, option.title])].map(([value,label]) => `<option value="${esc(value)}"${registrationFilter.classId === value ? " selected" : ""}>${esc(label)}</option>`).join("")}</select><select data-registration-status-filter>${[["all","All statuses"],["payment_pending_verification","Pending verification"],["paid","Paid"],["registered","Registered"]].map(([value,label]) => `<option value="${value}"${registrationFilter.status === value ? " selected" : ""}>${label}</option>`).join("")}</select><select data-registration-sort>${[["newest","Newest first"],["oldest","Oldest first"]].map(([value,label]) => `<option value="${value}"${registrationFilter.sort === value ? " selected" : ""}>${label}</option>`).join("")}</select></div><div class="owner-registration-list" data-registration-list>${registrationListMarkup()}</div></section>`;
  };
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
  const stripeControls = () => `<section class="owner-payment-status" data-owner-stripe>
    <div class="owner-payment-status-head">
      <div><strong>Card payments (Stripe)</strong> <span class="owner-payment-badge" data-stripe-badge>Checking…</span></div>
      <button type="button" data-stripe-connect>Connect Stripe</button>
    </div>
    <p data-stripe-help>Connect Stripe to accept card payments directly to your bank account.</p>
    <div class="owner-payment-status-grid" data-stripe-grid hidden>
      <div>
        <small>Account Status</small>
        <div class="owner-payment-status-row"><span class="owner-payment-status-icon is-good" aria-hidden="true">${ICONS.check}</span><strong data-stripe-account-label>Ready to accept payments</strong></div>
        <p data-stripe-account-detail>Your account is connected and active.</p>
      </div>
      <div>
        <small>Payouts</small>
        <div class="owner-payment-status-row"><span class="owner-payment-status-icon" aria-hidden="true">${ICONS.bank}</span><strong>Go directly to your bank account</strong></div>
        <p>Managed securely by Stripe.</p>
      </div>
      <div class="owner-payment-status-actions">
        <small>Actions</small>
        <button type="button" data-stripe-refresh hidden>Refresh status</button>
        <button type="button" data-stripe-disconnect hidden>Disconnect</button>
      </div>
    </div>
    <small data-stripe-message></small>
  </section>`;
  const venmoControls = () => `<section class="owner-payment-status">
    <div class="owner-payment-status-head"><strong>Venmo</strong></div>
    <p>Students pay you directly through Venmo and self-report the payment - you'll confirm each one manually in Registrations.</p>
    <form class="owner-payment-venmo-form" data-payment>
      <input type="hidden" name="paymentMethod" value="venmo">
      <label>Venmo Username<input name="venmoUsername" value="${esc(draftState.venmoUsername || "")}" placeholder="@yourname"></label>
      <label>Venmo Payment URL<input name="venmoUrl" type="url" value="${esc(draftState.venmoUrl || "")}" placeholder="https://venmo.com/u/yourname"></label>
      <button class="primary-button">Save Venmo details</button>
    </form>
  </section>`;
  const paymentOption = (value, icon, badge, title, description, brands, selected) => `<label class="owner-payment-option${selected ? " is-selected" : ""}"><input type="radio" name="paymentMethodChoice" value="${value}"${selected ? " checked" : ""} data-payment-method-radio>${badge ? `<span class="owner-payment-option-badge">${badge}</span>` : ""}<span class="owner-payment-option-icon" aria-hidden="true">${ICONS[icon]}</span><strong>${title}</strong><p>${description}</p><div class="owner-payment-option-brands">${brands}</div></label>`;
  const paymentsView = () => {
    const method = draftState.paymentMethod === "stripe" ? "stripe" : "venmo";
    const options = paymentOption("stripe", "card", "Recommended", "Card payments (Stripe)", "Accept credit and debit cards securely. Payments go directly to your bank account via Stripe.", `<span>Visa</span><span>Mastercard</span><span>Amex</span><span>Discover</span>`, method === "stripe")
      + paymentOption("venmo", "phone", "", "Venmo", "Let students pay you directly via Venmo. Great for smaller classes and in-person workshops.", `<span class="owner-payment-venmo-word">Venmo</span>`, method === "venmo");
    return `<section class="owner-dashboard-section owner-payments"><header><div><p class="eyebrow">Payments</p><h1>Get paid for your classes</h1><p>Set up at least one payment method before you can add classes. You can always update this later.</p></div></header>
      <div class="owner-payment-picker">
        <h2>Choose a payment method</h2>
        <p>Select how you'd like to accept payments from your students.</p>
        <div class="owner-payment-options">${options}</div>
      </div>
      <div data-payment-panel="stripe"${method === "venmo" ? " hidden" : ""}>${stripeControls()}</div>
      <div data-payment-panel="venmo"${method === "stripe" ? " hidden" : ""}>${venmoControls()}</div>
      <div class="owner-payment-security"><span aria-hidden="true">${ICONS.lock}</span><div><strong>Your payments are secure</strong><p>We use Stripe, a trusted and secure payment processor. We never store your bank or card details on BeyondEight.</p></div></div>
    </section>`;
  };
  const comingSoon = (title, copy) => `<section class="owner-dashboard-section"><header><div><p class="eyebrow">Coming soon</p><h1>${title}</h1><p>${esc(copy)}</p></div></header><div class="owner-empty-state"><strong>${esc(title)} isn't available yet.</strong><p>We'll let you know as soon as it ships.</p></div></section>`;
  const render = () => { const views = { overview, classes: classView, registrations: registrationView, website: websiteView, payments: paymentsView, instructors: () => comingSoon("Instructors", "Add co-teachers and let visitors see who's running each class."), reviews: () => comingSoon("Reviews", "Collect and showcase student reviews on your public site."), analytics: () => comingSoon("Analytics", "Visitor traffic and booking insights for your website.") }; root.innerHTML = `<div class="owner-shell">${nav()}${views[activeView]()}</div>`; bind(); };
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
  const bindStripeSettings = (scope) => {
    const card = scope.querySelector("[data-owner-stripe]");
    if (!card) return;
    const badge = card.querySelector("[data-stripe-badge]");
    const help = card.querySelector("[data-stripe-help]");
    const connect = card.querySelector("[data-stripe-connect]");
    const refresh = card.querySelector("[data-stripe-refresh]");
    const disconnect = card.querySelector("[data-stripe-disconnect]");
    const message = card.querySelector("[data-stripe-message]");
    const grid = card.querySelector("[data-stripe-grid]");
    const accountLabel = card.querySelector("[data-stripe-account-label]");
    const accountDetail = card.querySelector("[data-stripe-account-detail]");
    const showStatus = (result = {}) => {
      const active = Boolean(result.connected && result.chargesEnabled);
      stripeChargesEnabled = active;
      badge.textContent = active ? "Connected" : result.connected ? "Action needed" : "Not connected";
      badge.className = `owner-payment-badge${active ? " is-connected" : result.connected ? " is-pending" : ""}`;
      help.textContent = active ? "You're all set! You can accept payments through Stripe." : result.connected ? "Finish onboarding in Stripe to start accepting card payments." : "Connect a Stripe account to accept card payments.";
      connect.innerHTML = result.connected ? (active ? `Manage in Stripe <span aria-hidden="true">↗</span>` : "Continue Setup") : "Connect Stripe";
      grid.hidden = !result.connected;
      accountLabel.textContent = active ? "Ready to accept payments" : "Action needed";
      accountDetail.textContent = active ? "Your account is connected and active." : "Finish onboarding in Stripe to start accepting payments.";
      refresh.hidden = !result.connected; disconnect.hidden = !result.connected;
    };
    const requestStatus = () => ownerApiRequest(`/api/stripe/manage?businessId=${encodeURIComponent(business.id)}`).then(showStatus).catch((error) => { statusNode.textContent = "Connection unavailable"; message.textContent = error.message; });
    connect.addEventListener("click", async () => { try { message.textContent = "Opening Stripe..."; const result = await ownerApiRequest("/api/stripe/connect", { method: "POST", body: JSON.stringify({ businessId: business.id }) }); window.location.assign(result.authorizationUrl); } catch (error) { message.textContent = error.message; } });
    refresh.addEventListener("click", async () => { try { message.textContent = "Refreshing..."; showStatus(await ownerApiRequest("/api/stripe/manage", { method: "POST", body: JSON.stringify({ businessId: business.id, action: "refresh" }) })); message.textContent = "Status refreshed."; } catch (error) { message.textContent = error.message; } });
    disconnect.addEventListener("click", async () => { if (!window.confirm("Disconnect Stripe? Card payments will no longer be offered to students.")) return; try { showStatus(await ownerApiRequest("/api/stripe/manage", { method: "POST", body: JSON.stringify({ businessId: business.id, action: "disconnect" }) })); message.textContent = "Stripe disconnected."; } catch (error) { message.textContent = error.message; } });
    requestStatus();
  };

  const formHtml = (item = {}) =>`<form class="owner-class-form" data-class-form><header><div><p class="eyebrow">${editingIndex < 0 ? "New class" : "Edit class"}</p><h2>${editingIndex < 0 ? "Add Class" : esc(item.title)}</h2></div><button type="button" data-close aria-label="Close">×</button></header><div class="owner-form-grid"><fieldset><legend>Class details</legend><label>Class Name<input required name="title" value="${esc(item.title || "")}"></label><label>Dance Style<input required name="style" value="${esc(item.style || "")}"></label><label>Short Description<textarea required name="description">${esc(item.description || "")}</textarea></label><label class="owner-image-field">Class Image<img src="${esc(imageUrl(item.image))}" data-image-preview alt="Preview"><input type="file" accept="image/jpeg,image/png,image/webp" data-image><small data-upload>JPG, PNG, or WEBP up to 5MB</small></label><input type="hidden" name="image" value="${esc(item.image || "")}"></fieldset><fieldset><legend>Schedule</legend><label>Date<input required type="date" name="date" value="${esc(item.date || "")}"></label><label>Start Time<input required type="time" name="time" value="${esc(item.time || "")}"></label><label>Duration<input required name="duration" value="${esc(item.duration || "60 minutes")}"></label><legend>Location</legend><label>Format<select name="format"><option${item.format !== "Online" ? " selected" : ""}>In Person</option><option${item.format === "Online" ? " selected" : ""}>Online</option></select></label><label>Venue Name<input name="venue" value="${esc(item.venue || item.location || "")}"></label><label>Address<input name="address" value="${esc(item.address || "")}"></label><label>City<input name="city" value="${esc(item.city || "")}"></label><label>Online Link<input type="url" name="onlineLink" value="${esc(item.onlineLink || "")}"></label></fieldset><fieldset><legend>Class info</legend><label>Level<select name="level">${["Beginner","Intermediate","Advanced","Open Level"].map((value) => `<option${String(item.level || "Open Level").toLowerCase() === value.toLowerCase() ? " selected" : ""}>${value}</option>`).join("")}</select></label><label>Instructor<input name="instructor" value="${esc(item.instructor || draftState.instructorName || "")}"></label><label>Price<input required name="price" value="${esc(item.price ?? "$25")}"></label><label>Capacity<input required type="number" min="1" name="capacity" value="${esc(item.capacity || "20")}"></label><legend>Booking</legend><label class="owner-check"><input type="checkbox" name="registrationOpen"${item.registrationOpen !== false ? " checked" : ""}> Registration open</label><label class="owner-check"><input type="checkbox" name="venmoRequired"${item.venmoRequired !== false ? " checked" : ""}> Payment required <small>(uses whichever method is set in Payments)</small></label><label>Booking Notes<textarea name="bookingNotes">${esc(item.bookingNotes || "")}</textarea></label></fieldset></div><footer><button type="button" data-close>Cancel</button><button type="submit" value="draft">Save Draft</button><button class="primary-button" type="submit" value="publish">Publish Class</button></footer></form>`;
  const openForm = (index = -1, prefill = {}) => { if (index < 0 && !hasPaymentMethod()) { toast("Set up Venmo or Stripe before adding classes.", true); activeView = "payments"; return render(); } editingIndex = index; const item = index >= 0 ? classes()[index] : prefill; document.body.insertAdjacentHTML("beforeend", `<div class="owner-modal" data-modal role="dialog" aria-modal="true"><div>${formHtml(item)}</div></div>`); const modal = document.querySelector("[data-modal]"); modal.querySelectorAll("[data-close]").forEach((button) => button.onclick = closeModal); modal.querySelector("[data-image]").onchange = uploadImage; modal.querySelector("form").onsubmit = saveClass; modal.querySelector("input")?.focus(); };
  const openInstagramPicker = async () => {
    document.body.insertAdjacentHTML("beforeend", `<div class="owner-modal" data-instagram-picker role="dialog" aria-modal="true"><div><header><div><p class="eyebrow">Import</p><h2>Start a class from a recent post</h2></div><button type="button" data-close aria-label="Close">×</button></header><div class="owner-instagram-picker-body" data-instagram-picker-body><p class="owner-empty-compact">Loading your recent posts…</p></div></div></div>`);
    const modal = document.querySelector("[data-instagram-picker]");
    const close = () => modal.remove();
    modal.querySelectorAll("[data-close]").forEach((button) => button.onclick = close);
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    const body = modal.querySelector("[data-instagram-picker-body]");
    try {
      const result = await fetch(`/api/instagram/feed?businessId=${encodeURIComponent(business.id)}`).then((response) => response.json());
      const items = result.items || [];
      if (!items.length) {
        body.innerHTML = `<p class="owner-empty-compact">No recent Instagram posts found. Connect Instagram from the Website tab's Socials section, or post something new and check back in a bit.</p>`;
        return;
      }
      body.innerHTML = `<div class="owner-instagram-picker-grid">${items.map((item, itemIndex) => { const caption = String(item.caption || "").trim(); const preview = caption.slice(0, 90); return `<button type="button" class="owner-instagram-picker-item" data-picker-index="${itemIndex}"><img src="${esc(item.thumbnail_url || item.media_url || "")}" alt=""><span>${esc(preview) || "No caption"}${caption.length > 90 ? "…" : ""}</span></button>`; }).join("")}</div>`;
      body.querySelectorAll("[data-picker-index]").forEach((button) => button.onclick = () => {
        const item = items[Number(button.dataset.pickerIndex)];
        close();
        openForm(-1, { description: String(item.caption || "").trim().slice(0, 500), image: item.media_url || item.thumbnail_url || "" });
      });
    } catch (error) {
      body.innerHTML = `<p class="owner-empty-compact">Couldn't load Instagram posts. Please try again.</p>`;
    }
  };
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
  const bind = () => { root.querySelectorAll("[data-view]").forEach((button)=>button.onclick=()=>{activeView=button.dataset.view;render();}); root.querySelectorAll("[data-add-class]").forEach((button)=>button.onclick=()=>openForm()); root.querySelector("[data-import-instagram]")?.addEventListener("click",()=>{ if(!hasPaymentMethod()){toast("Set up Venmo or Stripe before adding classes.",true);activeView="payments";return render();} openInstagramPicker(); }); root.querySelectorAll("[data-class-action]").forEach((button)=>button.onclick=()=>action(button.dataset.classAction,Number(button.dataset.index))); root.querySelectorAll("[data-publish]").forEach((button)=>button.onclick=()=>persist(true,"Changes published.")); root.querySelector("[data-payment]")?.addEventListener("submit",async(event)=>{event.preventDefault();const data=new FormData(event.currentTarget);draftState.venmoUsername=String(data.get("venmoUsername")||"").replace(/^@/,"");draftState.venmoUrl=data.get("venmoUrl");draftState.paymentMethod=data.get("paymentMethod")==="stripe"?"stripe":"venmo";await persist(false,"Payment settings saved.");}); root.querySelectorAll("[data-payment-method-radio]").forEach((input)=>input.addEventListener("change",()=>{draftState.paymentMethod=input.value;if(input.value==="stripe")return persist(false,"Payment method saved.");render();})); root.querySelector("[data-class-search]")?.addEventListener("input",(event)=>{classFilter.search=event.target.value;updateClassList();}); root.querySelector("[data-class-status-filter]")?.addEventListener("change",(event)=>{classFilter.status=event.target.value;updateClassList();}); root.querySelector("[data-class-time-filter]")?.addEventListener("change",(event)=>{classFilter.time=event.target.value;updateClassList();}); root.querySelector("[data-class-style-filter]")?.addEventListener("change",(event)=>{classFilter.style=event.target.value;updateClassList();}); root.querySelector("[data-registration-search]")?.addEventListener("input",(event)=>{registrationFilter.search=event.target.value;updateRegistrationList();}); root.querySelector("[data-registration-status-filter]")?.addEventListener("change",(event)=>{registrationFilter.status=event.target.value;updateRegistrationList();}); root.querySelector("[data-registration-class-filter]")?.addEventListener("change",(event)=>{registrationFilter.classId=event.target.value;updateRegistrationList();}); root.querySelector("[data-registration-sort]")?.addEventListener("change",(event)=>{registrationFilter.sort=event.target.value;updateRegistrationList();}); root.querySelector("[data-export-registrations]")?.addEventListener("click",()=>exportRegistrations()); bindRegistrationList(); root.querySelector("[data-pending-payments]")?.addEventListener("click",()=>{registrationFilter.status="payment_pending_verification";activeView="registrations";render();}); root.querySelectorAll("[data-website-tab]").forEach((button) => button.onclick = () => { websiteTab = button.dataset.websiteTab; render(); }); root.querySelector("[data-theme-picker]")?.addEventListener("change", (event) => { if (event.target.name === "setupTheme") selectTheme(event.target.value); }); root.querySelectorAll("[data-website-form]").forEach((form) => form.addEventListener("submit", (event) => saveWebsiteForm(event, "Website updated."))); root.querySelectorAll("[data-photo-upload]").forEach((input) => input.addEventListener("change", () => uploadWebsiteImage(input))); root.querySelectorAll("[data-gallery-move]").forEach((button) => button.onclick = () => moveGalleryImage(Number(button.dataset.galleryMove), Number(button.dataset.direction))); root.querySelectorAll("[data-gallery-remove]").forEach((button) => button.onclick = () => removeGalleryImage(Number(button.dataset.galleryRemove))); bindInstagramEditor(root); bindStripeSettings(root); root.querySelector("[data-dashboard-logout]")?.addEventListener("click", async () => { await app.signOut(); location.replace("/"); }); };
  try { if (!app?.client) throw new Error(); user=await app.getSessionUser(); if (!user) return location.replace("/?login=1"); const result=await app.getPrimaryBusiness(user.id); business=result.business; if (!business) return location.replace("/?onboarding=1&app=1"); await app.assertBusinessOwner(user,business.id); bundle=await app.getBusinessBundle(business.id); stripeChargesEnabled=Boolean(bundle.stripeChargesEnabled); draftState=clone(Object.keys(bundle.website?.draft_content||{}).length?bundle.website.draft_content:bundle.website?.published_content||bundle.settings?.generated_content||{}); publishedState=clone(bundle.website?.published_content||{}); draftState.classes=classes(); try{registrations=await app.listRegistrations({user,businessId:business.id});}catch(error){console.warn(error);} render(); const stripeStatus=new URLSearchParams(window.location.search).get("stripe"); if(stripeStatus){const messages={connected:"Stripe connected — you're ready to accept card payments.",pending:"Stripe connected. Finish onboarding in Stripe to start accepting payments.",failed:"Stripe connection failed. Please try again.",invalid:"Stripe connection could not be verified. Please try again."}; toast(messages[stripeStatus]||"Stripe status updated.",stripeStatus==="failed"||stripeStatus==="invalid"); window.history.replaceState({},"",window.location.pathname+"?view=payments");} } catch(error){console.warn(error);root.innerHTML=`<section class="route-loading"><h1>We couldn't load your dashboard.</h1><p>Please refresh or sign in again.</p><a class="primary-button" href="/?login=1">Sign in</a></section>`;}
})();
