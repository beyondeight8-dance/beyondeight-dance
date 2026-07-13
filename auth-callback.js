(async function () {
  const app = window.BeyondEight;
  const status = document.querySelector(".route-loading p");
  const show = (message) => {
    if (status) status.textContent = message;
  };

  try {
    if (!app?.client) throw new Error("Supabase is not available.");
    show("Confirming your secure session...");
    let user = await app.getSessionUser();
    for (let attempt = 0; !user && attempt < 10; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      user = await app.getSessionUser();
    }

    if (!user) {
      window.location.replace("/");
      return;
    }

    show("Preparing your profile...");
    await app.ensureProfile(user);
    const pendingOwnerAction = window.localStorage.getItem("beyondeight.pendingOwnerAction");
    if (pendingOwnerAction) {
      window.location.replace(`/?onboarding=1&authAction=${encodeURIComponent(pendingOwnerAction)}`);
      return;
    }
    show("Loading your workspace...");
    const destination = await app.routeForUser(user);
    window.location.replace(destination);
  } catch (error) {
    console.warn("Auth callback failed:", error);
    show("We could not finish sign in. Sending you back to the homepage.");
    window.setTimeout(() => window.location.replace("/?login=1"), 1200);
  }
})();
