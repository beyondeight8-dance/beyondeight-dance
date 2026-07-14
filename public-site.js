(async function () {
  const app = window.BeyondEight;
  const root = document.querySelector("[data-public-site-root]");
  const esc = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const params = new URLSearchParams(window.location.search);
  const querySlug = params.get("slug");
  const slug = querySlug || window.location.pathname.split("/").filter(Boolean)[0];
  const LOCAL_PUBLISHED_SITES_KEY = "beyondeight.localPublishedSites";

  const themeClass = (theme = "") =>
    ({
      "Bold & Edgy": "generated-bold",
      "Soft & Graceful": "generated-soft",
      "Vibrant & Playful": "generated-vibrant",
      "Minimal Black": "generated-minimal"
    })[theme] || "generated-elegant";

  try {
    if (!slug || app.reservedSlugs?.has(slug)) {
      root.innerHTML = `<section class="route-loading"><h1>Page not found.</h1><p>This BeyondEight page does not exist.</p><a class="primary-button" href="/">Go home</a></section>`;
      return;
    }

    if (querySlug && window.location.pathname.includes("404.html")) {
      window.history.replaceState({}, "", `/${slug}`);
    }

    const localSites = JSON.parse(window.localStorage.getItem(LOCAL_PUBLISHED_SITES_KEY) || "{}");
    const bundle = localSites[slug] || (await app.getBusinessBundleBySlug(slug));
    if (!bundle) {
      root.innerHTML = `<section class="route-loading"><h1>Website not published yet.</h1><p>This BeyondEight site is private or unavailable.</p><a class="primary-button" href="/">Go home</a></section>`;
      return;
    }

    const { business, settings, pages } = bundle;
    const currentUser = await app.getSessionUser?.().catch(() => null);
    const isOwner = Boolean(currentUser && business.owner_user_id && currentUser.id === business.owner_user_id);
    const selectedPages = new Set((pages || []).map((page) => page.title));
    const styles = settings?.dance_styles || [];
    const generatedContent = settings?.generated_content || {};
    const logoUrl = business.logo_url || generatedContent.logoUrl || generatedContent.logoImage || "";
    document.body.classList.add(themeClass(business.theme));
    document.title = `${business.business_name} | BeyondEight`;
    root.innerHTML = `
      ${
        isOwner
          ? `<div class="owner-toolbar" data-owner-toolbar>
              <strong>BeyondEight</strong>
              <span>Viewing as Owner</span>
              <a href="/dashboard/website/?business=${esc(business.id)}">Edit Website</a>
              <a href="/dashboard/">Dashboard</a>
              <button type="button" data-owner-visitor>View as Visitor</button>
            </div>`
          : ""
      }
      <div class="published-site">
        <header class="published-header">
          <strong class="published-logo">${logoUrl ? `<img src="${esc(logoUrl)}" alt="">` : ""}<span>${esc(business.business_name)}</span></strong>
          <nav>${[...selectedPages].slice(0, 6).map((page) => `<a href="#${app.slugify(page)}">${esc(page)}</a>`).join("")}</nav>
        </header>
        <section class="published-hero">
          <div>
            <p class="eyebrow">${esc(business.theme || "BeyondEight")}</p>
            <h1>${esc(business.tagline || business.business_name)}</h1>
            <p>${esc(business.description || "A dance business powered by BeyondEight.")}</p>
            <div class="published-tags">${styles.map((style) => `<span>${esc(style)}</span>`).join("")}</div>
            ${selectedPages.has("Register") ? `<a class="primary-button" href="#register">Register now</a>` : ""}
          </div>
          <img src="/assets/dancer-hero.png" alt="">
        </section>
        ${selectedPages.has("About") ? `<section id="about" class="published-section"><h2>About ${esc(business.business_name)}</h2><p>${esc(business.mission || "")}</p></section>` : ""}
        ${selectedPages.has("Classes") || selectedPages.has("Events") ? `<section id="classes" class="published-cards"><article><h3>Signature Series</h3><p>Technique, confidence, and choreography in a polished class experience.</p></article><article><h3>Workshop Launch</h3><p>Book upcoming workshops and intensives through a focused registration flow.</p></article></section>` : ""}
        <section id="register" class="published-section"><h2>Ready to dance with us?</h2><p>${esc(business.why_join || "Join our next class or workshop.")}</p><a class="primary-button" href="mailto:hello@example.com">Contact us</a></section>
        <footer class="published-footer">${esc(business.business_name)} · Built with BeyondEight</footer>
      </div>`;
    root.querySelector("[data-owner-visitor]")?.addEventListener("click", () => {
      root.querySelector("[data-owner-toolbar]")?.remove();
    });
  } catch (error) {
    console.warn("Public site failed:", error);
    root.innerHTML = `<section class="route-loading"><h1>We could not load this website.</h1><p>Please try again soon.</p><a class="primary-button" href="/">Go home</a></section>`;
  }
})();
