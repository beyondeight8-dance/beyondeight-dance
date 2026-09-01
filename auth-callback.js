(async function () {
  const app = window.BeyondEight;
  const status = document.querySelector(".route-loading p");
  const retry = document.querySelector("[data-auth-retry]");
  const GUEST_SETUP_KEY = "beyondeight.guestWebsiteDraft";
  const PENDING_OWNER_ACTION_KEY = "beyondeight.pendingOwnerAction";
  const AUTH_RETURN_TO_KEY = "beyondeight.authReturnTo";
  const show = (message) => {
    if (status) status.textContent = message;
  };

  const readGuestDraft = () => {
    try {
      const draft = JSON.parse(window.localStorage.getItem(GUEST_SETUP_KEY) || "null");
      return draft?.state ? draft : null;
    } catch (error) {
      console.warn("Saved website draft could not be read:", error);
      return null;
    }
  };

  const safeReturnTo = () => {
    const value = window.localStorage.getItem(AUTH_RETURN_TO_KEY) || "";
    window.localStorage.removeItem(AUTH_RETURN_TO_KEY);
    return value.startsWith("/dashboard") ? value : "";
  };

  try {
    if (!app?.client) throw new Error("Supabase is not available.");
    show("Confirming your secure session...");
    const session = await app.resolveAuthCallbackSession();
    const user = session?.user;
    if (!user) throw new Error("No authenticated Google user was returned.");

    show("Preparing your profile...");
    await app.ensureProfile(user);
    const pendingOwnerAction = window.localStorage.getItem("beyondeight.pendingOwnerAction");
    const guestDraft = readGuestDraft();
    if (pendingOwnerAction === "publish" && !guestDraft) {
      throw new Error("Your saved website draft could not be found on this device.");
    }
    if (pendingOwnerAction === "publish" && guestDraft) {
      show("Publishing your website...");
      const result = await app.publishWebsite({
        user,
        state: guestDraft.state,
        stepIndex: Number(guestDraft.stepIndex) || 0,
        businessId: null
      });
      window.localStorage.removeItem(GUEST_SETUP_KEY);
      window.localStorage.removeItem(PENDING_OWNER_ACTION_KEY);
      window.localStorage.removeItem(AUTH_RETURN_TO_KEY);
      window.location.replace("/dashboard/?published=1");
      return;
    }

    window.localStorage.removeItem(PENDING_OWNER_ACTION_KEY);
    show("Loading your workspace...");
    const destination = safeReturnTo() || (await app.routeForUser(user));
    window.location.replace(destination);
  } catch (error) {
    console.warn("Auth callback failed:", error);
    show("We couldn't complete your sign-in. Your website draft is still safe on this device.");
    if (retry) retry.hidden = false;
  }
})();
