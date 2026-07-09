const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const demoForm = document.querySelector(".demo-form");
const formMessage = document.querySelector(".form-message");
const comparisonModal = document.querySelector(".comparison-modal");
const openComparisonButton = document.querySelector("[data-open-comparison]");
const closeComparisonButtons = document.querySelectorAll("[data-close-comparison]");
const revealItems = document.querySelectorAll(
  ".section-heading, .hero-proof span, .before-stack div, .problem-grid article, .feature-card, .flow-heading, .flow-step, .workflow-copy, .dashboard-panel, .price-card, .demo-copy, .demo-form"
);

navToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

siteNav.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
  }
});

demoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent = "Thanks. Your BeyondEight demo request is ready to send.";
  demoForm.reset();
});

const openComparison = () => {
  comparisonModal.classList.add("is-open");
  comparisonModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
};

const closeComparison = () => {
  comparisonModal.classList.remove("is-open");
  comparisonModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
};

openComparisonButton.addEventListener("click", openComparison);
closeComparisonButtons.forEach((button) => button.addEventListener("click", closeComparison));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && comparisonModal.classList.contains("is-open")) {
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
