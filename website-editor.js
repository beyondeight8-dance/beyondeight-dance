(async function () {
  const app = window.BeyondEight;
  const root = document.querySelector("[data-editor-root]");
  const esc = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);

  const stateFromForm = (form, business, settings) => ({
    businessId: business.id,
    businessName: form.businessName.value.trim(),
    slug: business.slug,
    businessType: business.business_type || "Independent Choreographer",
    tagline: form.tagline.value.trim(),
    whatYouDo: form.description.value.trim(),
    mission: form.mission.value.trim(),
    whyJoin: form.whyJoin.value.trim(),
    brandVibe: business.brand_vibe || "Elegant",
    theme: form.theme.value,
    styles: settings?.dance_styles || [],
    pages: [...form.querySelectorAll('input[name="pages"]:checked')].map((input) => input.value),
    instagram: form.instagram.value.trim(),
    tiktok: form.tiktok.value.trim(),
    youtube: form.youtube.value.trim(),
    website: form.website.value.trim()
  });

  try {
    const user = await app.getSessionUser();
    if (!user) {
      window.location.replace("/?login=1");
      return;
    }
    const businesses = await app.listAccessibleBusinesses(user.id);
    const businessId = new URLSearchParams(window.location.search).get("business");
    const business = businesses.find((item) => item.id === businessId) || businesses[0];
    if (!business) {
      window.location.replace("/dashboard/?onboarding=1");
      return;
    }
    const bundle = await app.getBusinessBundle(business.id);
    const settings = bundle.settings || {};
    const social = settings.social_links || {};
    const selectedPages = new Set(settings.selected_pages || ["Home", "About", "Classes", "Register", "Contact"]);

    root.innerHTML = `
      <section class="dashboard-hero">
        <p class="eyebrow">Website editor</p>
        <h1>Edit ${esc(business.business_name)}</h1>
        <p>Save drafts, preview the public page, and publish changes when ready.</p>
      </section>
      <form class="editor-layout" data-editor-form>
        <section class="editor-panel">
          <label>Business name<input name="businessName" value="${esc(business.business_name)}" required></label>
          <label>Tagline<input name="tagline" value="${esc(business.tagline || "")}"></label>
          <label>Description<textarea name="description">${esc(business.description || "")}</textarea></label>
          <label>Mission<textarea name="mission">${esc(business.mission || "")}</textarea></label>
          <label>Why join<textarea name="whyJoin">${esc(business.why_join || "")}</textarea></label>
          <label>Theme<select name="theme">
            ${["Default Elegant", "Bold & Edgy", "Soft & Graceful", "Vibrant & Playful", "Minimal Black"]
              .map((theme) => `<option ${theme === business.theme ? "selected" : ""}>${theme}</option>`)
              .join("")}
          </select></label>
          <div class="editor-checks">
            ${["Home", "About", "Classes", "Events", "Register", "Gallery", "Team", "FAQ", "Contact"]
              .map((page) => `<label><input type="checkbox" name="pages" value="${page}" ${selectedPages.has(page) ? "checked" : ""}>${page}</label>`)
              .join("")}
          </div>
          <label>Instagram<input name="instagram" value="${esc(social.instagram || "")}"></label>
          <section class="instagram-editor-card" data-instagram-controls>
            <div>
              <span>Instagram Feed</span>
              <strong data-instagram-status>Checking connection...</strong>
              <p data-instagram-help>Connect a Creator or Business account to show your latest posts automatically.</p>
            </div>
            <div class="instagram-editor-settings" data-instagram-settings hidden>
              <label><input type="checkbox" data-instagram-visible checked> Show Instagram on website</label>
              <label>Number of posts<select data-instagram-limit><option value="4">4</option><option value="6" selected>6</option></select></label>
            </div>
            <div class="dashboard-actions">
              <button class="secondary-button" type="button" data-instagram-connect>Connect Instagram</button>
              <button class="secondary-button" type="button" data-instagram-refresh hidden>Refresh Feed</button>
              <button class="secondary-button" type="button" data-instagram-disconnect hidden>Disconnect</button>
            </div>
            <small data-instagram-message></small>
          </section>
          <label>TikTok<input name="tiktok" value="${esc(social.tiktok || "")}"></label>
          <label>YouTube<input name="youtube" value="${esc(social.youtube || "")}"></label>
          <label>Website<input name="website" value="${esc(social.website || "")}"></label>
          <p class="setup-message" data-editor-message></p>
          <div class="dashboard-actions">
            <button class="secondary-button" type="button" data-save-draft>Save draft</button>
            <a class="secondary-button" href="/${business.slug}" target="_blank" rel="noopener">Preview</a>
            <button class="primary-button" type="button" data-publish>Publish changes</button>
          </div>
        </section>
        <aside class="editor-preview" data-editor-preview aria-label="Live website preview"></aside>
      </form>`;

    const form = root.querySelector("[data-editor-form]");
    const message = root.querySelector("[data-editor-message]");
    const templates = window.BeyondEightWebsiteTemplates;
    const updatePreview = async () => {
      const preview = root.querySelector("[data-editor-preview]");
      if (!templates || !preview) return;
      const content = templates.buildWebsiteContent(stateFromForm(form, business, settings));
      preview.innerHTML = `<div class="setup-preview-site" data-theme-key="${templates.themeKeyFor(content.theme.name)}">${templates.renderDesktopPreview(content)}</div>`;
      const mount = preview.querySelector("[data-instagram-feed]");
      if (mount) {
        fetch(`/api/instagram/feed?businessId=${encodeURIComponent(business.id)}`)
          .then((response) => (response.ok ? response.json() : { items: [] }))
          .then((feed) => (mount.innerHTML = templates.renderInstagramSection(feed)))
          .catch(() => mount.replaceChildren());
      }
    };
    form.addEventListener("input", updatePreview);
    form.addEventListener("change", updatePreview);
    updatePreview();

    const instagramStatus = root.querySelector("[data-instagram-status]");
    const instagramHelp = root.querySelector("[data-instagram-help]");
    const instagramSettings = root.querySelector("[data-instagram-settings]");
    const instagramVisible = root.querySelector("[data-instagram-visible]");
    const instagramLimit = root.querySelector("[data-instagram-limit]");
    const instagramConnect = root.querySelector("[data-instagram-connect]");
    const instagramRefresh = root.querySelector("[data-instagram-refresh]");
    const instagramDisconnect = root.querySelector("[data-instagram-disconnect]");
    const instagramMessage = root.querySelector("[data-instagram-message]");
    const apiRequest = async (url, options = {}) => {
      const { data } = await app.client.auth.getSession();
      const response = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}`, ...(options.headers || {}) }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Instagram request failed.");
      return payload;
    };
    const showInstagramState = (status = {}) => {
      const connected = Boolean(status.connected);
      instagramStatus.textContent = connected ? `Connected as @${status.username}` : "Not connected";
      instagramHelp.textContent = status.needsReconnect
        ? "Your connection needs attention. Reconnect Instagram to resume updates."
        : connected
          ? "Your latest posts are cached securely and shown on your public website."
          : "Connection requires an Instagram Creator or Business account.";
      instagramSettings.hidden = !connected;
      instagramRefresh.hidden = !connected;
      instagramDisconnect.hidden = !connected;
      instagramConnect.textContent = connected ? "Reconnect" : "Connect Instagram";
      instagramVisible.checked = status.showOnWebsite !== false;
      instagramLimit.value = String(status.postLimit || 6);
    };
    const loadInstagramState = async () => {
      try {
        showInstagramState(await apiRequest(`/api/instagram/manage?businessId=${encodeURIComponent(business.id)}`));
      } catch (error) {
        instagramStatus.textContent = "Connection unavailable";
        instagramMessage.textContent = error.message;
      }
    };
    instagramConnect.addEventListener("click", async () => {
      try {
        instagramMessage.textContent = "Opening Instagram...";
        const payload = await apiRequest("/api/instagram/connect", { method: "POST", body: JSON.stringify({ businessId: business.id }) });
        window.location.assign(payload.authorizationUrl);
      } catch (error) {
        instagramMessage.textContent = error.message;
      }
    });
    instagramRefresh.addEventListener("click", async () => {
      instagramMessage.textContent = "Refreshing...";
      try {
        showInstagramState(await apiRequest("/api/instagram/manage", { method: "POST", body: JSON.stringify({ businessId: business.id, action: "refresh" }) }));
        instagramMessage.textContent = "Feed refreshed.";
        updatePreview();
      } catch (error) {
        instagramMessage.textContent = "We could not refresh right now. Your cached posts remain live.";
      }
    });
    const saveInstagramSettings = async () => {
      try {
        showInstagramState(await apiRequest("/api/instagram/manage", {
          method: "POST",
          body: JSON.stringify({ businessId: business.id, action: "settings", showOnWebsite: instagramVisible.checked, postLimit: Number(instagramLimit.value) })
        }));
        instagramMessage.textContent = "Instagram settings saved.";
        updatePreview();
      } catch (error) {
        instagramMessage.textContent = error.message;
      }
    };
    instagramVisible.addEventListener("change", saveInstagramSettings);
    instagramLimit.addEventListener("change", saveInstagramSettings);
    instagramDisconnect.addEventListener("click", async () => {
      if (!window.confirm("Disconnect Instagram and remove the automatic feed from your website?")) return;
      try {
        showInstagramState(await apiRequest("/api/instagram/manage", { method: "POST", body: JSON.stringify({ businessId: business.id, action: "disconnect" }) }));
        instagramMessage.textContent = "Instagram disconnected.";
        updatePreview();
      } catch (error) {
        instagramMessage.textContent = error.message;
      }
    });
    const instagramResult = new URLSearchParams(window.location.search).get("instagram");
    if (instagramResult === "connected") instagramMessage.textContent = "Instagram connected.";
    if (instagramResult === "professional_required") instagramMessage.textContent = "Instagram connection currently requires a Creator or Business account. You can convert in Instagram settings.";
    if (["cancelled", "failed", "invalid", "expired"].includes(instagramResult)) instagramMessage.textContent = "Instagram was not connected. Your website is unchanged.";
    loadInstagramState();

    root.querySelector("[data-save-draft]").addEventListener("click", async () => {
      message.textContent = "Saving draft...";
      await app.saveOnboarding({ user, state: stateFromForm(form, business, settings), stepIndex: 7, businessId: business.id, launched: false });
      message.textContent = "Draft saved.";
    });

    root.querySelector("[data-publish]").addEventListener("click", async () => {
      message.textContent = "Publishing changes...";
      await app.publishWebsite({ user, state: stateFromForm(form, business, settings), stepIndex: 7, businessId: business.id });
      message.textContent = "Published. Your public website is updated.";
    });
  } catch (error) {
    console.warn("Website editor failed:", error);
    root.innerHTML = `<section class="route-loading"><h1>We could not load the editor.</h1><p>Please refresh or return to your dashboard.</p><a class="primary-button" href="/dashboard/">Dashboard</a></section>`;
  }
})();
