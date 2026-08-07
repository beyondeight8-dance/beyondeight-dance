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
  const themeActionLabel = (theme = {}) => {
    const label = theme.cta || "Reserve Spot";
    if (/apply/i.test(label)) return "Apply";
    if (/claim/i.test(label)) return "Claim spot";
    if (/book/i.test(label)) return "Book a spot";
    if (/explore/i.test(label)) return "Explore classes";
    return "Reserve Spot";
  };

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

  const demoData = {
    locations: ["In studio", "Downtown studio", "Online option", "Pop-up studio", "Community center"],
    levels: ["Open level", "Beginner-friendly", "Intermediate", "All levels", "Performance track"],
    prices: ["$22", "$30", "$45", "$65", "$18"],
    classSuffixes: ["Foundations", "Intensive", "Workshop", "Lab", "Training"],
    benefits: [
      ["Beginner-Friendly Instruction", "Clear progressions help new dancers feel confident from the first class."],
      ["Performance-Ready Training", "Technique, musicality, and stage presence are built into every session."],
      ["Supportive Community", "A welcoming room where dancers can grow without feeling lost."],
      ["Organized Booking", "Students can discover classes, reserve spots, and get details in one place."]
    ],
    testimonials: [
      ["Maya R.", "Amazing energy from the first count. The class felt polished, warm, and easy to follow."],
      ["Leah T.", "I loved how clear the registration was. I knew exactly where to go and what to bring."],
      ["Nia S.", "The choreography challenged me while still feeling supportive and fun."]
    ],
    faqs: [
      ["Do I need previous dance experience?", "No. Classes marked open level or beginner-friendly are designed so new dancers can join with confidence."],
      ["What should I wear?", "Wear something comfortable to move in. Bring water, supportive shoes if needed, and a willingness to try."],
      ["Can I book a private workshop?", "Yes. Private workshops, intensives, and group sessions can be requested through the contact form."],
      ["How do I reserve a spot?", "Choose a class or workshop, complete the registration details, and you will receive a confirmation."],
      ["What is the cancellation policy?", "Cancellation details are shared during registration and can be customized by the choreographer."]
    ]
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
      const days = ["Thu", "Sat", "Sun", "Wed", "Fri"];
      const times = ["7:00 PM", "11:00 AM", "5:30 PM", "6:45 PM", "8:00 PM"];
      return {
        title: `${style} ${demoData.classSuffixes[index % demoData.classSuffixes.length]}`,
        date: `${days[index % days.length]} ${index + 12}`,
        time: times[index % times.length],
        location: demoData.locations[index % demoData.locations.length],
        level: demoData.levels[index % demoData.levels.length],
        price: demoData.prices[index % demoData.prices.length],
        spots: `${14 - index * 2} spots left`,
        instructor: instructorName,
        style
      };
    });
    const contact = [
      state.instagram || "Instagram coming soon",
      state.website || state.domain || "",
      state.email || "hello@beyond8dance.com",
      state.location || "Location shared after registration"
    ].filter(Boolean);
    return {
      theme,
      brandName,
      tagline: headline,
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
      workshop: {
        title: `${styles[0] || "Dance"} Signature Workshop`,
        date: "Saturday 11:00 AM",
        time: "11:00 AM",
        location: state.location || "In studio",
        level: "Open level",
        price: "$45",
        description: state.whyJoin || "A focused workshop with choreography, coaching, and space to connect with the movement."
      },
      instructorName,
      instructorBio: `${brandName} helps dancers grow through ${styles.slice(0, 3).join(", ")} with clear coaching, intentional choreography, and a welcoming class experience.`,
      benefits: demoData.benefits,
      testimonials: demoData.testimonials,
      faqs: demoData.faqs,
      gallery: [
        state.galleryImage || "assets/starter-dance-class.jpg",
        state.workshopImage || "assets/starter-workshop-teaching.jpg",
        state.performanceImage || "assets/starter-performance.jpg",
        state.instructorImage || "assets/starter-headshot.jpg"
      ].filter(Boolean),
      contact,
      socials: [state.instagram, state.tiktok, state.youtube].filter(Boolean)
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

  const imageTag = (src, alt, className = "") =>
    `<img${className ? ` class="${esc(className)}"` : ""} src="${esc(assetSrc(src))}" alt="${esc(alt)}" loading="lazy">`;

  const renderDesktopPreview = (content, options = {}) => {
    const tags = content.styles.slice(0, 4).map((style) => `<span>${esc(style)}</span>`).join("");
    const primaryAction = themeActionLabel(content.theme);
    const classes = content.classes
      .slice(0, 3)
      .map(
        (item) =>
          `<article class="setup-preview-class-card">
            <small>${esc(item.style)}</small>
            <strong>${esc(item.title)}</strong>
            <div class="setup-preview-class-meta">
              <span><em>Date</em><b>${esc(item.date)}</b></span>
              <span><em>Time</em><b>${esc(item.time)}</b></span>
              <span><em>Instructor</em><b>${esc(item.instructor)}</b></span>
              <span><em>Level</em><b>${esc(item.level)}</b></span>
            </div>
            <p>${esc(item.location)} &bull; ${esc(item.price)} &bull; ${esc(item.spots)}</p>
            <button type="button">${esc(primaryAction)}</button>
          </article>`
      )
      .join("");
    const benefits = content.benefits.map(([title, copy]) => `<article><strong>${esc(title)}</strong><p>${esc(copy)}</p></article>`).join("");
    const gallery = content.gallery
      .slice(0, 4)
      .map((src, index) => imageTag(src, `${content.brandName} gallery image ${index + 1}`))
      .join("");
    const testimonials = content.testimonials
      .slice(0, 3)
      .map(([name, quote], index) => {
        const initials = name
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 2);
        return `<blockquote>
          <div class="setup-preview-testimonial-head">
            <span>${esc(initials || `S${index + 1}`)}</span>
            <div><strong>${esc(name)}</strong><small>★★★★★</small></div>
          </div>
          <p>${esc(quote)}</p>
        </blockquote>`;
      })
      .join("");
    const faqs = content.faqs.map(([question, answer]) => `<details><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join("");
    const navLinks = ["Home", "About", "Classes", "Workshops", "Gallery", "FAQ", "Contact"]
      .map((page) => `<a href="#${esc(slugify(page))}">${esc(page)}</a>`)
      .join("");
    const aboutParagraphs = [
      content.instructorBio,
      content.mission,
      content.whyJoin
    ]
      .filter(Boolean)
      .map((copy) => `<p>${esc(copy)}</p>`)
      .join("");
    return `
      <div class="setup-preview-nav">
        <strong data-live-logo-small>${logoHTML(content, options.logoHTML)}</strong>
        <nav>${navLinks}</nav>
        <button type="button">${esc(primaryAction)}</button>
      </div>
      <section id="home" class="setup-preview-hero">
        <div>
          <small data-live-theme>${esc(content.theme.name)}</small>
          <h3 data-live-headline>${esc(content.headline)}</h3>
          <p data-live-about>${esc(content.whatYouDo)}</p>
          <div class="setup-preview-tags" data-live-specialties>${tags}</div>
          <div class="setup-preview-cta-group">
            <button type="button">${esc(primaryAction)}</button>
            <a href="#classes">View Classes</a>
          </div>
        </div>
        ${imageTag(content.images.hero, `${content.brandName} hero dance image`)}
      </section>
      <section id="classes" class="setup-preview-section setup-preview-classes">
        <small>Upcoming Classes</small>
        <h4>Book your next class.</h4>
        <div class="setup-preview-mini-grid" data-live-class-list>${classes}</div>
      </section>
      <section id="workshops" class="setup-preview-section setup-preview-workshop">
        <div>
          <small>Featured Workshop</small>
          <h4>${esc(content.workshop.title)}</h4>
          <p>${esc(content.workshop.description)}</p>
          <div class="setup-preview-event-meta">
            <span><em>Date</em><b>${esc(content.workshop.date)}</b></span>
            <span><em>Time</em><b>${esc(content.workshop.time)}</b></span>
            <span><em>Location</em><b>${esc(content.workshop.location)}</b></span>
            <span><em>Seats</em><b>10 spots left</b></span>
          </div>
          <button type="button">${esc(primaryAction)}</button>
        </div>
        ${imageTag(content.images.workshop, `${content.brandName} workshop image`)}
      </section>
      <section id="about" class="setup-preview-section setup-preview-instructor">
        ${imageTag(content.images.instructor, `${content.instructorName} instructor portrait`)}
        <div class="setup-preview-instructor-copy">
          <small>Meet the choreographer</small>
          <h4 data-live-instructor-name>${esc(content.instructorName)}</h4>
          <div data-live-instructor-bio>${aboutParagraphs}</div>
          <blockquote class="setup-preview-instructor-quote">“${esc(content.whyJoin)}”</blockquote>
          <div class="setup-preview-stats">
            <span><b>8+</b><em>years teaching</em></span>
            <span><b>${esc(content.classes.length)}+</b><em>weekly offerings</em></span>
            <span><b>${esc(content.styles[0] || "Dance")}</b><em>signature focus</em></span>
          </div>
          <div class="setup-preview-socials">${content.socials.slice(0, 3).map((social) => `<a href="#contact">${esc(social)}</a>`).join("") || `<a href="#contact">Instagram</a><a href="#contact">Email</a>`}</div>
          <a class="setup-preview-text-link" href="#contact">Ask about private sessions</a>
        </div>
      </section>
      <section class="setup-preview-section setup-preview-benefits">
        <small>Why dance with me</small>
        <h4>Training that feels clear, expressive, and easy to join.</h4>
        <div>${benefits}</div>
      </section>
      <section id="gallery" class="setup-preview-section setup-preview-gallery">
        <small>Gallery</small>
        <h4>Moments from the studio.</h4>
        <div class="setup-preview-gallery-grid">${gallery}</div>
      </section>
      <div class="setup-preview-proof" data-live-testimonials>${testimonials}</div>
      <section id="faq" class="setup-preview-section setup-preview-faq">
        <small>FAQ</small>
        <h4>Good to know before class.</h4>
        <div>${faqs}</div>
      </section>
      <section id="contact" class="setup-preview-section setup-preview-contact">
        <div>
          <small>Contact</small>
          <h4>Ready to move with ${esc(content.brandName)}?</h4>
          <p data-live-contact>${esc(content.contact.join(" &bull; "))}</p>
          <div class="setup-preview-contact-links">${content.contact.slice(0, 3).map((item) => `<span>${esc(item)}</span>`).join("")}</div>
        </div>
        <button type="button">${esc(primaryAction)}</button>
      </section>
      <footer class="setup-preview-footer">
        <div>
          <strong>${logoHTML(content, options.logoHTML)}</strong>
          <p>${esc(content.tagline)}</p>
        </div>
        <nav>${pageLinks(content)}</nav>
        <div class="setup-preview-footer-meta">
          <span>${esc(content.contact[0] || "@beyondeight")}</span>
          <span>${esc(content.contact[1] || "hello@beyond8dance.com")}</span>
          <span>Powered by BeyondEight</span>
        </div>
      </footer>`;
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
    return `
      ${ownerToolbar}
      <div class="published-site setup-preview-site" data-theme-key="${esc(content.theme.key)}">
        ${renderDesktopPreview(publicContent, { logoHTML: logoHTML(publicContent), publicMode: true })}
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
  <link rel="stylesheet" href="/styles.css?v=20260807-template-engine-polish">
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
