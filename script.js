const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const demoForm = document.querySelector(".demo-form");
const formMessage = document.querySelector(".form-message");
const comparisonModal = document.querySelector(".comparison-modal");
const openComparisonButton = document.querySelector("[data-open-comparison]");
const closeComparisonButtons = document.querySelectorAll("[data-close-comparison]");
const planDemoModal = document.querySelector(".plan-demo-modal");
const planDemoForm = document.querySelector(".plan-demo-form");
const planDemoName = document.querySelector("[data-plan-demo-name]");
const planDemoMessage = document.querySelector(".plan-demo-message");
const planDemoButtons = document.querySelectorAll("[data-request-demo-plan]");
const closePlanDemoButtons = document.querySelectorAll("[data-close-plan-demo]");
const setupModal = document.querySelector(".setup-modal");
const openSetupButtons = document.querySelectorAll("[data-open-setup]");
const closeSetupButtons = document.querySelectorAll("[data-close-setup]");
const setupSkipButton = document.querySelector("[data-setup-skip]");
const setupForm = document.querySelector(".setup-form");
const setupSteps = document.querySelectorAll("[data-setup-step]");
const setupProgress = document.querySelector("[data-setup-progress]");
const setupPrevButton = document.querySelector("[data-setup-prev]");
const setupNextButton = document.querySelector("[data-setup-next]");
const setupSubmitButton = document.querySelector("[data-setup-submit]");
const setupMessage = document.querySelector(".setup-message");
const setupReady = document.querySelector("[data-setup-ready]");
const viewGeneratedSiteButton = document.querySelector("[data-view-generated-site]");
const readyGoogleButton = document.querySelector("[data-ready-google]");
const readyPublishButton = document.querySelector("[data-ready-publish]");
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
const authLoginButtons = document.querySelectorAll("[data-open-auth-login]");
const authSignupButtons = document.querySelectorAll("[data-open-auth-signup]");
const authLogoutButtons = document.querySelectorAll("[data-auth-logout]");
const loggedOutAccount = document.querySelector('[data-auth-state="logged-out"]');
const loggedInAccount = document.querySelector('[data-auth-state="logged-in"]');
const userAvatar = document.querySelector("[data-user-avatar]");
const dashboardLinks = document.querySelectorAll("[data-dashboard-link]");
const slugStatus = document.querySelector("[data-slug-status]");
const specialtyInput = document.querySelector("[data-specialty-input]");
const specialtyTags = document.querySelector("[data-specialty-tags]");
const specialtySuggestions = document.querySelector("[data-specialty-suggestions]");
const logoUploadInput = document.querySelector("[data-logo-upload]");
const logoUploadStatus = document.querySelector("[data-logo-upload-status]");
const logoUploadLabel = document.querySelector(".setup-logo-upload");
const logoUploadTrigger = document.querySelector("[data-logo-upload-trigger]");
const logoUploadFileName = document.querySelector("[data-logo-file-name]");
const heroMockup = document.querySelector(".dashboard-mockup");
const heroView = document.querySelector("[data-hero-view]");
const heroNavItems = document.querySelectorAll("[data-hero-nav]");
const productTabs = document.querySelectorAll("[data-product-tab]");
const productPanels = document.querySelectorAll("[data-product-panel]");
const revealItems = document.querySelectorAll(
  ".section-heading, .hero-copy, .hero-proof span, .dashboard-mockup, .workflow-card, .steps-grid article, .dance-visual, .product-tabs, .product-platform, .price-card, .theme-card, .launch-cta, .demo-copy, .demo-form"
);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const defaultSetupPages = ["Home", "About", "Classes & Workshops", "Gallery", "Contact", "Register"];
const defaultSpecialties = ["Heels", "Hip Hop", "Contemporary"];
const specialtyOptions = [
  "Heels",
  "Hip Hop",
  "Commercial",
  "Contemporary",
  "Jazz",
  "Open Style",
  "Bollywood",
  "Bollyhop",
  "Bharatanatyam",
  "Kathak",
  "Garba",
  "Bhangra",
  "Afro",
  "Dancehall",
  "House",
  "Waacking",
  "Vogue",
  "Breaking",
  "Popping",
  "Locking",
  "Salsa",
  "Bachata",
  "Latin",
  "Ballroom",
  "Kids Dance",
  "Wedding Choreography",
  "Fitness Dance"
];
const specialtyAliases = {
  Bollywood: "bolly bolly dance indian filmi hindi",
  Bollyhop: "bolly bolly hop bollyhiphop indian hip hop",
  Bharatanatyam: "bharat natyam classical indian",
  Kathak: "classical indian",
  Garba: "garbha dandiya indian folk",
  Bhangra: "punjabi indian folk",
  "Hip Hop": "hiphop hip-hop urban street",
  Afro: "afrobeat afrobeats afro fusion afrofusion",
  Waacking: "whacking punking",
  "Kids Dance": "children child youth kids classes",
  "Wedding Choreography": "wedding sangeet bridal first dance",
  "Fitness Dance": "dance fitness cardio workout"
};
let selectedSpecialties = [...defaultSpecialties];
let activeSpecialtyIndex = -1;

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

const openPlanDemo = (plan = "Growth") => {
  if (!planDemoModal) return;
  if (planDemoName) planDemoName.textContent = plan;
  if (planDemoMessage) planDemoMessage.textContent = "";
  planDemoModal.classList.add("is-open");
  planDemoModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  planDemoForm?.querySelector("input")?.focus();
};

const closePlanDemo = () => {
  if (!planDemoModal) return;
  planDemoModal.classList.remove("is-open");
  planDemoModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
};

planDemoButtons.forEach((button) => {
  button.addEventListener("click", () => openPlanDemo(button.dataset.requestDemoPlan || "Growth"));
});
closePlanDemoButtons.forEach((button) => button.addEventListener("click", closePlanDemo));
planDemoForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const emailField = planDemoForm.elements.planDemoEmail;
  if (!emailField?.reportValidity()) return;
  if (planDemoMessage) {
    planDemoMessage.textContent = "Thank you for your interest. Our team will reach out soon with the demo and any updates.";
  }
  planDemoForm.reset();
});

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
let currentUser = null;
let currentBusinessId = null;
let authReady = false;
let saveTimer;
let slugCheckTimer;
let slugManuallyEdited = false;
let pendingOwnerAction = "";
let logoImageDataUrl = "";
let logoImageFileName = "";

const GUEST_SETUP_KEY = "beyondeight.guestWebsiteDraft";
const GUEST_SETUP_VERSION = 2;
const PENDING_OWNER_ACTION_KEY = "beyondeight.pendingOwnerAction";
const LOCAL_PUBLISHED_SITES_KEY = "beyondeight.localPublishedSites";

const beyondEight = window.BeyondEight || {};
const supabaseClient = beyondEight.client;
window.beyondEightSupabaseReady = Boolean(supabaseClient);

const isAuthenticated = () => Boolean(currentUser);

const setAuthError = (message = "") => {
  if (authError) authError.textContent = message;
};

const setAuthBusy = (isBusy) => {
  if (authSubmit) authSubmit.disabled = isBusy;
  if (authGoogle) authGoogle.disabled = isBusy;
};

const getAuthRedirectUrl = () => `${window.location.origin}/auth/callback/`;

const initialsFor = (user) => {
  const source = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "BE";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "BE";
};

const updateHeaderForAuth = async () => {
  const loggedIn = Boolean(currentUser);
  if (loggedOutAccount) loggedOutAccount.hidden = loggedIn;
  if (loggedInAccount) loggedInAccount.hidden = !loggedIn;
  if (userAvatar && loggedIn) userAvatar.textContent = initialsFor(currentUser);
  const route = loggedIn ? await beyondEight.routeForUser?.(currentUser).catch(() => "/dashboard/") : "/dashboard/";
  const needsOnboarding = route?.includes("onboarding=1");
  dashboardLinks.forEach((link) => {
    link.href = needsOnboarding ? route : "/dashboard/";
  });
  openSetupButtons.forEach((button) => {
    if (!loggedIn) {
      button.textContent = button.dataset.originalText || button.textContent;
      return;
    }
    button.dataset.originalText ||= button.textContent;
    button.textContent = needsOnboarding ? "Continue setup" : "Go to Dashboard";
  });
};

const setAuthMode = (mode) => {
  authMode = mode;
  const isLogin = mode === "login";
  if (authTitle) authTitle.textContent = isLogin ? "Welcome back" : "Let's build your BeyondEight workspace";
  if (authCopy) {
    authCopy.textContent = isLogin
      ? "Continue with Google or log in with email to manage your website."
      : "Create your free account to save your website, continue editing anytime, and publish when you're ready.";
  }
  if (authSubmit) authSubmit.textContent = isLogin ? "Log In" : "Build My Website";
  authConfirmGroup?.setAttribute("hidden", "");
  authTermsGroup?.setAttribute("hidden", "");
  authForgot?.toggleAttribute("hidden", !isLogin);
  if (authToggleText) authToggleText.textContent = isLogin ? "Don't have an account?" : "Already have an account?";
  if (authToggle) authToggle.textContent = isLogin ? "Build your website" : "Log In";
  if (authError) authError.textContent = "";
};

const openAuth = (mode = "signup") => {
  if (!authModal) return;
  setAuthMode(mode);
  authModal.classList.add("is-open");
  authModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  authModal.querySelector("input, button")?.focus();
};

const prepareAuthForOwnerAction = (action = "") => {
  pendingSetupAfterAuth = true;
  pendingOwnerAction = action;
  if (action) window.localStorage.setItem(PENDING_OWNER_ACTION_KEY, action);
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
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!email) return "Enter your email address.";
  if (!emailIsValid) return "Enter a valid email address.";
  if (!password) return "Enter your password.";
  if (authMode !== "login" && password.length < 8) return "Use at least 8 characters for your password.";
  if (authMode === "signup") {
    if (password.length < 8) return "Use at least 8 characters for your password.";
  }
  return "";
};

const titleCaseDomain = (value) => {
  const slug = beyondEight.slugify?.(value || "Beyond Movement") || "beyondmovement";
  return `https://beyond8dance.com/${slug}`;
};

const getSetupState = () => {
  const form = setupForm;
  const field = (name, fallback = "") => form?.elements?.[name]?.value?.trim() || fallback;
  const enteredBusinessName = field("businessName", "");
  const businessName = enteredBusinessName || "Beyond Movement";
  const fallbackSlug = beyondEight.slugify?.(businessName) || "beyond-movement";
  const slug = field("businessSlug", fallbackSlug);
  const tagline = field("tagline", "");
  const whatYouDo = field("whatYouDo", "");
  const mission = field("mission", "");
  const whyJoin = field("whyJoin", "");
  const brandVibe = form?.querySelector('input[name="brandVibe"]:checked')?.value || "Elegant";
  const theme = form?.querySelector('input[name="setupTheme"]:checked')?.value || "Editorial Elegant";
  const pages = Array.from(form?.querySelectorAll('input[name="pages"]:checked') || []).map((item) => item.value);
  const styles = [...selectedSpecialties];
  const logoText = businessName.split(/\s+/).slice(0, 2).join("<br>").toUpperCase();
  const logoFont = form?.querySelector('input[name="logoFont"]:checked')?.value || "serif";
  return {
    businessName,
    slug,
    tagline,
    businessType: "Independent Choreographer",
    brandVibe,
    whatYouDo,
    mission,
    whyJoin,
    theme,
    pages: pages.length ? pages : defaultSetupPages,
    styles,
    instagram: field("instagram", ""),
    tiktok: field("tiktok", ""),
    youtube: field("youtube", ""),
    website: field("website", ""),
    domain: `https://beyond8dance.com/${slug || fallbackSlug}`,
    headline: tagline || "",
    logoText,
    logoFont,
    logoImage: logoImageDataUrl,
    logoFileName: logoImageFileName
  };
};

const getSetupCredentials = () => ({
  email: setupForm?.elements?.publishEmail?.value?.trim() || "",
  password: setupForm?.elements?.publishPassword?.value || ""
});

const validateSetupCredentials = () => {
  if (currentUser) return "";
  const { email, password } = getSetupCredentials();
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!email) return "Enter your email address to publish.";
  if (!emailIsValid) return "Enter a valid email address to publish.";
  if (!password) return "Enter a password to publish.";
  if (password.length < 8) return "Use at least 8 characters for your password.";
  return "";
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error || new Error("We could not read that image.")));
    reader.readAsDataURL(file);
  });

const resizeLogoImage = async (file) => {
  const originalDataUrl = await fileToDataUrl(file);
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return originalDataUrl;

  const image = new Image();
  image.decoding = "async";
  image.src = originalDataUrl;
  await new Promise((resolve, reject) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", () => reject(new Error("We could not preview that logo image.")), { once: true });
  });

  const longestSide = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height);
  if (!longestSide) return originalDataUrl;
  const maxSide = 640;
  const scale = Math.min(1, maxSide / longestSide);
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.86);
};

const saveGuestSetupDraft = ({ explicit = false } = {}) => {
  if (!setupForm) return;
  let previousDraft = {};
  try {
    previousDraft = JSON.parse(window.localStorage.getItem(GUEST_SETUP_KEY) || "{}");
  } catch {
    previousDraft = {};
  }
  try {
    window.localStorage.setItem(
      GUEST_SETUP_KEY,
      JSON.stringify({
        version: GUEST_SETUP_VERSION,
        state: getSetupState(),
        stepIndex: setupIndex,
        explicit: explicit || Boolean(previousDraft.explicit),
        savedAt: new Date().toISOString()
      })
    );
  } catch (error) {
    console.warn("Could not save local website draft:", error);
    const state = getSetupState();
    window.localStorage.setItem(
      GUEST_SETUP_KEY,
      JSON.stringify({
        version: GUEST_SETUP_VERSION,
        state: { ...state, logoImage: "", logoUrl: "" },
        stepIndex: setupIndex,
        explicit: explicit || Boolean(previousDraft.explicit),
        savedAt: new Date().toISOString()
      })
    );
  }
};

const sanitizeRestoredSetupState = (draft = {}) => {
  const state = { ...(draft.state || {}) };
  if (Number(draft.version || 0) >= GUEST_SETUP_VERSION) return state;
  if (state.businessName === "Beyond Movement") state.businessName = "";
  if (state.slug === "beyond-movement") state.slug = "";
  if (state.tagline === "Where confidence meets choreography.") state.tagline = "";
  return state;
};

const restoreGuestSetupDraft = ({ requireExplicit = false } = {}) => {
  try {
    const raw = window.localStorage.getItem(GUEST_SETUP_KEY);
    if (!raw) return false;
    const draft = JSON.parse(raw);
    if (requireExplicit && !draft?.explicit) return false;
    if (draft?.state) applySetupState(sanitizeRestoredSetupState(draft));
    if (Number.isFinite(Number(draft?.stepIndex))) {
      setupIndex = Math.min(Math.max(Number(draft.stepIndex), 0), setupSteps.length - 1);
    }
    updateSetupStep();
    return true;
  } catch (error) {
    console.warn("Could not restore local website draft:", error);
    return false;
  }
};

const clearGuestSetupDraft = () => {
  window.localStorage.removeItem(GUEST_SETUP_KEY);
  window.localStorage.removeItem(PENDING_OWNER_ACTION_KEY);
};

const resetGuestSetup = () => {
  clearGuestSetupDraft();
  setupForm?.reset();
  selectedSpecialties = [...defaultSpecialties];
  setupIndex = 0;
  setupLaunched = false;
  currentBusinessId = null;
  slugManuallyEdited = false;
  logoImageDataUrl = "";
  logoImageFileName = "";
  if (logoUploadInput) logoUploadInput.value = "";
  renderSpecialties();
  setSlugStatus("Start with your brand name and we will check this link.", "neutral");
  updateSetupPreview();
  updateSetupStep();
};

const localPublicNavigationUrl = (slug) => {
  const isLocalStaticServer = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return isLocalStaticServer ? `/404.html?slug=${encodeURIComponent(slug)}` : `/${slug}`;
};

const buildLocalPublishedBundle = (state) => {
  const pages = (state.pages?.length ? state.pages : defaultSetupPages).map((title, index) => ({
    id: `local-${index}`,
    title,
    page_type: beyondEight.slugify?.(title) || title.toLowerCase().replace(/\s+/g, "-"),
    enabled: true,
    display_order: index,
    content: {
      businessName: state.businessName,
      tagline: state.tagline,
      description: state.whatYouDo,
      mission: state.mission,
      whyJoin: state.whyJoin,
      styles: state.styles || [],
      logoUrl: state.logoUrl || ""
    }
  }));
  return {
    business: {
      id: `local-${state.slug}`,
      business_name: state.businessName,
      slug: state.slug,
      tagline: state.headline || state.tagline,
      description: state.whatYouDo,
      mission: state.mission,
      why_join: state.whyJoin,
      theme: state.theme,
      logo_url: state.logoUrl || "",
      status: "published"
    },
    settings: {
      dance_styles: state.styles || [],
      selected_pages: state.pages || defaultSetupPages,
      generated_content: state
    },
    website: {
      id: `local-website-${state.slug}`,
      published: true,
      theme: state.theme
    },
    pages
  };
};

const saveLocalPublishedPreview = (state) => {
  const slug = beyondEight.slugify?.(state.slug || state.businessName) || "beyond-movement";
  const siteState = { ...state, slug };
  const localSites = JSON.parse(window.localStorage.getItem(LOCAL_PUBLISHED_SITES_KEY) || "{}");
  localSites[slug] = buildLocalPublishedBundle(siteState);
  window.localStorage.setItem(LOCAL_PUBLISHED_SITES_KEY, JSON.stringify(localSites));
  return localPublicNavigationUrl(slug);
};

const normalizeSpecialty = (value = "") =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .slice(0, 42);

const specialtyExists = (value) => selectedSpecialties.some((item) => item.toLowerCase() === value.toLowerCase());

const searchableSpecialtyText = (option) => `${option} ${specialtyAliases[option] || ""}`.toLowerCase();

const renderSpecialties = () => {
  if (!specialtyTags || !specialtySuggestions) return;
  specialtyTags.innerHTML = selectedSpecialties
    .map(
      (style) =>
        `<button class="specialty-tag" type="button" data-remove-specialty="${style.replace(/"/g, "&quot;")}"><span>${style}</span><strong aria-hidden="true">×</strong></button>`
    )
    .join("");

  const query = specialtyInput?.value.trim().toLowerCase() || "";
  const queryParts = query.split(/\s+/).filter(Boolean);
  const matches = specialtyOptions
    .filter((option) => !specialtyExists(option))
    .filter((option) => !queryParts.length || queryParts.every((part) => searchableSpecialtyText(option).includes(part)))
    .slice(0, 8);
  const customValue = normalizeSpecialty(specialtyInput?.value || "");
  const customButton =
    customValue && !specialtyExists(customValue) && !matches.some((option) => option.toLowerCase() === customValue.toLowerCase())
      ? `<button type="button" data-add-specialty="${customValue.replace(/"/g, "&quot;")}">+ Create "${customValue}"</button>`
      : "";
  specialtySuggestions.innerHTML = `${matches.map((option) => `<button type="button" role="option" data-add-specialty="${option}">${option}</button>`).join("")}${customButton}`;
  specialtySuggestions.hidden = !matches.length && !customButton;
  const suggestionButtons = specialtySuggestions.querySelectorAll("[data-add-specialty]");
  activeSpecialtyIndex = suggestionButtons.length ? Math.min(Math.max(activeSpecialtyIndex, -1), suggestionButtons.length - 1) : -1;
  suggestionButtons.forEach((button, index) => button.classList.toggle("is-active", index === activeSpecialtyIndex));
  specialtyInput?.setAttribute("aria-expanded", String(!specialtySuggestions.hidden));
};

const addSpecialty = (value) => {
  const specialty = normalizeSpecialty(value);
  if (!specialty || specialtyExists(specialty)) return;
  selectedSpecialties.push(specialty);
  if (specialtyInput) specialtyInput.value = "";
  renderSpecialties();
  updateSetupPreview();
  queueOnboardingSave();
};

const removeSpecialty = (value) => {
  selectedSpecialties = selectedSpecialties.filter((item) => item.toLowerCase() !== value.toLowerCase());
  renderSpecialties();
  updateSetupPreview();
  queueOnboardingSave();
};

const setFormValue = (name, value) => {
  const field = setupForm?.elements?.[name];
  if (!field || value == null) return;
  field.value = value;
};

const setCheckedValues = (name, values = []) => {
  const selectedValues = new Set(values);
  setupForm?.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = selectedValues.has(input.value);
  });
};

const setRadioValue = (name, value) => {
  if (!value) return;
  const radio = setupForm?.querySelector(`input[name="${name}"][value="${CSS.escape(value)}"]`);
  if (radio) radio.checked = true;
};

const applySetupState = (state = {}) => {
  if (!setupForm || !state) return;
  setFormValue("businessName", state.businessName);
  setFormValue("businessSlug", state.slug);
  setFormValue("tagline", state.tagline);
  setFormValue("whatYouDo", state.whatYouDo);
  setFormValue("mission", state.mission);
  setFormValue("whyJoin", state.whyJoin);
  setFormValue("instagram", state.instagram);
  setFormValue("tiktok", state.tiktok);
  setFormValue("youtube", state.youtube);
  setFormValue("website", state.website);
  selectedSpecialties = Array.isArray(state.styles) ? [...new Set(state.styles.map(normalizeSpecialty).filter(Boolean))] : [];
  logoImageDataUrl = state.logoImage || "";
  logoImageFileName = state.logoFileName || (logoImageDataUrl ? "Logo image" : "");
  renderSpecialties();
  setCheckedValues("pages", state.pages);
  setRadioValue("brandVibe", state.brandVibe);
  setRadioValue("setupTheme", state.theme);
  setRadioValue("logoFont", state.logoFont);
  updateSetupPreview();
};

const setSlugStatus = (message, state = "neutral") => {
  if (!slugStatus) return;
  slugStatus.textContent = message;
  slugStatus.dataset.state = state;
};

const validateCurrentSlug = async () => {
  const state = getSetupState();
  const localCheck = beyondEight.validSlug?.(state.slug) || { valid: true, slug: state.slug, message: "Available format." };
  if (!localCheck.valid) {
    setSlugStatus(localCheck.message, "error");
    return false;
  }
  try {
    const availability = await beyondEight.checkSlugAvailability?.(localCheck.slug, currentBusinessId);
    if (availability && !availability.valid) {
      setSlugStatus("x Already taken. Try a slightly different website address.", "error");
      return false;
    }
    if (setupForm?.elements.businessSlug) setupForm.elements.businessSlug.value = localCheck.slug;
    setSlugStatus("✓ Available. Great choice! Your students will use this link to register.", "success");
    return true;
  } catch (error) {
    console.info("Slug availability will be rechecked before authenticated publishing.", error);
    setSlugStatus("We will recheck this URL before launch.", "neutral");
    return true;
  }
};

const scheduleSlugValidation = () => {
  window.clearTimeout(slugCheckTimer);
  setSlugStatus("Checking availability...", "neutral");
  slugCheckTimer = window.setTimeout(() => validateCurrentSlug(), 220);
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

const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);

const logoHTMLFor = (state) => {
  const image = state.logoImage ? `<img src="${state.logoImage}" alt="">` : "";
  return `<span class="logo-lockup logo-font-${state.logoFont || "serif"}">${image}<span>${state.logoText}</span></span>`;
};

const themeKeyFor = (theme = "") => {
  const normalized = String(theme).toLowerCase();
  if (normalized.includes("bold")) return "bold";
  if (normalized.includes("soft")) return "soft";
  if (normalized.includes("vibrant")) return "vibrant";
  if (normalized.includes("classical")) return "classical";
  if (normalized.includes("urban")) return "urban";
  if (normalized.includes("minimal")) return "minimal";
  return "elegant";
};

const applySetupPreviewTheme = (theme) => {
  const key = themeKeyFor(theme);
  document
    .querySelectorAll(".setup-home-preview, .setup-story-preview, .setup-preview-site, .ready-phone")
    .forEach((node) => {
      node.dataset.themeKey = key;
    });
};

const updateLogoUploadState = (fileName = "") => {
  logoUploadLabel?.classList.toggle("is-uploaded", Boolean(logoImageDataUrl));
  const displayName = fileName || logoImageFileName || "";
  if (logoUploadTrigger) logoUploadTrigger.textContent = logoImageDataUrl ? "Change image" : "Choose image";
  if (logoUploadFileName) logoUploadFileName.textContent = displayName || "No file selected";
  if (logoUploadStatus) {
    logoUploadStatus.textContent = logoImageDataUrl
      ? `${displayName || "Logo image"} selected. It will appear beside your wordmark.`
      : "Optional. Choose a logo image from your computer.";
  }
};

const updateSetupPreview = () => {
  if (!setupForm) return;
  const state = getSetupState();
  const stylesText = state.styles.slice(0, 3).join(", ");
  const aboutText = [state.whatYouDo, state.mission, state.whyJoin].filter(Boolean).join(" ");
  applySetupPreviewTheme(state.theme);
  setText("[data-live-brand]", state.businessName);
  setText("[data-live-quote]", state.mission);
  setHTML("[data-live-logo]", logoHTMLFor(state));
  setHTML("[data-live-logo-small]", logoHTMLFor(state));
  updateLogoUploadState();
  setText("[data-live-headline]", state.headline);
  setText("[data-live-about]", aboutText);
  document.querySelectorAll("[data-live-quote], [data-live-about]").forEach((node) => {
    node.classList.toggle("is-empty", !node.textContent.trim());
  });
  document.querySelectorAll("[data-live-specialties]").forEach((node) => {
    node.textContent = stylesText ? state.styles.slice(0, 3).join(" • ") : "";
    node.hidden = !stylesText;
  });
  document.querySelectorAll(".setup-home-preview [data-live-specialties]").forEach((node) => {
    node.innerHTML = stylesText ? state.styles.slice(0, 4).map((style) => `<span>${escapeHTML(style)}</span>`).join("") : "";
    node.hidden = !stylesText;
  });
  setText("[data-live-theme]", state.theme);
  setText("[data-live-pages]", `${state.pages.length} Pages Selected`);
  setText("[data-live-domain]", state.domain);
  setText(
    "[data-live-socials]",
    [
      state.instagram && "Instagram",
      state.tiktok && "TikTok",
      state.youtube && "YouTube",
      state.website && "Website"
    ]
      .filter(Boolean)
      .join(", ") || "Add later"
  );
  document.querySelector(".setup-ai-preview")?.classList.add("is-updating");
  window.clearTimeout(updateSetupPreview.timer);
  updateSetupPreview.timer = window.setTimeout(() => {
    document.querySelector(".setup-ai-preview")?.classList.remove("is-updating");
  }, 220);
};

const ensureProfile = async () => {
  if (!supabaseClient || !currentUser) return;
  return beyondEight.ensureProfile?.(currentUser);
};

const saveOnboardingProgress = async ({ launched = false } = {}) => {
  if (!setupForm) return;
  if (!currentUser || !supabaseClient) {
    saveGuestSetupDraft();
    if (setupMessage && setupModal?.classList.contains("is-open")) {
      setupMessage.textContent = "Website draft saved on this device. Create an account when you are ready to publish or edit.";
    }
    return;
  }
  const state = getSetupState();
  try {
    if (!(await validateCurrentSlug())) return;
    const business = await beyondEight.saveOnboarding?.({
      user: currentUser,
      state,
      stepIndex: setupIndex,
      businessId: currentBusinessId,
      launched
    });
    currentBusinessId = business?.id || currentBusinessId;
    if (setupMessage && setupModal?.classList.contains("is-open")) {
      setupMessage.textContent = launched ? "Your website setup is saved and ready." : "Progress saved.";
    }
  } catch (error) {
    console.warn("Supabase save failed:", error);
    if (setupMessage && setupModal?.classList.contains("is-open")) {
      setupMessage.textContent = "Supabase is connected, but saving needs the database schema from supabase-schema.sql.";
    }
  }
};

const queueOnboardingSave = () => {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => saveOnboardingProgress(), 650);
};

const restoreOnboardingProgress = async () => {
  if (!supabaseClient || !currentUser) return;
  try {
    await ensureProfile();
    const { business, businesses } = await beyondEight.getPrimaryBusiness?.(currentUser.id);
    if (!business) return;
    if (businesses?.length > 1) {
      window.location.href = "/dashboard/?select=1";
      return;
    }
    const bundle = await beyondEight.getBusinessBundle?.(business.id);
    currentBusinessId = business.id;
    const state = bundle?.settings?.generated_content || {};
    applySetupState({
      ...state,
      businessName: business.business_name,
      slug: business.slug,
      businessType: business.business_type,
      tagline: business.tagline,
      whatYouDo: business.description,
      mission: business.mission,
      whyJoin: business.why_join,
      brandVibe: business.brand_vibe,
      theme: business.theme,
      styles: bundle?.settings?.dance_styles || state.styles || [],
      pages: bundle?.settings?.selected_pages || state.pages || []
    });
    setupIndex = Math.min(Math.max(Number(business.current_onboarding_step) || 0, 0), setupSteps.length - 1);
    setupLaunched = Boolean(business.onboarding_completed);
    updateSetupStep();
  } catch (error) {
    console.warn("Supabase restore failed:", error);
    setAuthError("Connected to Supabase. Run supabase-schema.sql in your project to enable saved onboarding.");
  }
};

const themeClassFor = (theme) => {
  const map = {
    "Default Elegant": "generated-elegant",
    "Bold & Edgy": "generated-bold",
    "Soft & Graceful": "generated-soft",
    "Vibrant & Playful": "generated-vibrant",
    "Editorial Elegant": "generated-elegant",
    "Bold Performance": "generated-bold",
    "Soft Contemporary": "generated-soft",
    "Vibrant Bollywood": "generated-vibrant",
    "Classical Heritage": "generated-soft",
    "Urban Commercial": "generated-bold",
    "Minimal Black": "generated-minimal"
  };
  return map[theme] || "generated-elegant";
};

const generatedSiteHTML = (state) => {
  const dancerImage = new URL("assets/dancer-hero.png", window.location.href).href;
  const pages = state.pages.slice(0, 6).map((page) => `<a href="#${page.toLowerCase().replace(/\s+/g, "-")}">${page}</a>`).join("");
  const classTags = state.styles.slice(0, 3).map((style) => `<span>${style}</span>`).join("");
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
    <header><div class="brand">${state.businessName}</div><nav class="nav">${pages}</nav><div class="actions"><button class="btn secondary">Edit Page</button><button class="btn">Admin Dashboard</button><button class="btn secondary" onclick="this.textContent='Logged out';">Log out</button></div></header>
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

const ensureAccountForPublishing = async () => {
  if (currentUser) return currentUser;
  if (!supabaseClient) throw new Error("Supabase could not load. Check your connection and refresh.");
  const validationMessage = validateSetupCredentials();
  if (validationMessage) throw new Error(validationMessage);

  const state = getSetupState();
  const { email, password } = getSetupCredentials();
  const metadata = {
    business_name: state.businessName,
    launch_source: "setup_wizard"
  };

  let authResponse = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: getAuthRedirectUrl()
    }
  });

  if (authResponse.error || !authResponse.data.session) {
    const loginResponse = await supabaseClient.auth.signInWithPassword({ email, password });
    if (loginResponse.error) {
      if (!authResponse.error && !authResponse.data.session) {
        throw new Error("Account created. Please confirm your email, then log in to publish your website.");
      }
      throw new Error("We could not create or log in to that account. If this email already exists, use the correct password.");
    }
    authResponse = loginResponse;
  }

  currentUser = authResponse.data.session?.user || null;
  if (!currentUser) throw new Error("We could not start your signed-in session. Please try again.");
  authReady = true;
  await ensureProfile();
  await updateHeaderForAuth();
  return currentUser;
};

const generateWebsitePreview = () => {
  const state = getSetupState();
  if (generatedSiteUrl?.startsWith("blob:")) URL.revokeObjectURL(generatedSiteUrl);
  generatedSiteUrl = saveLocalPublishedPreview(state);
  viewGeneratedSiteButton?.setAttribute("href", generatedSiteUrl);
  saveGuestSetupDraft();
  return { state, previewUrl: generatedSiteUrl };
};

const finalizeWebsitePublish = async () => {
  if (!(await validateCurrentSlug())) return null;
  const state = getSetupState();
  const launchUser = await ensureAccountForPublishing();
  const result = await beyondEight.publishWebsite?.({
    user: launchUser,
    state,
    stepIndex: setupSteps.length - 1,
    businessId: currentBusinessId
  });
  currentBusinessId = result?.business?.id || currentBusinessId;
  generatedSiteUrl = localPublicNavigationUrl(result?.business?.slug || state.slug);
  viewGeneratedSiteButton?.setAttribute("href", generatedSiteUrl);
  return result;
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
  if (setupSkipButton) setupSkipButton.hidden = setupLaunched || setupIndex !== 1;
  if (setupMessage) setupMessage.textContent = "";
  renderSetupDots();
};

const stepIsValid = async () => {
  const currentStep = setupSteps[setupIndex];
  if (!currentStep) return true;
  const requiredFields = currentStep.querySelectorAll("[required]");
  const validFields = Array.from(requiredFields).every((field) => field.reportValidity());
  if (!validFields) return false;
  if (setupIndex === 0) return validateCurrentSlug();
  return true;
};

const openSetupDirect = (event) => {
  event?.preventDefault();
  setupModal.classList.add("is-open");
  setupModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  updateSetupPreview();
  updateSetupStep();
  setupModal.querySelector("input, button")?.focus();
};

const openSetup = async (event) => {
  event?.preventDefault();
  if (!authReady && supabaseClient) {
    const { data } = await supabaseClient.auth.getSession();
    currentUser = data.session?.user || null;
    authReady = true;
  }
  if (!isAuthenticated()) {
    resetGuestSetup();
    openSetupDirect(event);
    return;
  }
  const route = await beyondEight.routeForUser?.(currentUser).catch(() => null);
  if (route && !route.includes("onboarding=1")) {
    window.location.href = route;
    return;
  }
  await restoreOnboardingProgress();
  openSetupDirect(event);
};

const closeSetup = () => {
  if (setupModal?.classList.contains("is-open") && !currentUser && !setupLaunched) {
    saveGuestSetupDraft({ explicit: true });
  }
  setupModal.classList.remove("is-open");
  setupModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
};

const skipSetupStep = () => {
  if (!setupModal?.classList.contains("is-open")) return;
  setupIndex = Math.min(setupSteps.length - 1, setupIndex + 1);
  updateSetupStep();
  queueOnboardingSave();
};

const completeAuthFlow = async () => {
  restoreGuestSetupDraft();
  await restoreOnboardingProgress();
  closeAuth();
  if (pendingSetupAfterAuth) {
    pendingSetupAfterAuth = false;
    const action = pendingOwnerAction || window.localStorage.getItem(PENDING_OWNER_ACTION_KEY);
    pendingOwnerAction = "";
    if (action === "publish") {
      await publishCurrentSetup();
    } else {
      openSetupDirect();
    }
    return;
  }
  const route = currentUser ? await beyondEight.routeForUser?.(currentUser).catch(() => "/dashboard/") : "/dashboard/";
  window.location.href = route || "/dashboard/";
};

authForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    setAuthError("Supabase could not load. Check your connection and refresh.");
    return;
  }
  const validationMessage = validateAuthForm();
  if (validationMessage) {
    setAuthError(validationMessage);
    return;
  }

  setAuthBusy(true);
  setAuthError("");
  const email = authForm.elements.authEmail.value.trim();
  const password = authForm.elements.authPassword.value;

  try {
    const authResponse =
      authMode === "login"
        ? await supabaseClient.auth.signInWithPassword({ email, password })
        : await supabaseClient.auth.signUp({
            email,
            password,
            options: {
              data: { accepted_terms: true },
              emailRedirectTo: getAuthRedirectUrl()
            }
          });

    if (authResponse.error) throw authResponse.error;

    if (!authResponse.data.session && authMode === "signup") {
      currentUser = null;
      setAuthError("Account created. If email confirmation is enabled, check your inbox before logging in.");
      return;
    }

    currentUser = authResponse.data.session?.user || null;
    await completeAuthFlow();
  } catch (error) {
    setAuthError(error.message || "Supabase could not complete authentication.");
  } finally {
    setAuthBusy(false);
  }
});

authToggle?.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "signup" : "login");
});

authGoogle?.addEventListener("click", async () => {
  if (!supabaseClient) {
    setAuthError("Supabase could not load. Check your connection and refresh.");
    return;
  }
  setAuthBusy(true);
  setAuthError("");
  try {
    if (setupModal?.classList.contains("is-open")) saveGuestSetupDraft();
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthRedirectUrl() }
    });
    if (error) throw error;
  } catch (error) {
    setAuthError(error.message || "Google sign-in is not configured yet in Supabase.");
    setAuthBusy(false);
  }
});

readyGoogleButton?.addEventListener("click", async () => {
  if (!supabaseClient) {
    setupMessage.textContent = "Supabase could not load. Check your connection and refresh.";
    return;
  }
  try {
    saveGuestSetupDraft();
    prepareAuthForOwnerAction("publish");
    setupMessage.textContent = "Opening Google sign-in...";
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthRedirectUrl() }
    });
    if (error) throw error;
  } catch (error) {
    console.warn("Google publish sign-in failed:", error);
    setupMessage.textContent = error.message || "Google sign-in is not configured yet in Supabase.";
  }
});

authForgot?.addEventListener("click", async () => {
  if (!supabaseClient) {
    setAuthError("Supabase could not load. Check your connection and refresh.");
    return;
  }
  const email = authForm?.elements.authEmail?.value.trim();
  if (!email) {
    setAuthError("Enter your email address first.");
    return;
  }
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl()
    });
    if (error) throw error;
    setAuthError("Password reset email requested. Supabase email limits may apply until custom SMTP is connected.");
  } catch (error) {
    setAuthError(error.message || "Could not request a password reset.");
  }
});

const initSupabaseAuth = async () => {
  if (!supabaseClient) {
    setAuthError("Supabase could not load. Check your connection and refresh.");
    authReady = true;
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    currentUser = data.session?.user || null;
    authReady = true;
    if (currentUser) await restoreOnboardingProgress();
    await updateHeaderForAuth();

    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1" && !currentUser) {
      openAuth("login");
    }
    if (params.get("onboarding") === "1" && currentUser) {
      restoreGuestSetupDraft();
      const step = Number(params.get("step"));
      if (!Number.isNaN(step)) setupIndex = Math.min(Math.max(step, 0), setupSteps.length - 1);
      openSetupDirect();
      const authAction = params.get("authAction") || window.localStorage.getItem(PENDING_OWNER_ACTION_KEY);
      if (authAction === "publish") {
        window.setTimeout(() => publishCurrentSetup(), 250);
      }
    }

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      currentUser = session?.user || null;
      if (event === "SIGNED_OUT") {
        currentBusinessId = null;
        setupIndex = 0;
        setupLaunched = false;
        updateSetupStep();
        await updateHeaderForAuth();
        return;
      }
      if (currentUser && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        await restoreOnboardingProgress();
        await updateHeaderForAuth();
        if (pendingSetupAfterAuth && authModal?.classList.contains("is-open")) {
          await completeAuthFlow();
        }
      }
    });
  } catch (error) {
    authReady = true;
    console.warn("Supabase session restore failed:", error);
    setAuthError(error.message || "Supabase session restore failed.");
  }
};

closeAuthButtons.forEach((button) => button.addEventListener("click", closeAuth));
authLoginButtons.forEach((button) => button.addEventListener("click", () => openAuth("login")));
authSignupButtons.forEach((button) => button.addEventListener("click", () => openAuth("signup")));
authLogoutButtons.forEach((button) =>
  button.addEventListener("click", async () => {
    await beyondEight.signOut?.();
    currentUser = null;
    currentBusinessId = null;
    await updateHeaderForAuth();
    window.location.href = "/";
  })
);
openSetupButtons.forEach((button) => button.addEventListener("click", openSetup));
document.addEventListener("click", (event) => {
  if (event.defaultPrevented) return;
  const setupTrigger = event.target.closest?.("[data-open-setup]");
  if (!setupTrigger) return;
  openSetup(event);
});
closeSetupButtons.forEach((button) => button.addEventListener("click", closeSetup));
setupSkipButton?.addEventListener("click", skipSetupStep);
setupPrevButton?.addEventListener("click", () => {
  setupIndex = Math.max(0, setupIndex - 1);
  updateSetupStep();
  queueOnboardingSave();
});
setupNextButton?.addEventListener("click", async () => {
  if (!(await stepIsValid())) return;
  await saveOnboardingProgress();
  setupIndex = Math.min(setupSteps.length - 1, setupIndex + 1);
  updateSetupStep();
  queueOnboardingSave();
});
const showGeneratedPreview = async () => {
  if (!(await validateCurrentSlug())) return;
  try {
    setupMessage.textContent = "Generating your website preview...";
    setupSubmitButton.disabled = true;
    generateWebsitePreview();
    setupLaunched = true;
    updateSetupStep();
    setupMessage.textContent = "Your preview is ready. Create your free account to publish it.";
  } catch (error) {
    console.warn("Website preview failed:", error);
    setupMessage.textContent = error.message || "We could not generate the preview yet. Please check your setup and try again.";
  } finally {
    setupSubmitButton.disabled = false;
  }
};

const publishCurrentSetup = async () => {
  try {
    if (readyPublishButton) readyPublishButton.disabled = true;
    setupMessage.textContent = "Publishing your website...";
    const result = await finalizeWebsitePublish();
    if (!result) return;
    clearGuestSetupDraft();
    setupMessage.textContent = "Your website is live. Opening your dashboard...";
    window.setTimeout(() => {
      window.location.href = "/dashboard/?published=1";
    }, 600);
  } catch (error) {
    console.warn("Website publish failed:", error);
    setupMessage.textContent = error.message || "We could not publish yet. Please check your account details and try again.";
  } finally {
    if (readyPublishButton) readyPublishButton.disabled = false;
  }
};

setupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!(await stepIsValid())) return;
  await showGeneratedPreview();
});
setupSubmitButton?.addEventListener("click", async (event) => {
  event.preventDefault();
  if (!(await stepIsValid())) return;
  await showGeneratedPreview();
});
readyPublishButton?.addEventListener("click", publishCurrentSetup);
viewGeneratedSiteButton?.addEventListener("click", () => {
  generatedSiteUrl = saveLocalPublishedPreview(getSetupState());
  viewGeneratedSiteButton.setAttribute("href", generatedSiteUrl);
});
specialtyInput?.addEventListener("keydown", (event) => {
  const suggestionButtons = Array.from(specialtySuggestions?.querySelectorAll("[data-add-specialty]") || []);
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (!suggestionButtons.length) return;
    const direction = event.key === "ArrowDown" ? 1 : -1;
    activeSpecialtyIndex = (activeSpecialtyIndex + direction + suggestionButtons.length) % suggestionButtons.length;
    renderSpecialties();
    return;
  }
  if (event.key === "Escape") {
    activeSpecialtyIndex = -1;
    if (specialtySuggestions) specialtySuggestions.hidden = true;
    specialtyInput.setAttribute("aria-expanded", "false");
    return;
  }
  if (event.key !== "Enter") return;
  event.preventDefault();
  const activeButton = activeSpecialtyIndex >= 0 ? suggestionButtons[activeSpecialtyIndex] : suggestionButtons[0];
  addSpecialty(activeButton?.dataset.addSpecialty || specialtyInput.value);
});
specialtySuggestions?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-specialty]");
  if (!button) return;
  addSpecialty(button.dataset.addSpecialty);
});
specialtyTags?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-specialty]");
  if (!button) return;
  removeSpecialty(button.dataset.removeSpecialty);
});
logoUploadTrigger?.addEventListener("click", () => {
  logoUploadInput?.click();
});
logoUploadInput?.addEventListener("change", async () => {
  const file = logoUploadInput.files?.[0];
  if (!file) return;
  logoImageFileName = file.name;
  if (setupMessage) setupMessage.textContent = `Preparing ${file.name}...`;
  if (!file.type.startsWith("image/")) {
    if (setupMessage) setupMessage.textContent = "Please choose an image file for your logo.";
    return;
  }
  try {
    logoImageDataUrl = await resizeLogoImage(file);
    updateSetupPreview();
    updateLogoUploadState();
    saveGuestSetupDraft();
    queueOnboardingSave();
    if (setupMessage) setupMessage.textContent = "Logo image added to your website preview.";
  } catch (error) {
    console.warn("Logo preview failed:", error);
    logoImageDataUrl = "";
    logoImageFileName = "";
    updateSetupPreview();
    if (setupMessage) setupMessage.textContent = error.message || "We could not use that logo image. Please try another file.";
  }
});
logoUploadInput?.addEventListener("click", () => {
  logoUploadInput.value = "";
});
setupForm?.addEventListener("input", () => {
  const businessNameField = setupForm?.elements.businessName;
  const slugField = setupForm?.elements.businessSlug;
  if (document.activeElement === specialtyInput) {
    activeSpecialtyIndex = -1;
    renderSpecialties();
    updateSetupPreview();
    return;
  }
  if (document.activeElement === slugField) {
    slugManuallyEdited = true;
    slugField.value = beyondEight.slugify?.(slugField.value) || "";
    scheduleSlugValidation();
  }
  if (document.activeElement === businessNameField && slugField && !slugManuallyEdited) {
    slugField.value = beyondEight.slugify?.(businessNameField?.value) || "";
    scheduleSlugValidation();
  }
  updateSetupPreview();
  queueOnboardingSave();
});
setupForm?.addEventListener("change", () => {
  updateSetupPreview();
  validateCurrentSlug();
  queueOnboardingSave();
});
initSupabaseAuth();
updateSetupStep();
updateSetupPreview();
renderSpecialties();

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
