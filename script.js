const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const demoForm = document.querySelector(".demo-form");
const formMessage = document.querySelector(".form-message");
const comparisonModal = document.querySelector(".comparison-modal");
const openComparisonButton = document.querySelector("[data-open-comparison]");
const closeComparisonButtons = document.querySelectorAll("[data-close-comparison]");
const heroMockup = document.querySelector(".dashboard-mockup");
const heroView = document.querySelector("[data-hero-view]");
const heroNavItems = document.querySelectorAll("[data-hero-nav]");
const productTabs = document.querySelectorAll("[data-product-tab]");
const productPanels = document.querySelectorAll("[data-product-panel]");
const revealItems = document.querySelectorAll(
  ".section-heading, .hero-copy, .hero-proof span, .dashboard-mockup, .workflow-card, .steps-grid article, .dance-visual, .product-tabs, .product-platform, .price-card, .demo-copy, .demo-form"
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

const renderHeroView = (index) => {
  if (!heroView) return;
  const view = heroViews[index];
  heroView.classList.add("is-changing");
  window.setTimeout(() => {
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
  }, 3800);
};

renderHeroView(heroIndex);
startHeroRotation();

heroMockup?.addEventListener("mouseenter", () => window.clearInterval(heroTimer));
heroMockup?.addEventListener("mouseleave", startHeroRotation);

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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && comparisonModal?.classList.contains("is-open")) {
    closeComparison();
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
