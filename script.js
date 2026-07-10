const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const demoForm = document.querySelector(".demo-form");
const formMessage = document.querySelector(".form-message");
const comparisonModal = document.querySelector(".comparison-modal");
const openComparisonButton = document.querySelector("[data-open-comparison]");
const closeComparisonButtons = document.querySelectorAll("[data-close-comparison]");
const setupModal = document.querySelector(".setup-modal");
const openSetupButtons = document.querySelectorAll("[data-open-setup]");
const closeSetupButtons = document.querySelectorAll("[data-close-setup]");
const setupForm = document.querySelector(".setup-form");
const setupSteps = document.querySelectorAll("[data-setup-step]");
const setupProgress = document.querySelector("[data-setup-progress]");
const setupPrevButton = document.querySelector("[data-setup-prev]");
const setupNextButton = document.querySelector("[data-setup-next]");
const setupSubmitButton = document.querySelector("[data-setup-submit]");
const setupMessage = document.querySelector(".setup-message");
const setupReady = document.querySelector("[data-setup-ready]");
const viewGeneratedSiteButton = document.querySelector("[data-view-generated-site]");
const themeModal = document.querySelector(".theme-modal");
const themeModalTitle = document.querySelector("#theme-modal-title");
const themeModalPreview = document.querySelector(".theme-modal-preview");
const themePreviewButtons = document.querySelectorAll("[data-theme-preview]");
const closeThemePreviewButtons = document.querySelectorAll("[data-close-theme-preview]");
const authModal = document.querySelector(".auth-modal");
const authForm = document.querySelector(".auth-form");
const authTitle = document.querySelector("#auth-title");
const authCopy = document.querySelector(".auth-copy p:last-child");
const authSubmit = document.querySelector(".auth-submit");
const authToggle = document.querySelector("[data-auth-toggle]");
const authToggleText = document.querySelector("[data-auth-toggle-text]");
const authConfirmGroup = document.querySelector("[data-auth-confirm]");
const authTermsGroup = document.querySelector("[data-auth-terms]");
const authForgot = document.querySelector("[data-auth-forgot]");
const authGoogle = document.querySelector("[data-auth-google]");
const authError = document.querySelector(".auth-error");
const closeAuthButtons = document.querySelectorAll("[data-close-auth]");
const heroMockup = document.querySelector(".dashboard-mockup");
const heroView = document.querySelector("[data-hero-view]");
const heroNavItems = document.querySelectorAll("[data-hero-nav]");
const productTabs = document.querySelectorAll("[data-product-tab]");
const productPanels = document.querySelectorAll("[data-product-panel]");
const revealItems = document.querySelectorAll(
  ".section-heading, .hero-copy, .hero-proof span, .dashboard-mockup, .workflow-card, .steps-grid article, .dance-visual, .product-tabs, .product-platform, .price-card, .theme-card, .launch-cta, .demo-copy, .demo-form"
);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const heroViews = [
  {
    nav: "Classes",
    label: "Live program",
    title: "Heels Intensive",
    status: "Registration open",
    metrics: [["Registered dancers", "48"], ["Paid students", "42"], ["Revenue", "$12.4k"], ["Waitlist", "6"]],
    chart: "Weekly registrations",
    trend: "+28%",
    listTitle: "Recent registrations",
    rows: [["MR", "Maya R.", "Paid"], ["LT", "Leah T.", "Plan"], ["NS", "Nia S.", "New"]]
  },
  {
    nav: "Roster",
    label: "Roster management",
    title: "Tonight's Classes",
    status: "Check-in live",
    metrics: [["Checked in", "31"], ["Absent", "3"], ["Groups", "5"], ["Notes", "12"]],
    chart: "Attendance by hour",
    trend: "91%",
    listTitle: "Needs attention",
    rows: [["AP", "Ari P.", "Waiver"], ["KM", "Kai M.", "Balance"], ["JT", "Jules T.", "Waitlist"]]
  },
  {
    nav: "Payments",
    label: "Payment center",
    title: "Summer Launch",
    status: "Stripe synced",
    metrics: [["Deposits", "$4.8k"], ["Plans", "28"], ["Paid", "112"], ["Refunds", "2"]],
    chart: "Revenue collected",
    trend: "$24.8k",
    listTitle: "Transactions",
    rows: [["MR", "Maya R.", "Paid"], ["LT", "Leah T.", "Deposit"], ["NS", "Nia S.", "Plan"]]
  },
  {
    nav: "Portal",
    label: "Student portal",
    title: "Dancer Home",
    status: "3 updates",
    metrics: [["Upcoming", "4"], ["Homework", "2"], ["Balance", "$85"], ["Posts", "9"]],
    chart: "Portal activity",
    trend: "76%",
    listTitle: "For dancers",
    rows: [["CL", "Class schedule", "Today"], ["HW", "Combo video", "New"], ["AN", "Announcement", "Live"]]
  },
  {
    nav: "Analytics",
    label: "Growth analytics",
    title: "Momentum Dance Co.",
    status: "Insights ready",
    metrics: [["Capacity", "84%"], ["Attendance", "91%"], ["Conversion", "18%"], ["Revenue", "$31k"]],
    chart: "Launch performance",
    trend: "+32%",
    listTitle: "Top drivers",
    rows: [["QR", "QR signups", "42"], ["EM", "Email opens", "64%"], ["RF", "Referrals", "19"]]
  },
  {
    nav: "Marketing",
    label: "Marketing studio",
    title: "Audition Prep Launch",
    status: "Campaign live",
    metrics: [["Email opens", "64%"], ["QR scans", "218"], ["Referrals", "19"], ["Leads", "73"]],
    chart: "Campaign response",
    trend: "+41%",
    listTitle: "Next actions",
    rows: [["EM", "Follow-up email", "Ready"], ["QR", "Lobby QR code", "Live"], ["RF", "Referral push", "Draft"]]
  }
];

let heroIndex = 0;
let heroTimer;
let heroChangeTimer;

const renderHeroView = (index) => {
  if (!heroView) return;
  const view = heroViews[index];
  heroView.classList.add("is-changing");
  window.clearTimeout(heroChangeTimer);
  heroChangeTimer = window.setTimeout(() => {
    heroView.innerHTML = `
      <div class="mockup-topbar">
        <div>
          <span class="tiny-label">${view.label}</span>
          <strong>${view.title}</strong>
        </div>
        <span class="status-pill">${view.status}</span>
      </div>
      <div class="metric-row">
        ${view.metrics.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}
      </div>
      <div class="mockup-content">
        <div class="chart-card">
          <div class="chart-head">
            <span>${view.chart}</span>
            <strong>${view.trend}</strong>
          </div>
          <div class="chart-line" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        </div>
        <div class="registrations-card">
          <div class="mini-title">${view.listTitle}</div>
          ${view.rows.map(([initials, name, status]) => `<div class="student-row"><span>${initials}</span><p>${name}</p><strong>${status}</strong></div>`).join("")}
        </div>
      </div>
    `;
    heroNavItems.forEach((item) => item.classList.toggle("is-active", item.textContent.trim() === view.nav));
    heroView.classList.remove("is-changing");
  }, prefersReducedMotion.matches ? 0 : 180);
};

const startHeroRotation = () => {
  if (!heroView || prefersReducedMotion.matches) return;
  window.clearInterval(heroTimer);
  heroTimer = window.setInterval(() => {
    heroIndex = (heroIndex + 1) % heroViews.length;
    renderHeroView(heroIndex);
  }, 1000);
};

renderHeroView(heroIndex);
startHeroRotation();

const pauseHeroRotation = () => {
  window.clearInterval(heroTimer);
  window.clearTimeout(heroChangeTimer);
  heroView?.classList.remove("is-changing");
};

heroMockup?.addEventListener("mouseenter", pauseHeroRotation);
heroMockup?.addEventListener("pointerenter", pauseHeroRotation);
heroMockup?.addEventListener("focusin", pauseHeroRotation);
heroMockup?.addEventListener("mouseleave", startHeroRotation);
heroMockup?.addEventListener("pointerleave", startHeroRotation);
heroMockup?.addEventListener("focusout", startHeroRotation);

heroNavItems.forEach((item) => {
  item.setAttribute("role", "button");
  item.tabIndex = 0;

  item.addEventListener("click", () => {
    const nextIndex = heroViews.findIndex((view) => view.nav === item.textContent.trim());
    if (nextIndex < 0) return;
    heroIndex = nextIndex;
    renderHeroView(heroIndex);
    startHeroRotation();
  });

  item.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    item.click();
  });
});

productTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.productTab;
    productTabs.forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
    productPanels.forEach((panel) => {
      const isActive = panel.dataset.productPanel === target;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
    });
  });

  tab.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    const currentIndex = Array.from(productTabs).indexOf(tab);
    const nextTab = productTabs[(currentIndex + direction + productTabs.length) % productTabs.length];
    nextTab.focus();
    nextTab.click();
  });
});

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  siteNav.addEventListener("click", (event) => {
    if (!event.target.matches("a")) return;
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
  });
}

if (demoForm && formMessage) {
  demoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    formMessage.textContent = "Thanks. Your BeyondEight demo request is ready to send.";
    demoForm.reset();
  });
}

const openComparison = () => {
  comparisonModal.classList.add("is-open");
  comparisonModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  comparisonModal.querySelector("[data-close-comparison]")?.focus();
};

const closeComparison = () => {
  comparisonModal.classList.remove("is-open");
  comparisonModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
};

openComparisonButton?.addEventListener("click", openComparison);
closeComparisonButtons.forEach((button) => button.addEventListener("click", closeComparison));

const openThemePreview = (button) => {
  if (!themeModal || !themeModalTitle || !themeModalPreview) return;
  const card = button.closest(".theme-card");
  const preview = button.querySelector(".mini-site-preview");
  if (!card || !preview) return;
  themeModalTitle.textContent = button.dataset.themePreview || card.querySelector("h3")?.textContent || "Website Theme";
  themeModalPreview.innerHTML = "";
  const clone = preview.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  themeModalPreview.append(clone);
  const themeClass = Array.from(card.classList).find((name) => name.startsWith("theme-") && name !== "theme-card") || "";
  themeModal.className = `theme-modal is-open ${themeClass}`.trim();
  themeModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  themeModal.querySelector("[data-close-theme-preview]")?.focus();
};

const closeThemePreview = () => {
  if (!themeModal || !themeModalPreview) return;
  themeModal.className = "theme-modal";
  themeModal.setAttribute("aria-hidden", "true");
  themeModalPreview.innerHTML = "";
  document.body.classList.remove("modal-open");
};

themePreviewButtons.forEach((button) => button.addEventListener("click", () => openThemePreview(button)));
closeThemePreviewButtons.forEach((button) => button.addEventListener("click", closeThemePreview));

let setupIndex = 0;
let setupLaunched = false;
let generatedSiteUrl = "";
let authMode = "signup";
let pendingSetupAfterAuth = false;

const authStorageKey = "beyondeightAuth";

const isAuthenticated = () => {
  try {
    return localStorage.getItem(authStorageKey) === "true" || sessionStorage.getItem(authStorageKey) === "true";
  } catch {
    return false;
  }
};

const setAuthenticated = () => {
  try {
    localStorage.setItem(authStorageKey, "true");
  } catch {
    sessionStorage.setItem(authStorageKey, "true");
  }
};

const setAuthMode = (mode) => {
  authMode = mode;
  const isLogin = mode === "login";
  if (authTitle) authTitle.textContent = isLogin ? "Log in to BeyondEight" : "Create your BeyondEight account";
  if (authCopy) {
    authCopy.textContent = isLogin
      ? "Pick up where you left off and continue building your dance business."
      : "Save your setup, preview your website, and come back to keep building your dance business.";
  }
  if (authSubmit) authSubmit.textContent = isLogin ? "Log in" : "Create account";
  authConfirmGroup?.toggleAttribute("hidden", isLogin);
  authTermsGroup?.toggleAttribute("hidden", isLogin);
  authForgot?.toggleAttribute("hidden", !isLogin);
  if (authToggleText) authToggleText.textContent = isLogin ? "Need an account?" : "Already have an account?";
  if (authToggle) authToggle.textContent = isLogin ? "Create one" : "Log in";
  if (authError) authError.textContent = "";
};

const openAuth = () => {
  if (!authModal) return;
  setAuthMode("signup");
  authModal.classList.add("is-open");
  authModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  authModal.querySelector("input, button")?.focus();
};

const closeAuth = () => {
  if (!authModal) return;
  authModal.classList.remove("is-open");
  authModal.setAttribute("aria-hidden", "true");
  if (!setupModal?.classList.contains("is-open")) {
    document.body.classList.remove("modal-open");
  }
};

const validateAuthForm = () => {
  if (!authForm) return false;
  const email = authForm.elements.authEmail?.value.trim() || "";
  const password = authForm.elements.authPassword?.value || "";
  const confirmPassword = authForm.elements.authConfirmPassword?.value || "";
  const termsAccepted = Boolean(authForm.elements.authTerms?.checked);
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!email) return "Enter your email address.";
  if (!emailIsValid) return "Enter a valid email address.";
  if (!password) return "Enter your password.";
  if (authMode !== "login" && password.length < 8) return "Use at least 8 characters for your password.";
  if (authMode === "signup") {
    if (password.length < 8) return "Use at least 8 characters for your password.";
    if (!confirmPassword) return "Confirm your password.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!termsAccepted) return "Agree to the Terms and Privacy Policy to continue.";
  }
  return "";
};

const titleCaseDomain = (value) => {
  const slug = (value || "Beyond Movement").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 28);
  return `${slug || "beyondmovement"}.com`;
};

const getSetupState = () => {
  const form = setupForm;
  const field = (name, fallback = "") => form?.elements?.[name]?.value?.trim() || fallback;
  const businessName = field("businessName", "Beyond Movement");
  const tagline = field("tagline", "Where confidence meets choreography.");
  const whatYouDo = field("whatYouDo", "We create empowering dance experiences for adults, blending technique, confidence, and community.");
  const mission = field("mission", "To empower dancers to express themselves, build confidence, and chase their dreams.");
  const whyJoin = field("whyJoin", "Our classes are welcoming, challenging, and designed to help dancers grow while feeling supported.");
  const theme = form?.querySelector('input[name="setupTheme"]:checked')?.value || "Default Elegant";
  const pages = Array.from(form?.querySelectorAll('input[name="pages"]:checked') || []).map((item) => item.value);
  const styles = Array.from(form?.querySelectorAll('input[name="styles"]:checked') || []).map((item) => item.value);
  const logoText = businessName.split(/\s+/).slice(0, 2).join("<br>").toUpperCase();
  return {
    businessName,
    tagline,
    whatYouDo,
    mission,
    whyJoin,
    theme,
    pages,
    styles,
    domain: titleCaseDomain(businessName),
    headline: tagline || "Move with purpose. Dance with passion.",
    logoText
  };
};

const setText = (selector, value) => {
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = value;
  });
};

const setHTML = (selector, value) => {
  document.querySelectorAll(selector).forEach((node) => {
    node.innerHTML = value;
  });
};

const updateSetupPreview = () => {
  if (!setupForm) return;
  const state = getSetupState();
  const stylesText = state.styles.slice(0, 3).join(", ") || "movement";
  const aboutText = `${state.businessName} helps dancers grow through ${stylesText} experiences. ${state.whatYouDo} ${state.mission} ${state.whyJoin}`;
  setText("[data-live-brand]", state.businessName);
  setText("[data-live-quote]", state.mission);
  setHTML("[data-live-logo]", state.logoText);
  setHTML("[data-live-logo-small]", state.logoText);
  setText("[data-live-headline]", state.headline);
  setText("[data-live-about]", aboutText);
  setText("[data-live-theme]", state.theme);
  setText("[data-live-pages]", `${state.pages.length} Pages Selected`);
  setText("[data-live-domain]", state.domain);
  document.querySelector(".setup-ai-preview")?.classList.add("is-updating");
  window.clearTimeout(updateSetupPreview.timer);
  updateSetupPreview.timer = window.setTimeout(() => {
    document.querySelector(".setup-ai-preview")?.classList.remove("is-updating");
  }, 220);
};

const themeClassFor = (theme) => {
  const map = {
    "Default Elegant": "generated-elegant",
    "Bold & Edgy": "generated-bold",
    "Soft & Graceful": "generated-soft",
    "Vibrant & Playful": "generated-vibrant",
    "Minimal Black": "generated-minimal"
  };
  return map[theme] || "generated-elegant";
};

const generatedSiteHTML = (state) => {
  const dancerImage = new URL("assets/dancer-hero.png", window.location.href).href;
  const pages = state.pages.slice(0, 6).map((page) => `<a href="#${page.toLowerCase().replace(/\s+/g, "-")}">${page}</a>`).join("");
  const classTags = state.styles.slice(0, 3).map((style) => `<span>${style}</span>`).join("") || "<span>Heels</span><span>Contemporary</span><span>Workshops</span>";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${state.businessName} | Generated by BeyondEight</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700;8..60,800&display=swap" rel="stylesheet">
  <style>
    :root { --ink:#241230; --muted:#6b6072; --accent:#d0185c; --coral:#ff714d; --cream:#fffaf5; --panel:#fff; font-family:Inter,Arial,sans-serif; }
    *{box-sizing:border-box} body{margin:0;background:var(--cream);color:var(--ink);font-family:Inter,Arial,sans-serif} a{text-decoration:none;color:inherit} .site{min-height:100vh}
    .generated-bold{--ink:#f9f4ef;--muted:#c9beca;--accent:#ff3c68;--coral:#ffb05f;--cream:#101014;--panel:#18171d}
    .generated-soft{--accent:#bd7a88;--coral:#d8ad9e;--cream:#fff7f3}
    .generated-vibrant{--accent:#d0185c;--coral:#ff8a32;--cream:#fff8ef}
    .generated-minimal{--ink:#f7f5ef;--muted:#bdb6c2;--accent:#ffffff;--coral:#8e8a96;--cream:#09080b;--panel:#15131a}
    header{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:24px 6vw;border-bottom:1px solid color-mix(in srgb,var(--ink) 10%,transparent);background:color-mix(in srgb,var(--cream) 92%,transparent)}
    .brand{font-family:"Source Serif 4",Georgia,serif;font-size:1.7rem;font-weight:800}.nav{display:flex;gap:20px;color:var(--muted);font-weight:700}.actions{display:flex;gap:12px}.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;padding:13px 18px;background:linear-gradient(135deg,var(--accent),var(--coral));color:white;font-weight:800}.btn.secondary{background:var(--panel);color:var(--ink);border:1px solid color-mix(in srgb,var(--ink) 12%,transparent)}
    .hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.8fr);gap:48px;align-items:center;padding:72px 6vw}.eyebrow{text-transform:uppercase;letter-spacing:.14em;color:var(--accent);font-weight:900;font-size:.75rem}h1,h2{font-family:"Source Serif 4",Georgia,serif;letter-spacing:-.035em;line-height:1}h1{max-width:720px;font-size:clamp(3rem,6vw,6rem);margin:.2em 0}.lead{max-width:650px;color:var(--muted);font-size:1.12rem;line-height:1.75}.hero-card{padding:24px;border-radius:28px;background:var(--panel);box-shadow:0 28px 80px color-mix(in srgb,var(--ink) 14%,transparent)}.hero-card img{width:100%;border-radius:22px}.tags{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0}.tags span{border-radius:999px;background:color-mix(in srgb,var(--accent) 12%,transparent);padding:9px 13px;color:var(--accent);font-weight:800}
    section{padding:64px 6vw}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.card{padding:24px;border:1px solid color-mix(in srgb,var(--ink) 10%,transparent);border-radius:20px;background:var(--panel);box-shadow:0 18px 50px color-mix(in srgb,var(--ink) 8%,transparent)}.card h3{margin:0 0 8px}.portal{display:grid;grid-template-columns:1fr 1fr;gap:20px}.dashboard{display:grid;gap:12px}.metric{display:flex;justify-content:space-between;border-radius:14px;background:color-mix(in srgb,var(--accent) 8%,var(--panel));padding:15px}.footer{display:flex;align-items:center;justify-content:space-between;padding:32px 6vw;background:color-mix(in srgb,var(--ink) 5%,var(--cream))}
    @media(max-width:850px){.hero,.portal{grid-template-columns:1fr}.grid{grid-template-columns:1fr}.nav{display:none}header{align-items:flex-start;flex-direction:column}}
  </style>
</head>
<body class="${themeClassFor(state.theme)}">
  <div class="site">
    <header><div class="brand">${state.businessName}</div><nav class="nav">${pages}</nav><div class="actions"><button class="btn secondary">Edit Page</button><button class="btn">Admin Dashboard</button><button class="btn secondary" onclick="localStorage.removeItem('beyondeightAuth');sessionStorage.removeItem('beyondeightAuth');this.textContent='Logged out';">Log out</button></div></header>
    <main>
      <section class="hero">
        <div><p class="eyebrow">${state.theme}</p><h1>${state.headline}</h1><p class="lead">${state.whatYouDo}</p><div class="tags">${classTags}</div><a class="btn" href="#register">Register now</a></div>
        <div class="hero-card"><img src="${dancerImage}" alt=""><h3>Upcoming launch</h3><p>${state.whyJoin}</p></div>
      </section>
      <section id="about"><h2>About ${state.businessName}</h2><p class="lead">${state.mission}</p></section>
      <section id="classes"><h2>Classes & Workshops</h2><div class="grid"><article class="card"><h3>Signature Series</h3><p>Weekly training built around confidence, choreography, and community.</p></article><article class="card"><h3>Pop-up Workshop</h3><p>Launch a one-day event with registration, waivers, and payments.</p></article><article class="card"><h3>Private Training</h3><p>Offer focused coaching for dancers ready for personalized growth.</p></article></div></section>
      <section class="portal"><div><h2>Student Portal Preview</h2><div class="card"><p><strong>Today:</strong> Contemporary Lab at 7:00 PM</p><p><strong>Homework:</strong> Combo video uploaded</p><p><strong>Balance:</strong> $85 remaining</p></div></div><div><h2>Admin Dashboard Preview</h2><div class="dashboard"><div class="metric"><span>Registered</span><strong>48</strong></div><div class="metric"><span>Revenue</span><strong>$12.4k</strong></div><div class="metric"><span>Waitlist</span><strong>6</strong></div></div></div></section>
      <section id="register"><div class="card"><h2>Ready to move with us?</h2><p>${state.whyJoin}</p><a class="btn" href="mailto:hello@${state.domain}">Start registration</a></div></section>
    </main>
    <footer class="footer"><span>${state.businessName}</span><span>${state.domain} / Instagram / TikTok / Contact</span></footer>
  </div>
</body>
</html>`;
};

const launchGeneratedWebsite = () => {
  const state = getSetupState();
  const blob = new Blob([generatedSiteHTML(state)], { type: "text/html" });
  if (generatedSiteUrl) URL.revokeObjectURL(generatedSiteUrl);
  generatedSiteUrl = URL.createObjectURL(blob);
  viewGeneratedSiteButton?.setAttribute("href", generatedSiteUrl);
  const page = window.open(generatedSiteUrl, "_blank");
  if (!page) {
    if (setupMessage) setupMessage.textContent = "Popup blocked. Use View My Website to open the generated site.";
  }
};

const renderSetupDots = () => {
  const dotGroups = document.querySelectorAll(".setup-dots");
  dotGroups.forEach((group) => {
    group.innerHTML = Array.from(setupSteps, (_, index) => `<span class="${index === setupIndex ? "is-active" : ""}">${index + 1}</span>`).join("");
  });
};

const updateSetupStep = () => {
  if (!setupSteps.length) return;
  setupSteps.forEach((step, index) => {
    const isActive = !setupLaunched && index === setupIndex;
    step.classList.toggle("is-active", isActive);
    step.toggleAttribute("hidden", !isActive);
  });
  setupReady?.toggleAttribute("hidden", !setupLaunched);
  if (setupProgress) {
    setupProgress.style.width = setupLaunched ? "100%" : `${((setupIndex + 1) / setupSteps.length) * 100}%`;
  }
  if (setupPrevButton) setupPrevButton.hidden = setupLaunched;
  if (setupPrevButton) setupPrevButton.disabled = setupIndex === 0;
  if (setupNextButton) setupNextButton.hidden = setupLaunched || setupIndex === setupSteps.length - 1;
  if (setupSubmitButton) setupSubmitButton.hidden = setupLaunched || setupIndex !== setupSteps.length - 1;
  if (setupMessage) setupMessage.textContent = "";
  renderSetupDots();
};

const stepIsValid = () => {
  const currentStep = setupSteps[setupIndex];
  if (!currentStep) return true;
  const requiredFields = currentStep.querySelectorAll("[required]");
  return Array.from(requiredFields).every((field) => field.reportValidity());
};

const openSetupDirect = (event) => {
  event?.preventDefault();
  setupModal.classList.add("is-open");
  setupModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setupIndex = 0;
  setupLaunched = false;
  updateSetupPreview();
  updateSetupStep();
  setupModal.querySelector("input, button")?.focus();
};

const openSetup = (event) => {
  event?.preventDefault();
  if (!isAuthenticated()) {
    pendingSetupAfterAuth = true;
    openAuth();
    return;
  }
  openSetupDirect(event);
};

const closeSetup = () => {
  setupModal.classList.remove("is-open");
  setupModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
};

// Prototype only: production authentication must use a secure backend or authentication provider.
authForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const validationMessage = validateAuthForm();
  if (validationMessage) {
    if (authError) authError.textContent = validationMessage;
    return;
  }
  setAuthenticated();
  closeAuth();
  if (pendingSetupAfterAuth) {
    pendingSetupAfterAuth = false;
    openSetupDirect();
  }
});

authToggle?.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "signup" : "login");
});

authGoogle?.addEventListener("click", () => {
  setAuthenticated();
  closeAuth();
  if (pendingSetupAfterAuth) {
    pendingSetupAfterAuth = false;
    openSetupDirect();
  }
});

authForgot?.addEventListener("click", () => {
  if (authError) authError.textContent = "Password reset is a prototype placeholder. A production app would send a secure reset email.";
});

closeAuthButtons.forEach((button) => button.addEventListener("click", closeAuth));
openSetupButtons.forEach((button) => button.addEventListener("click", openSetup));
document.addEventListener("click", (event) => {
  if (event.defaultPrevented) return;
  const setupTrigger = event.target.closest?.("[data-open-setup]");
  if (!setupTrigger) return;
  openSetup(event);
});
closeSetupButtons.forEach((button) => button.addEventListener("click", closeSetup));
setupPrevButton?.addEventListener("click", () => {
  setupIndex = Math.max(0, setupIndex - 1);
  updateSetupStep();
});
setupNextButton?.addEventListener("click", () => {
  if (!stepIsValid()) return;
  setupIndex = Math.min(setupSteps.length - 1, setupIndex + 1);
  updateSetupStep();
});
setupForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!stepIsValid()) return;
  launchGeneratedWebsite();
  setupLaunched = true;
  updateSetupStep();
  setupMessage.textContent = "Your website setup is ready.";
});
viewGeneratedSiteButton?.addEventListener("click", () => {
  if (!generatedSiteUrl) {
    const blob = new Blob([generatedSiteHTML(getSetupState())], { type: "text/html" });
    generatedSiteUrl = URL.createObjectURL(blob);
    viewGeneratedSiteButton.setAttribute("href", generatedSiteUrl);
  }
});
setupForm?.addEventListener("input", updateSetupPreview);
setupForm?.addEventListener("change", updateSetupPreview);
updateSetupStep();
updateSetupPreview();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && comparisonModal?.classList.contains("is-open")) {
    closeComparison();
  }
  if (event.key === "Escape" && themeModal?.classList.contains("is-open")) {
    closeThemePreview();
  }
  if (event.key === "Escape" && authModal?.classList.contains("is-open")) {
    closeAuth();
  }
  if (event.key === "Escape" && setupModal?.classList.contains("is-open")) {
    closeSetup();
  }
});

revealItems.forEach((item) => item.classList.add("reveal"));

const revealVisibleItems = () => {
  const triggerLine = window.innerHeight * 0.88;

  revealItems.forEach((item) => {
    if (item.classList.contains("is-visible")) return;

    const itemTop = item.getBoundingClientRect().top;
    if (itemTop < triggerLine) {
      item.classList.add("is-visible");
    }
  });
};

window.addEventListener("scroll", revealVisibleItems, { passive: true });
window.addEventListener("resize", revealVisibleItems);
window.addEventListener("load", revealVisibleItems);
requestAnimationFrame(revealVisibleItems);
