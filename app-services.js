(function () {
  const config = window.BeyondEightConfig || {};
  const sdk = window.supabase || globalThis.supabase || (typeof supabase !== "undefined" ? supabase : null);
  const reservedSlugs = new Set([
    "admin",
    "app",
    "api",
    "auth",
    "login",
    "signup",
    "register",
    "dashboard",
    "settings",
    "support",
    "pricing",
    "about",
    "contact",
    "terms",
    "privacy",
    "www"
  ]);

  const client = sdk?.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  const slugify = (value = "") =>
    value
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);

  const validSlug = (value) => {
    const slug = slugify(value);
    if (slug.length < 3) return { valid: false, slug, message: "Use at least 3 characters." };
    if (reservedSlugs.has(slug)) return { valid: false, slug, message: "That URL is reserved." };
    return { valid: true, slug, message: "Available format." };
  };

  const pageSlug = (page = "") => slugify(page) || "page";

  const dataUrlToFile = (dataUrl) => {
    if (!dataUrl || !dataUrl.startsWith("data:")) return null;
    const [header, payload = ""] = dataUrl.split(",");
    const mime = header.match(/^data:([^;]+)/)?.[1] || "image/png";
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return { blob: new Blob([bytes], { type: mime }), mime };
  };

  const extensionForMime = (mime = "") =>
    ({
      "image/gif": "gif",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/svg+xml": "svg",
      "image/webp": "webp"
    })[mime] || "png";

  const persistentLogoUrl = (state = {}) => {
    const candidate = state.logoUrl || state.logoImage || "";
    return candidate && !candidate.startsWith("data:") ? candidate : null;
  };

  const getSessionUser = async () => {
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session?.user || null;
  };

  const ensureProfile = async (user) => {
    if (!client || !user) return null;
    const metadata = user.user_metadata || {};
    const email = user.email || "";
    const profileBase = {
      id: user.id,
      email,
      full_name: metadata.full_name || metadata.name || email.split("@")[0] || "BeyondEight user",
      updated_at: new Date().toISOString()
    };
    const profile = {
      ...profileBase,
      avatar_url: metadata.avatar_url || metadata.picture || null
    };
    let response = await client.from("profiles").upsert(profile, { onConflict: "id" }).select("*").single();
    if (response.error && /avatar_url/i.test(response.error.message || "")) {
      console.warn("profiles.avatar_url is missing. Run supabase-schema.sql to repair the schema.");
      response = await client.from("profiles").upsert(profileBase, { onConflict: "id" }).select("*").single();
    }
    if (response.error) throw response.error;
    return response.data;
  };

  const listAccessibleBusinesses = async (userId) => {
    if (!client || !userId) return [];
    const { data: owned, error: ownedError } = await client
      .from("businesses")
      .select("*, websites(id,published,published_at,custom_domain)")
      .eq("owner_user_id", userId)
      .order("updated_at", { ascending: false });
    if (ownedError) throw ownedError;

    const { data: memberships, error: membershipError } = await client
      .from("business_members")
      .select("businesses(*, websites(id,published,published_at,custom_domain))")
      .eq("user_id", userId);
    if (membershipError) throw membershipError;

    const data = [...(owned || []), ...(memberships || []).map((row) => row.businesses).filter(Boolean)];
    const seen = new Set();
    return data.filter((business) => {
      if (seen.has(business.id)) return false;
      seen.add(business.id);
      return true;
    });
  };

  const getPrimaryBusiness = async (userId) => {
    const businesses = await listAccessibleBusinesses(userId);
    return { business: businesses[0] || null, businesses };
  };

  const checkSlugAvailability = async (slug, businessId) => {
    const format = validSlug(slug);
    if (!format.valid) return format;
    const { data, error } = await client.from("businesses").select("id").eq("slug", format.slug).maybeSingle();
    if (error) throw error;
    if (data && data.id !== businessId) return { valid: false, slug: format.slug, message: "Already taken." };
    return { valid: true, slug: format.slug, message: "Available." };
  };

  const buildBusinessPayload = (userId, state, stepIndex, launched = false) => ({
    owner_user_id: userId,
    business_name: state.businessName,
    slug: state.slug,
    business_type: "Independent Choreographer",
    tagline: state.tagline,
    description: state.whatYouDo,
    mission: state.mission,
    why_join: state.whyJoin,
    brand_vibe: state.brandVibe,
    theme: state.theme,
    logo_url: persistentLogoUrl(state),
    status: launched ? "published" : "draft",
    current_onboarding_step: stepIndex,
    onboarding_completed: launched,
    updated_at: new Date().toISOString()
  });

  const ensureBusiness = async (user, state, stepIndex = 0, currentBusinessId = null, launched = false) => {
    if (!client || !user) return null;
    await ensureProfile(user);
    let targetBusinessId = currentBusinessId;
    if (!targetBusinessId) {
      const preferredSlug = validSlug(state.slug || state.businessName).slug;
      if (preferredSlug) {
        const { data: matchingSlug, error: matchingSlugError } = await client
          .from("businesses")
          .select("id")
          .eq("owner_user_id", user.id)
          .eq("slug", preferredSlug)
          .maybeSingle();
        if (matchingSlugError) throw matchingSlugError;
        targetBusinessId = matchingSlug?.id || null;
      }
    }
    if (!targetBusinessId && !launched) {
      const { data: existing, error: existingError } = await client
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existingError) throw existingError;
      targetBusinessId = existing?.id || null;
    }

    const suggestedSlug = validSlug(state.slug || state.businessName).slug || `business-${Date.now()}`;
    const slugCheck = await checkSlugAvailability(suggestedSlug, targetBusinessId);
    if (!slugCheck.valid) throw new Error(slugCheck.message || "Choose a different website URL.");
    const payload = buildBusinessPayload(user.id, { ...state, slug: slugCheck.slug }, stepIndex, launched);
    let response;
    if (targetBusinessId) {
      response = await client.from("businesses").update(payload).eq("id", targetBusinessId).select("*").single();
    } else {
      response = await client.from("businesses").insert(payload).select("*").single();
      if (response.error && /owner_id/i.test(response.error.message || "")) {
        console.warn("businesses.owner_id is a legacy required column. Run supabase-repair-legacy-owner-id.sql.");
        response = await client.from("businesses").insert({ ...payload, owner_id: user.id }).select("*").single();
      }
    }
    if (response.error) throw response.error;
    const business = response.data;
    await client.from("business_members").upsert(
      {
        business_id: business.id,
        user_id: user.id,
        role: "owner"
      },
      { onConflict: "business_id,user_id" }
    );
    return business;
  };

  const saveSettings = async (businessId, state) => {
    if (!businessId) return null;
    const { data, error } = await client
      .from("business_settings")
      .upsert(
        {
          business_id: businessId,
          dance_styles: state.styles || [],
          selected_tools: state.tools || [],
          selected_pages: state.pages || [],
          social_links: {
            instagram: state.instagram,
            tiktok: state.tiktok,
            youtube: state.youtube,
            website: state.website
          },
          brand_colors: state.brandColors || [],
          generated_content: state,
          updated_at: new Date().toISOString()
        },
        { onConflict: "business_id" }
      )
      .select("*")
      .single();
    if (error) throw error;
    return data;
  };

  const uploadBusinessLogo = async (business, state) => {
    if (!business?.id || !state?.logoImage) return { logoImage: state?.logoImage || "", logoUrl: state?.logoUrl || "" };
    if (!state.logoImage.startsWith("data:")) {
      const logoUrl = state.logoUrl || state.logoImage;
      return { logoImage: logoUrl, logoUrl };
    }
    const file = dataUrlToFile(state.logoImage);
    if (!file) return { logoImage: state.logoImage, logoUrl: "" };

    const extension = extensionForMime(file.mime);
    const storagePath = `${business.id}/logo-${Date.now()}.${extension}`;
    const { error: uploadError } = await client.storage.from("business-media").upload(storagePath, file.blob, {
      contentType: file.mime,
      upsert: true
    });
    if (uploadError) {
      console.warn("Logo upload failed:", uploadError);
      return { logoImage: state.logoImage, logoUrl: state.logoImage, storageError: uploadError.message || "Storage upload failed." };
    }

    const { data: publicData } = client.storage.from("business-media").getPublicUrl(storagePath);
    const publicUrl = publicData?.publicUrl || "";
    if (!publicUrl) return { logoImage: state.logoImage, logoUrl: state.logoImage };

    const updateResponse = await client
      .from("businesses")
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", business.id)
      .select("*")
      .single();
    if (updateResponse.error && !/logo_url/i.test(updateResponse.error.message || "")) throw updateResponse.error;

    const mediaResponse = await client.from("media").insert({
      business_id: business.id,
      storage_path: storagePath,
      public_url: publicUrl,
      file_type: file.mime,
      alt_text: `${business.business_name || "Business"} logo`
    });
    if (mediaResponse.error) console.warn("Logo media metadata was not saved:", mediaResponse.error);

    return { logoImage: publicUrl, logoUrl: publicUrl };
  };

  const saveOnboarding = async ({ user, state, stepIndex, businessId, launched = false }) => {
    const business = await ensureBusiness(user, state, stepIndex, businessId, launched);
    await saveSettings(business.id, { ...state, slug: business.slug });
    return business;
  };

  const getBusinessBundle = async (businessId) => {
    const { data: business, error } = await client.from("businesses").select("*").eq("id", businessId).single();
    if (error) throw error;
    const { data: settings } = await client.from("business_settings").select("*").eq("business_id", businessId).maybeSingle();
    const { data: website } = await client.from("websites").select("*").eq("business_id", businessId).maybeSingle();
    const { data: pages } = website
      ? await client.from("website_pages").select("*").eq("website_id", website.id).order("display_order")
      : { data: [] };
    return { business, settings, website, pages: pages || [] };
  };

  const getBusinessBundleBySlug = async (slug) => {
    const { data: business, error } = await client
      .from("businesses")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!business) return null;
    const { data: website, error: websiteError } = await client
      .from("websites")
      .select("*")
      .eq("business_id", business.id)
      .eq("published", true)
      .maybeSingle();
    if (websiteError) throw websiteError;
    if (!website) return null;
    const { data: settings } = await client.from("business_settings").select("*").eq("business_id", business.id).maybeSingle();
    const { data: pages } = await client.from("website_pages").select("*").eq("website_id", website.id).eq("enabled", true).order("display_order");
    return { business, settings, website, pages: pages || [] };
  };

  const publishWebsite = async ({ user, state, stepIndex, businessId }) => {
    let business = await ensureBusiness(user, state, stepIndex, businessId, false);
    let publishedState = { ...state, slug: business.slug };
    await saveSettings(business.id, publishedState);
    const logoResult = await uploadBusinessLogo(business, publishedState);
    if (logoResult?.logoImage) {
      publishedState = { ...publishedState, logoImage: logoResult.logoImage, logoUrl: logoResult.logoUrl || "" };
      await saveSettings(business.id, publishedState);
    }
    business = await ensureBusiness(user, publishedState, stepIndex, business.id, true);
    await saveSettings(business.id, publishedState);
    let websiteResponse = await client
      .from("websites")
      .upsert(
        {
          business_id: business.id,
          theme: publishedState.theme,
          published: true,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { onConflict: "business_id" }
      )
      .select("*")
      .single();
    if (websiteResponse.error && /owner_id/i.test(websiteResponse.error.message || "")) {
      console.warn("websites.owner_id is a legacy required column. Run supabase-repair-legacy-owner-id.sql.");
      websiteResponse = await client
        .from("websites")
        .upsert(
          {
            business_id: business.id,
            owner_id: user.id,
            theme: publishedState.theme,
            published: true,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { onConflict: "business_id" }
        )
        .select("*")
        .single();
    }
    if (websiteResponse.error) throw websiteResponse.error;
    const website = websiteResponse.data;

    const pages = (publishedState.pages?.length ? publishedState.pages : ["Home", "About", "Classes & Workshops", "Gallery", "Contact", "Register"]).map((title, index) => ({
      website_id: website.id,
      page_type: pageSlug(title),
      title,
      content: {
        businessName: publishedState.businessName,
        tagline: publishedState.tagline,
        description: publishedState.whatYouDo,
        mission: publishedState.mission,
        whyJoin: publishedState.whyJoin,
        styles: publishedState.styles || [],
        logoUrl: publishedState.logoUrl || ""
      },
      enabled: true,
      display_order: index
    }));
    if (pages.length) {
      let pagesResponse = await client.from("website_pages").upsert(pages, { onConflict: "website_id,page_type" });
      const legacyPages = pages.map((page) => ({
        ...page,
        business_id: business.id,
        owner_id: user.id,
        slug: page.page_type
      }));
      if (pagesResponse.error && /owner_id/i.test(pagesResponse.error.message || "")) {
        console.warn("website_pages.owner_id is a legacy required column. Run supabase-repair-legacy-owner-id.sql.");
        pagesResponse = await client.from("website_pages").upsert(legacyPages, { onConflict: "website_id,page_type" });
      }
      if (pagesResponse.error && /business_id/i.test(pagesResponse.error.message || "")) {
        console.warn("website_pages.business_id is a legacy required column. Run supabase-repair-legacy-owner-id.sql.");
        pagesResponse = await client.from("website_pages").upsert(legacyPages, { onConflict: "website_id,page_type" });
      }
      if (pagesResponse.error && /slug/i.test(pagesResponse.error.message || "")) {
        console.warn("website_pages.slug is a legacy required column. Run supabase-repair-legacy-owner-id.sql.");
        pagesResponse = await client.from("website_pages").upsert(legacyPages, { onConflict: "website_id,page_type" });
      }
      if (pagesResponse.error) throw pagesResponse.error;
    }
    return { business, website };
  };

  const routeForUser = async (user) => {
    if (!user) return "/";
    await ensureProfile(user);
    const { business, businesses } = await getPrimaryBusiness(user.id);
    if (businesses.length > 1) return "/dashboard/?select=1";
    if (!business) return "/dashboard/";
    if (!business.onboarding_completed) return "/dashboard/";
    return "/dashboard/";
  };

  const signOut = async () => {
    if (!client) return;
    await client.auth.signOut();
  };

  window.BeyondEight = {
    client,
    reservedSlugs,
    slugify,
    validSlug,
    checkSlugAvailability,
    getSessionUser,
    ensureProfile,
    listAccessibleBusinesses,
    getPrimaryBusiness,
    getBusinessBundle,
    getBusinessBundleBySlug,
    saveOnboarding,
    publishWebsite,
    routeForUser,
    signOut
  };

  document.documentElement.dataset.supabaseReady = String(Boolean(client));
})();
