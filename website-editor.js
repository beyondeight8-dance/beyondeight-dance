(async function () {
  const app = window.BeyondEight;
  const root = document.querySelector("[data-editor-root]");
  try {
    const user = await app.getSessionUser();
    if (!user) { const returnTo = "/dashboard/website/"; window.localStorage.setItem("beyondeight.authReturnTo", returnTo); window.location.replace(`/?login=1&returnTo=${encodeURIComponent(returnTo)}`); return; }
    window.location.replace("/dashboard/?view=website");
  } catch (error) {
    console.warn("Website editor handoff failed:", error);
    root.innerHTML = `<section class="route-loading"><h1>We could not open your website editor.</h1><p>Please return to the dashboard and try again.</p><a class="primary-button" href="/dashboard/">Dashboard</a></section>`;
  }
})();
