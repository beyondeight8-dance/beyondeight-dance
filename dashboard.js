(async function () {
  const app = window.BeyondEight;
  const root = document.querySelector("[data-dashboard-root]");
  const logout = document.querySelector("[data-dashboard-logout]");

  const esc = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);

  const publicUrl = (business) => `${window.location.origin}/${business.slug}`;
  const displayName = (user) =>
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "there";

  const renderWorkspaceSelector = (businesses) => {
    root.innerHTML = `
      <section class="dashboard-hero">
        <p class="eyebrow">Workspace selector</p>
        <h1>Choose your dance business.</h1>
        <p>Select the workspace you want to manage today.</p>
      </section>
      <section class="dashboard-grid">
        ${businesses
          .map(
            (business) => `
              <article class="dashboard-card">
                <h2>${esc(business.business_name)}</h2>
                <p>${esc(business.tagline || "Website workspace")}</p>
                <a class="primary-button" href="/dashboard/?business=${business.id}">Open workspace</a>
              </article>`
          )
          .join("")}
      </section>`;
  };

  const renderDashboard = async (business, businesses, user) => {
    if (!business) {
      root.innerHTML = `
        <section class="dashboard-hero">
          <p class="eyebrow">Private workspace</p>
          <h1>Continue building your website.</h1>
          <p>Welcome back, ${esc(displayName(user))}. Your account is ready. Start onboarding to create your BeyondEight website and dashboard.</p>
          <a class="primary-button" href="/?onboarding=1&app=1">Begin onboarding</a>
        </section>`;
      return;
    }

    if (businesses.length > 1 && new URLSearchParams(window.location.search).get("select") === "1") {
      renderWorkspaceSelector(businesses);
      return;
    }

    const bundle = await app.getBusinessBundle(business.id);
    const website = bundle.website;
    const isPublished = Boolean(website?.published);
    const continueHref = business.onboarding_completed ? `/dashboard/website/?business=${business.id}` : `/?onboarding=1&app=1&business=${business.id}&step=${business.current_onboarding_step || 0}`;

    root.innerHTML = `
      <section class="dashboard-hero">
        <p class="eyebrow">Owner dashboard</p>
        <h1>Welcome back, ${esc(displayName(user))}.</h1>
        <p>${business.onboarding_completed ? `Manage ${esc(business.business_name)} from one private workspace.` : `Continue building ${esc(business.business_name)}. Your progress is saved as you go.`}</p>
        ${!business.onboarding_completed ? `<a class="primary-button" href="${continueHref}">Continue Building Your Website</a>` : ""}
      </section>
      <section class="dashboard-overview">
        <article class="dashboard-card dashboard-status">
          <span>Status</span>
          <strong>${isPublished ? "Published" : "Draft"}</strong>
          <p>${isPublished ? `Your public URL is ${esc(publicUrl(business))}` : "Launch your site when onboarding is complete."}</p>
          <div class="dashboard-actions">
            <a class="primary-button" href="/${business.slug}" target="_blank" rel="noopener">View Website</a>
            <a class="secondary-button" href="/dashboard/website/?business=${business.id}">Edit Website</a>
          </div>
        </article>
        <article class="dashboard-card">
          <span>Theme</span>
          <strong>${esc(business.theme || "Editorial Elegant")}</strong>
          <p>${esc((bundle.settings?.selected_pages || []).length || "0")} pages selected.</p>
        </article>
        <article class="dashboard-card">
          <span>Public URL</span>
          <strong>/${esc(business.slug)}</strong>
          <p>${esc(publicUrl(business))}</p>
        </article>
      </section>
      <section class="dashboard-card dashboard-payments-card">
        <div>
          <span>Payments</span>
          <strong>How do you collect payments today?</strong>
          <p>Choose the methods you already use. Stripe can be connected later as an upgrade when you are ready for automated checkout.</p>
        </div>
        <div class="payment-method-grid" aria-label="Payment methods">
          ${["Venmo", "Zelle", "PayPal", "Stripe", "Cash", "Bank Transfer", "Other"]
            .map((item) => `<button type="button" class="${item === "Stripe" ? "is-upgrade" : ""}">${item}<small>${item === "Stripe" ? "Later upgrade" : "Available now"}</small></button>`)
            .join("")}
        </div>
        <label class="venmo-field">Venmo username<input type="text" placeholder="@yourname" aria-label="Venmo username"></label>
      </section>
      <section class="dashboard-tools">
        ${["Classes", "Registrations", "Students", "Payments", "Analytics", "Marketing", "Settings"]
          .map((item) => `<button type="button">${item}<small>Coming next</small></button>`)
          .join("")}
      </section>`;
  };

  try {
    if (!app?.client) throw new Error("Supabase is not available.");
    const user = await app.getSessionUser();
    if (!user) {
      const intendedRoute = `${window.location.pathname}${window.location.search}`;
      window.localStorage.setItem("beyondeight.authReturnTo", intendedRoute);
      window.location.replace(`/?login=1&returnTo=${encodeURIComponent(intendedRoute)}`);
      return;
    }
    await app.ensureProfile(user);
    const businesses = await app.listAccessibleBusinesses(user.id);
    const requestedBusinessId = new URLSearchParams(window.location.search).get("business");
    const business = businesses.find((item) => item.id === requestedBusinessId) || businesses[0] || null;
    await renderDashboard(business, businesses, user);
  } catch (error) {
    console.warn("Dashboard failed:", error);
    root.innerHTML = `<section class="route-loading"><h1>We could not load your dashboard.</h1><p>Please refresh or sign in again.</p><a class="primary-button" href="/">Back home</a></section>`;
  }

  logout?.addEventListener("click", async () => {
    await app.signOut();
    window.location.replace("/");
  });
})();
