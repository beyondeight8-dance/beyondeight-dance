(function () {
  const esc = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const assetSrc = (value = "") => {
    const src = String(value || "");
    if (!src) return "";
    return /^(data:|blob:|https?:|\/)/i.test(src) ? src : `/${src}`;
  };

  const themes = [
    {
      name: "Default Elegant",
      key: "elegant",
      cardClass: "theme-elegant",
      eyebrow: "Now enrolling",
      cta: "Join a class",
      sampleBrand: "Beyond Studio",
      sampleHeadline: "Elevate. Inspire. Move.",
      description: "Clean, modern, and beautifully minimal.",
      classOne: "Heels Foundations",
      classTwo: "Contemporary Flow",
      noteTitle: "About",
      note: "Refined pages for graceful brands, clean booking, and premium class launches."
    },
    {
      name: "Bold & Edgy",
      key: "bold",
      cardClass: "theme-bold",
      eyebrow: "Limited drop",
      cta: "Claim spot",
      sampleBrand: "Move Co.",
      sampleHeadline: "Make your move.",
      description: "Strong, high-contrast, and full of attitude.",
      classOne: "Audition Prep",
      classTwo: "Street Jazz",
      noteTitle: "Instructor",
      note: "High contrast, bold cards, and punchy CTAs for expressive dance brands."
    },
    {
      name: "Soft & Graceful",
      key: "soft",
      cardClass: "theme-soft",
      eyebrow: "Contemporary studio",
      cta: "Explore classes",
      sampleBrand: "Grace",
      sampleHeadline: "Movement is poetry.",
      description: "Elegant type, soft tones, and refined flow.",
      classOne: "Ballet Flow",
      classTwo: "Modern Lab",
      noteTitle: "Studio note",
      note: "Muted blush, delicate spacing, and editorial storytelling for softer brands."
    },
    {
      name: "Vibrant & Playful",
      key: "vibrant",
      cardClass: "theme-vibrant",
      eyebrow: "Fresh workshops",
      cta: "Book a spot",
      sampleBrand: "Pulse",
      sampleHeadline: "Dance. Create. Be you.",
      description: "Youthful, energetic, and full of personality.",
      classOne: "Pop-up Class",
      classTwo: "Creator Lab",
      noteTitle: "Community",
      note: "Energetic color, playful cards, and fast paths into events and signups."
    },
    {
      name: "Minimal Black",
      key: "minimal",
      cardClass: "theme-minimal",
      eyebrow: "Private training",
      cta: "Apply now",
      sampleBrand: "Eight",
      sampleHeadline: "Focus. Create. Perform.",
      description: "Sleek, modern, and unapologetically focused.",
      classOne: "Performance Lab",
      classTwo: "Private Coaching",
      noteTitle: "Approach",
      note: "Luxury monochrome, dramatic image crops, and generous negative space."
    }
  ];

  const canonicalThemeName = (theme = "") => {
    const normalized = String(theme).toLowerCase();
    if (normalized.includes("bold") || normalized.includes("urban")) return "Bold & Edgy";
    if (normalized.includes("soft") || normalized.includes("classical")) return "Soft & Graceful";
    if (normalized.includes("vibrant")) return "Vibrant & Playful";
    if (normalized.includes("minimal")) return "Minimal Black";
    return "Default Elegant";
  };

  const themeProfileFor = (theme = "") => themes.find((item) => item.name === canonicalThemeName(theme)) || themes[0];
  const themeKeyFor = (theme = "") => themeProfileFor(theme).key;
  const themeClassFor = (theme = "") => `generated-${themeKeyFor(theme)}`;

  const slugify = (value = "") =>
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "beyond-movement";

  const stateFromBundle = ({ business = {}, settings = {}, website = {}, pages = [], origin = window.location.origin } = {}) => {
    const generated = settings.generated_content || {};
    return {
      businessName: business.business_name || generated.businessName || "Beyond Movement",
      slug: business.slug || generated.slug || slugify(business.business_name || generated.businessName),
      tagline: business.tagline || generated.tagline || generated.headline || "",
      whatYouDo: business.description || generated.whatYouDo || "",
      mission: business.mission || generated.mission || "",
      whyJoin: business.why_join || generated.whyJoin || "",
      theme: business.theme || website.theme || generated.theme || "Default Elegant",
      styles: settings.dance_styles || generated.styles || [],
      pages: pages.length ? pages.map((page) => page.title || page.page_type).filter(Boolean) : generated.pages || [],
      instagram: generated.instagram || "",
      tiktok: generated.tiktok || "",
      youtube: generated.youtube || "",
      website: generated.website || "",
      domain: `${origin}/${business.slug || generated.slug || slugify(business.business_name || generated.businessName)}`,
      logoImage: business.logo_url || generated.logoUrl || generated.logoImage || "",
      logoText: generated.logoText || String(business.business_name || generated.businessName || "Beyond Movement").split(/\s+/).slice(0, 2).join("<br>").toUpperCase(),
      logoFont: generated.logoFont || "serif",
      heroImage: generated.heroImage || "",
      aboutImage: generated.aboutImage || "",
      galleryImage: generated.galleryImage || "",
      workshopImage: generated.workshopImage || "",
      performanceImage: generated.performanceImage || "",
      instructorImage: generated.instructorImage || generated.portraitImage || ""
    };
  };

  const buildWebsiteContent = (input = {}) => {
    const state = input.business ? stateFromBundle(input) : input;
    const theme = themeProfileFor(state.theme);
    const styles = (state.styles && state.styles.length ? state.styles : ["Heels", "Hip Hop", "Contemporary", "Bollywood", "Jazz"]).slice(0, 8);
    const brandName = state.businessName || "Beyond Movement";
    const headline = state.tagline || state.headline || "Move with purpose. Dance with passion.";
    const whatYouDo =
      state.whatYouDo ||
      "A polished home for choreography classes, workshops, intensives, and dancer experiences that feel easy to discover and book.";
    const mission =
      state.mission ||
      "We blend strong technique, expressive performance, and a supportive room where dancers can grow with confidence.";
    const whyJoin =
      state.whyJoin ||
      "Students leave feeling challenged, seen, and excited to keep building their artistry through movement.";
    const instructorName = state.instructorName || `${brandName} Instructor`;
    const classes = styles.slice(0, 5).map((style, index) => {
      const classTypes = ["Foundations", "Intensive", "Workshop", "Lab", "Training"];
      const days = ["Thu", "Sat", "Sun", "Wed", "Fri"];
      const times = ["7:00 PM", "11:00 AM", "5:30 PM", "6:45 PM", "8:00 PM"];
      return {
        title: `${style} ${classTypes[index % classTypes.length]}`,
        date: `${days[index % days.length]} ${index + 12}`,
        time: times[index % times.length],
        instructor: instructorName,
        style
      };
    });
    return {
      theme,
      brandName,
      headline,
      whatYouDo,
      mission,
      whyJoin,
      styles,
      pages: state.pages && state.pages.length ? state.pages : ["Home", "About", "Classes & Workshops", "Gallery", "Contact", "Register"],
      domain: state.domain || `${window.location.origin}/${state.slug || slugify(brandName)}`,
      logoImage: state.logoImage || "",
      logoText: state.logoText || brandName.split(/\s+/).slice(0, 2).join("<br>").toUpperCase(),
      logoFont: state.logoFont || "serif",
      images: {
        hero: state.heroImage || "assets/starter-hero-dance.jpg",
        about: state.aboutImage || "assets/starter-instructor-portrait.jpg",
        gallery: state.galleryImage || "assets/starter-dance-class.jpg",
        workshop: state.workshopImage || "assets/starter-workshop-teaching.jpg",
        performance: state.performanceImage || "assets/starter-performance.jpg",
        instructor: state.instructorImage || state.portraitImage || state.aboutImage || "assets/starter-headshot.jpg"
      },
      classes,
      instructorName,
      instructorBio: `${brandName} helps dancers grow through ${styles.slice(0, 3).join(", ")} with clear coaching, intentional choreography, and a welcoming class experience.`,
      testimonials: [
        "Amazing energy from the first count.",
        "The registration was easy and the class felt so organized.",
        "I left feeling confident and excited to come back."
      ],
      faqs: [
        ["Do I need experience?", "All levels are welcome unless a class is marked advanced."],
        ["How do I register?", "Choose a class, reserve your spot, and complete your details online."],
        ["Can I join workshops?", "Yes. Workshops and intensives appear as soon as registration opens."]
      ],
      contact: [state.instagram || "Instagram coming soon", state.website || state.domain || "", "hello@beyond8dance.com"].filter(Boolean)
    };
  };

  const logoHTML = (content, fallback = "") => {
    if (fallback) return fallback;
    const image = content.logoImage ? `<img src="${esc(content.logoImage)}" alt="">` : "";
    return `<span class="logo-lockup logo-font-${esc(content.logoFont)}">${image}<span>${content.logoText}</span></span>`;
  };

  const renderThemePreview = (themeName, { useUserContent = false, content } = {}) => {
    const theme = themeProfileFor(themeName);
    const source = content || buildWebsiteContent({ theme: theme.name });
    const brand = useUserContent ? source.brandName : theme.sampleBrand;
    const headline = useUserContent ? source.headline : theme.sampleHeadline;
    const classOne = useUserContent ? source.classes[0]?.title || theme.classOne : theme.classOne;
    const classTwo = useUserContent ? source.classes[1]?.title || theme.classTwo : theme.classTwo;
    return `
      <div class="mini-site-preview marketplace-preview" data-theme-key="${theme.key}">
        <div class="mini-nav"><i></i><strong>${esc(brand)}</strong><span>Classes</span><span>Events</span><span>Register</span></div>
        <div class="mini-hero">
          <div><small>${esc(theme.eyebrow)}</small><strong>${esc(headline)}</strong><span class="mini-cta">${esc(theme.cta)}</span></div>
          <img class="theme-dancer" src="assets/dancer-hero.png" alt="">
        </div>
        <div class="mini-content">
          <article><b>${esc(classOne)}</b><small>Thu 7:00 PM</small></article>
          <article><b>${esc(classTwo)}</b><small>Weekend series</small></article>
          <aside><span>${esc(theme.noteTitle)}</span><p>${esc(theme.note)}</p></aside>
        </div>
        <div class="mini-palette"><i></i><i></i><i></i><i></i></div>
      </div>`;
  };

  const renderThemePicker = (selectedTheme = "Default Elegant") =>
    themes
      .map(
        (theme) => `
          <label class="${theme.cardClass}">
            <input type="radio" name="setupTheme" value="${esc(theme.name)}" ${canonicalThemeName(selectedTheme) === theme.name ? "checked" : ""}>
            <span class="theme-preview theme-preview-button" aria-hidden="true">${renderThemePreview(theme.name)}</span>
            <strong>${esc(theme.name)}</strong><small>${esc(theme.description)}</small>
          </label>`
      )
      .join("");

  const renderDesktopPreview = (content, options = {}) => {
    const tags = content.styles.slice(0, 4).map((style) => `<span>${esc(style)}</span>`).join("");
    const classes = content.classes
      .slice(0, 4)
      .map((item) => `<article><strong>${esc(item.title)}</strong><span>${esc(item.date)} • ${esc(item.time)}</span><small>${esc(item.instructor)}</small></article>`)
      .join("");
    const testimonials = content.testimonials.slice(0, 2).map((quote) => `<blockquote>${esc(quote)}</blockquote>`).join("");
    return `
      <div class="setup-preview-nav">
        <strong data-live-logo-small>${logoHTML(content, options.logoHTML)}</strong>
        <span>Home</span><span>Classes</span><span>About</span>
      </div>
      <div class="setup-preview-hero">
        <div>
          <small data-live-theme>${esc(content.theme.name)}</small>
          <h3 data-live-headline>${esc(content.headline)}</h3>
          <p data-live-about>${esc(content.whatYouDo)}</p>
          <div class="setup-preview-tags" data-live-specialties>${tags}</div>
          <button type="button">${esc(content.theme.cta)}</button>
        </div>
        <img src="${esc(content.images.hero)}" alt="${esc(`${content.brandName} hero dance image`)}">
      </div>
      <div class="setup-preview-cards">
        <article><strong data-live-class-one>${esc(content.classes[0]?.title || "Signature Class")}</strong><span>Registration open</span></article>
        <article><strong data-live-class-two>${esc(content.classes[1]?.title || "Workshop")}</strong><span>Limited spots</span></article>
      </div>
      <section class="setup-preview-section setup-preview-instructor">
        <img src="${esc(content.images.instructor)}" alt="${esc(`${content.instructorName} instructor portrait`)}">
        <div>
          <small>Meet the instructor</small>
          <h4 data-live-instructor-name>${esc(content.instructorName)}</h4>
          <p data-live-instructor-bio>${esc(content.instructorBio)}</p>
        </div>
      </section>
      <div class="setup-preview-mini-grid" data-live-class-list>${classes}</div>
      <div class="setup-preview-proof" data-live-testimonials>${testimonials}</div>
      <section class="setup-preview-section setup-preview-contact">
        <small>Contact</small>
        <p data-live-contact>${esc(content.contact.join(" • "))}</p>
      </section>`;
  };

  const renderPhonePreview = (content, options = {}) => {
    const state = options.state || content;
    const title = `${content.brandName || "Website"} mobile preview`;
    return `<iframe class="ready-phone-frame" title="${esc(title)}" srcdoc="${esc(generatedSiteHTML(state))}"></iframe>`;
  };

  const pageLinks = (content) =>
    content.pages.slice(0, 6).map((page) => `<a href="#${esc(slugify(page))}">${esc(page)}</a>`).join("");

  const renderSharedPublicSite = (content, { ownerToolbar = "", logoUrl = "" } = {}) => {
    const publicContent = logoUrl && !content.logoImage ? { ...content, logoImage: logoUrl } : content;
    const faqs = content.faqs.map(([question, answer]) => `<details><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join("");
    const galleryImages = [
      content.images.about,
      content.images.gallery,
      content.images.workshop,
      content.images.performance,
      content.images.instructor
    ]
      .filter(Boolean)
      .slice(0, 4)
      .map((src, index) => `<img src="${esc(assetSrc(src))}" alt="${esc(`${content.brandName} gallery image ${index + 1}`)}">`)
      .join("");
    return `
      ${ownerToolbar}
      <div class="published-site setup-preview-site" data-theme-key="${esc(content.theme.key)}">
        ${renderDesktopPreview(publicContent, { logoHTML: logoHTML(publicContent) })}
        <section id="gallery" class="setup-preview-section setup-preview-gallery">
          <small>Gallery</small>
          <h4>Moments from the studio.</h4>
          <div class="setup-preview-gallery-grid">${galleryImages}</div>
        </section>
        <section class="setup-preview-section setup-preview-faq">
          <small>FAQ</small>
          <h4>Good to know before class.</h4>
          <div>${faqs}</div>
        </section>
        <footer class="setup-preview-footer">
          <strong>${logoHTML(publicContent)}</strong>
          <nav>${pageLinks(content)}</nav>
          <span>Built with BeyondEight</span>
        </footer>
      </div>`;
  };

  const generatedSiteHTML = (state) => {
    const content = buildWebsiteContent(state);
    const baseUrl = `${window.location.origin}/`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="${esc(baseUrl)}">
  <title>${esc(content.brandName)} | Generated by BeyondEight</title>
  <link rel="stylesheet" href="/styles.css?v=20260719-template-system">
</head>
<body class="${themeClassFor(content.theme.name)}">
  ${renderSharedPublicSite(content)}
</body>
</html>`;
  };

  window.BeyondEightWebsiteTemplates = {
    themes,
    canonicalThemeName,
    themeKeyFor,
    themeClassFor,
    themeProfileFor,
    buildWebsiteContent,
    renderThemePreview,
    renderThemePicker,
    renderDesktopPreview,
    renderPhonePreview,
    renderPublicSite: renderSharedPublicSite,
    generatedSiteHTML
  };
})();
