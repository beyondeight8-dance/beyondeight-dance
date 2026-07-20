(async function () {
  const app = window.BeyondEight;
  const root = document.querySelector("[data-public-site-root]");
  const esc = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const params = new URLSearchParams(window.location.search);
  const querySlug = params.get("slug");
  const slug = querySlug || window.location.pathname.split("/").filter(Boolean)[0];
  const LOCAL_PUBLISHED_SITES_KEY = "beyondeight.localPublishedSites";

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

    const { business, settings, website, pages } = bundle;
    const currentUser = await app.getSessionUser?.().catch(() => null);
    const isOwner = Boolean(currentUser && business.owner_user_id && currentUser.id === business.owner_user_id);
    const generatedContent = settings?.generated_content || {};
    const logoUrl = business.logo_url || generatedContent.logoUrl || generatedContent.logoImage || "";
    if (window.BeyondEightWebsiteTemplates) {
      const templates = window.BeyondEightWebsiteTemplates;
      const sharedContent = templates.buildWebsiteContent({ business, settings, website, pages, origin: window.location.origin });
      document.body.classList.remove("generated-elegant", "generated-bold", "generated-soft", "generated-vibrant", "generated-minimal");
      document.body.classList.add(templates.themeClassFor(sharedContent.theme.name));
      document.title = `${sharedContent.brandName} | BeyondEight`;
      const ownerToolbar = isOwner
        ? `<div class="owner-toolbar" data-owner-toolbar>
            <strong>BeyondEight</strong>
            <span>Viewing as Owner</span>
            <a href="/dashboard/website/?business=${esc(business.id)}">Edit Website</a>
            <a href="/dashboard/">Dashboard</a>
            <button type="button" data-owner-visitor>View as Visitor</button>
          </div>`
        : "";
      root.innerHTML = templates.renderPublicSite(sharedContent, { ownerToolbar, logoUrl });
      root.querySelector("[data-owner-visitor]")?.addEventListener("click", () => {
        root.querySelector("[data-owner-toolbar]")?.remove();
      });
      return;
    }
    root.innerHTML = `<section class="route-loading"><h1>We could not load this website.</h1><p>The shared BeyondEight template system did not load. Please refresh and try again.</p><a class="primary-button" href="/">Go home</a></section>`;
    return;
  } catch (error) {
    console.warn("Public site failed:", error);
    root.innerHTML = `<section class="route-loading"><h1>We could not load this website.</h1><p>Please try again soon.</p><a class="primary-button" href="/">Go home</a></section>`;
  }
})();
