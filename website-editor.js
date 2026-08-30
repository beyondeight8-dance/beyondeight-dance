(async function () {
  const app = window.BeyondEight;
  const root = document.querySelector("[data-editor-root]");
  try {
    const user = await app.getSessionUser();
    if (!user) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.localStorage.setItem("beyondeight.authReturnTo", returnTo);
      window.location.replace(`/?login=1&returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    const businesses = await app.listAccessibleBusinesses(user.id);
    const businessId = new URLSearchParams(window.location.search).get("business");
    const business = businesses.find((item) => item.id === businessId) || businesses[0];
    if (!business) {
      window.location.replace("/?onboarding=1&app=1");
      return;
    }
    window.location.replace(`/${encodeURIComponent(business.slug)}?owner=1&edit=classes`);
  } catch (error) {
    console.warn("Website editor handoff failed:", error);
    root.innerHTML = `<section class="route-loading"><h1>We could not open your website editor.</h1><p>Please return to the dashboard and try again.</p><a class="primary-button" href="/dashboard/">Dashboard</a></section>`;
  }
})();
