(async function () {
  const app = window.BeyondEight;
  const root = document.querySelector("[data-editor-root]");
  const esc = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);

  const stateFromForm = (form, business, settings) => ({
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
      window.location.replace("/?onboarding=1");
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
        <aside class="editor-preview">
          <span>${esc(business.theme || "Default Elegant")}</span>
          <h2 data-preview-title>${esc(business.tagline || business.business_name)}</h2>
          <p data-preview-description>${esc(business.description || "Your public website preview updates as you edit.")}</p>
        </aside>
      </form>`;

    const form = root.querySelector("[data-editor-form]");
    const message = root.querySelector("[data-editor-message]");
    const updatePreview = () => {
      root.querySelector("[data-preview-title]").textContent = form.tagline.value || form.businessName.value;
      root.querySelector("[data-preview-description]").textContent = form.description.value;
    };
    form.addEventListener("input", updatePreview);

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
