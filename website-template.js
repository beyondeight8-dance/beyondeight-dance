(function () {
  const esc = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const assetSrc = (value = "") => {
    const src = String(value || "");
    if (!src) return "";
    return /^(data:|blob:|https?:|\/)/i.test(src) ? src : `/${src}`;
  };

  // Six genuinely different site designs (not palette swaps of one template) - see the
  // "kicker" (hero eyebrow lines), "cta", and "classesLayout" fields, which drive structurally
  // different hero and class-list markup in renderDesktopPreview below.
  const themes = [
    {
      name: "Editorial",
      key: "editorial",
      cardClass: "theme-editorial",
      eyebrow: "Sophisticated. Fashion-forward. Timeless.",
      kicker: ["Choreographer", "Educator", "Storyteller"],
      flourish: "More than movement",
      cta: "Explore Classes",
      classesLayout: "editorial",
      sampleBrand: "Beyond Studio",
      sampleHeadline: "Dance shapes a brighter tomorrow.",
      description: "A premium editorial page built around striking photography.",
      classOne: "Heels Foundations",
      classTwo: "Contemporary Flow",
      noteTitle: "About",
      note: "Large image-led cards, quiet serif type, and a fashion-editorial feel."
    },
    {
      name: "Studio",
      key: "studio",
      cardClass: "theme-studio",
      eyebrow: "Clean. Modern. Professional.",
      kicker: ["Choreographer", "Educator", "Movement for a brighter you"],
      flourish: "Move better together",
      cta: "Book a Class",
      classesLayout: "list",
      sampleBrand: "Move Co.",
      sampleHeadline: "Discipline. Creativity. Community.",
      description: "A crisp, professional page with a numbered class schedule.",
      classOne: "Bollywood Fusion",
      classTwo: "Choreography Lab",
      noteTitle: "Studio note",
      note: "A clean numbered schedule, confident blue accents, and tight typography."
    },
    {
      name: "Electric",
      key: "electric",
      cardClass: "theme-electric",
      eyebrow: "Bold. Energetic. Unapologetic.",
      kicker: ["Bollywood", "Hip Hop", "Commercial", "Heels", "Choreography"],
      flourish: "Good moves, brighter people",
      cta: "Explore Classes",
      classesLayout: "badge",
      sampleBrand: "Pulse",
      sampleHeadline: "Dance bigger.",
      description: "High-color, high-energy layouts with bold overlapping type.",
      classOne: "Bollywood Fusion",
      classTwo: "BollyHop",
      noteTitle: "Community",
      note: "Neon-bright color blocks, oversized type, and date-badge class cards."
    },
    {
      name: "Noir",
      key: "noir",
      cardClass: "theme-noir",
      eyebrow: "Cinematic. Dramatic. Immersive.",
      kicker: ["Choreographer", "Educator", "Creator"],
      flourish: "Watch Reel",
      cta: "Book a Class",
      classesLayout: "rows",
      sampleBrand: "Eight",
      sampleHeadline: "Movement lives in the in-between.",
      description: "A moody, cinematic page built on a near-black canvas.",
      classOne: "Bollywood Fusion",
      classTwo: "Choreography Lab",
      noteTitle: "Approach",
      note: "Full-bleed dark imagery, minimal overlay copy, and dramatic contrast."
    },
    {
      name: "Muse",
      key: "muse",
      cardClass: "theme-muse",
      eyebrow: "Warm. Artistic. Personal.",
      kicker: ["Choreographer", "Educator", "Community Builder"],
      flourish: "Same brighter you",
      cta: "Explore Classes",
      classesLayout: "editorial",
      sampleBrand: "Grace",
      sampleHeadline: "Movement is a kinder world.",
      description: "A warm, hand-crafted page with soft artistic textures.",
      classOne: "Bollywood Fusion",
      classTwo: "Choreography Lab",
      noteTitle: "Studio note",
      note: "Warm terracotta tones, brushstroke accents, and an artist's-journal feel."
    },
    {
      name: "Motion",
      key: "motion",
      cardClass: "theme-motion",
      eyebrow: "Experimental. Creative. Unconventional.",
      kicker: ["Choreographer", "Educator", "Creative"],
      flourish: "Dance. Create. Belong.",
      cta: "Book a Class",
      classesLayout: "eventList",
      sampleBrand: "Beyond Movement",
      sampleHeadline: "Move with intention.",
      description: "An experimental, graphic layout with kinetic accents.",
      classOne: "Bollywood Fusion",
      classTwo: "Choreography Lab",
      noteTitle: "Community",
      note: "Bold black type, a neon accent color, and a numbered event layout."
    }
  ];

  const canonicalThemeName = (theme = "") => {
    const normalized = String(theme).toLowerCase();
    if (normalized.includes("studio")) return "Studio";
    if (normalized.includes("electric") || normalized.includes("bold") || normalized.includes("urban") || normalized.includes("edgy")) return "Electric";
    if (normalized.includes("noir") || normalized.includes("minimal") || normalized.includes("black")) return "Noir";
    if (normalized.includes("muse") || normalized.includes("soft") || normalized.includes("classical") || normalized.includes("graceful")) return "Muse";
    if (normalized.includes("motion") || normalized.includes("vibrant") || normalized.includes("playful")) return "Motion";
    return "Editorial";
  };

  const themeProfileFor = (theme = "") => themes.find((item) => item.name === canonicalThemeName(theme)) || themes[0];
  const themeKeyFor = (theme = "") => themeProfileFor(theme).key;
  const themeClassFor = (theme = "") => `generated-${themeKeyFor(theme)}`;
  const themeActionLabel = (theme = {}) => theme.cta || "Reserve Spot";

  const slugify = (value = "") =>
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "beyond-movement";

  const stateFromBundle = (input = {}) => {
    const { business = {}, settings = {}, website = {}, pages = [], origin = window.location.origin } = input;
    const storedContent = input.mode === "public" ? website.published_content : website.draft_content;
    const generated = storedContent && Object.keys(storedContent).length ? storedContent : website.published_content && Object.keys(website.published_content).length ? website.published_content : settings.generated_content || {};
    return {
      ...generated,
      businessId: business.id || generated.businessId || "",
      businessName: generated.businessName || business.business_name || "Beyond Movement",
      slug: business.slug || generated.slug || slugify(business.business_name || generated.businessName),
      tagline: generated.tagline || generated.headline || business.tagline || "",
      whatYouDo: generated.whatYouDo || business.description || "",
      mission: generated.mission || business.mission || "",
      whyJoin: generated.whyJoin || business.why_join || "",
      theme: generated.theme || website.theme || business.theme || "Editorial",
      styles: generated.styles || settings.dance_styles || [],
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
    const generatedClasses = styles.slice(0, 5).map((style, index) => {
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
    const classes = Array.isArray(state.classes) ? state.classes : generatedClasses;
    const contact = [state.instagram, state.website || state.domain || "", state.showEmail === "No" ? "" : state.email || "hello@beyond8dance.com", state.showPhone === "No" ? "" : state.phone, state.showLocation === "No" ? "" : state.location || "Location shared after registration"].filter(Boolean);
    return {
      businessId: state.businessId || "",
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
      ctaText: state.ctaText || themeActionLabel(theme),
      ctaLink: state.ctaLink || "#classes",
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
      workshop: state.workshop || {
        title: `${styles[0] || "Dance"} Signature Workshop`,
        date: "Saturday 11:00 AM",
        time: "11:00 AM",
        location: state.location || "In studio",
        level: "Open level",
        price: "$45",
        description: state.whyJoin || "A focused workshop with choreography, coaching, and space to connect with the movement."
      },
      instructorName,
      instructorBio: state.instructorBio || `${brandName} helps dancers grow through ${styles.slice(0, 3).join(", ")} with clear coaching, intentional choreography, and a welcoming class experience.`,
      aboutEyebrow: state.aboutEyebrow || "Meet the choreographer",
      classesEyebrow: state.classesEyebrow || "Upcoming Classes",
      classesHeading: state.classesHeading || "Book your next class.",
      galleryEyebrow: state.galleryEyebrow || "Gallery",
      galleryHeading: state.galleryHeading || "Moments from the studio.",
      faqEyebrow: state.faqEyebrow || "FAQ",
      faqHeading: state.faqHeading || "Good to know before class.",
      benefitsEyebrow: state.benefitsEyebrow || "Why dance with me",
      benefitsHeading: state.benefitsHeading || "Training that feels clear, expressive, and easy to join.",
      benefits: Array.isArray(state.benefits) && state.benefits.length ? state.benefits : demoData.benefits,
      testimonials: Array.isArray(state.testimonials) ? state.testimonials : demoData.testimonials,
      faqs: Array.isArray(state.faqs) && state.faqs.length ? state.faqs : demoData.faqs,
      gallery: Array.isArray(state.gallery) && state.gallery.length ? state.gallery : [
        state.galleryImage || "assets/starter-dance-class.jpg",
        state.workshopImage || "assets/starter-workshop-teaching.jpg",
        state.performanceImage || "assets/starter-performance.jpg",
        state.instructorImage || "assets/starter-headshot.jpg"
      ].filter(Boolean),
      contact,
      socials: [state.instagram, state.tiktok, state.youtube].filter(Boolean)
    };
  };

  const instagramAlt = (item, username) => {
    const caption = String(item.caption || "").replace(/\s+/g, " ").trim();
    return caption ? caption.slice(0, 120) : `Instagram post by @${username}`;
  };

  const renderInstagramSection = ({ username = "", items = [] } = {}) => {
    const visible = (items || []).filter((item) => item?.permalink && (item.thumbnail_url || item.media_url)).slice(0, 6);
    if (!visible.length) return "";
    const cleanUsername = String(username || "").replace(/^@/, "");
    const tiles = visible
      .map((item) => {
        const image = item.thumbnail_url || item.media_url;
        const isVideo = /VIDEO|REEL/i.test(item.media_type || "");
        return `<a class="setup-preview-instagram-tile" href="${esc(item.permalink)}" target="_blank" rel="noopener noreferrer" aria-label="Open Instagram post by @${esc(cleanUsername)}">
          <img src="${esc(image)}" alt="${esc(instagramAlt(item, cleanUsername))}" loading="lazy">
          <span aria-hidden="true">${isVideo ? "Play" : "IG"}</span>
        </a>`;
      })
      .join("");
    return `<section class="setup-preview-section setup-preview-instagram">
      <div class="setup-preview-instagram-heading">
        <div><small>From the Studio</small><h4>Life in motion.</h4></div>
        ${cleanUsername ? `<a href="https://www.instagram.com/${esc(cleanUsername)}/" target="_blank" rel="noopener noreferrer">Follow @${esc(cleanUsername)}</a>` : ""}
      </div>
      <div class="setup-preview-instagram-grid">${tiles}</div>
    </section>`;
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

  const renderThemePicker = (selectedTheme = "Editorial") =>
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
  const paragraphHTML = (copy = "") =>
    String(copy || "")
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => `<p>${esc(part).replace(/\n/g, "<br>")}</p>`)
      .join("");

  // Six structurally different hero + class-list layouts, dispatched by theme key below. Every
  // real data field (title, date, price, image, published/registrationOpen) flows through
  // unchanged from buildWebsiteContent - only the markup shape differs per theme. Every class
  // item keeps its data-book-class button so public-site.js's booking flow works identically
  // in every theme.
  const classPrice = (item) => (typeof item.price === "number" ? `$${item.price.toFixed(2)}` : item.price || "");
  const classDateTime = (item) => [item.date, item.time].filter(Boolean).join(" • ") || "Date TBA";
  // Real classes store an ISO date (YYYY-MM-DD); the generated demo fallback classes store an
  // ad-hoc "Thu 12" string instead, so this must degrade gracefully rather than parse garbage.
  const classMonthDay = (item) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(item.date || "")) {
      const parsed = new Date(`${item.date}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) {
        return { month: parsed.toLocaleDateString("en-US", { month: "short" }).toUpperCase(), day: String(parsed.getDate()) };
      }
    }
    return { month: "", day: item.date || "TBA" };
  };
  const classesEmptyHTML = `<p class="theme-classes-empty">New classes coming soon. Follow along or get in touch for the next class announcement.</p>`;
  const bookButton = (item, label = "Book a Spot", className = "") =>
    `<button type="button"${className ? ` class="${className}"` : ""} data-book-class="${esc(item.id || slugify(item.title))}"${item.registrationOpen === false ? " disabled" : ""}>${item.registrationOpen === false ? "Registration Closed" : label}</button>`;

  const heroEditorial = (content, ctx) => `
    <section id="home" class="theme-hero theme-hero-editorial" data-edit-section="hero">
      <div class="theme-hero-copy">
        <p class="theme-hero-kicker">${content.theme.kicker.map((word) => esc(word)).join(" · ")}</p>
        <h1 class="theme-hero-headline">${esc(content.headline)}</h1>
        <a class="theme-hero-cta" href="${esc(content.ctaLink || "#classes")}">${esc(ctx.primaryAction)}</a>
      </div>
      <div class="theme-hero-media">
        ${imageTag(content.images.hero, `${content.brandName} hero dance image`)}
        <blockquote class="theme-hero-quote">${esc(content.theme.flourish)}</blockquote>
      </div>
    </section>`;

  const heroStudio = (content, ctx) => {
    const words = String(content.headline).trim().split(/\s+/).filter(Boolean);
    const [firstWord, ...restWords] = words;
    return `
    <section id="home" class="theme-hero theme-hero-studio" data-edit-section="hero">
      <div class="theme-hero-copy">
        <p class="theme-hero-kicker">${content.theme.kicker.map((line) => `<span>${esc(line)}</span>`).join("")}</p>
        <h1 class="theme-hero-headline"><span class="theme-hero-accent">${esc(firstWord || "")}</span> ${esc(restWords.join(" "))}</h1>
        <a class="theme-hero-link" href="${esc(content.ctaLink || "#classes")}">${esc(ctx.primaryAction)} →</a>
      </div>
      <div class="theme-hero-media">
        <span class="theme-hero-block" aria-hidden="true"></span>
        ${imageTag(content.images.hero, `${content.brandName} hero dance image`)}
      </div>
    </section>`;
  };

  const heroElectric = (content, ctx) => `
    <section id="home" class="theme-hero theme-hero-electric" data-edit-section="hero">
      <div class="theme-hero-media">
        ${imageTag(content.images.hero, `${content.brandName} hero dance image`)}
        <div class="theme-hero-tagcloud">${content.styles.slice(0, 5).map((style) => `<span>${esc(style)}</span>`).join("")}</div>
      </div>
      <div class="theme-hero-copy">
        <h1 class="theme-hero-headline">${esc(content.headline)}</h1>
        <a class="theme-hero-cta" href="${esc(content.ctaLink || "#classes")}">${esc(ctx.primaryAction)}</a>
      </div>
    </section>`;

  const heroNoir = (content, ctx) => `
    <section id="home" class="theme-hero theme-hero-noir" data-edit-section="hero">
      ${imageTag(content.images.hero, `${content.brandName} hero dance image`)}
      <div class="theme-hero-copy">
        <p class="theme-hero-kicker">${content.theme.kicker.map((word) => esc(word)).join(" · ")}</p>
        <h1 class="theme-hero-headline">${esc(content.headline)}</h1>
        <p class="theme-hero-name">${esc(content.instructorName)}</p>
        <a class="theme-hero-link" href="#about">▶ ${esc(content.theme.flourish)}</a>
      </div>
    </section>`;

  const heroMuse = (content, ctx) => `
    <section id="home" class="theme-hero theme-hero-muse" data-edit-section="hero">
      <div class="theme-hero-copy">
        <p class="theme-hero-kicker">${content.theme.kicker.map((word) => esc(word)).join(" · ")}</p>
        <h1 class="theme-hero-headline">${esc(content.headline)}</h1>
        <a class="theme-hero-cta" href="${esc(content.ctaLink || "#classes")}">${esc(ctx.primaryAction)} →</a>
      </div>
      <div class="theme-hero-media">
        ${imageTag(content.images.hero, `${content.brandName} hero dance image`)}
        <span class="theme-hero-flourish">${esc(content.theme.flourish)}</span>
      </div>
    </section>`;

  const heroMotion = (content, ctx) => {
    const words = String(content.headline).trim().split(/\s+/).filter(Boolean);
    const lastWord = words.pop() || "";
    return `
    <section id="home" class="theme-hero theme-hero-motion" data-edit-section="hero">
      <div class="theme-hero-copy">
        <h1 class="theme-hero-headline">${esc(words.join(" "))} <span class="theme-hero-accent">${esc(lastWord)}</span></h1>
        <p class="theme-hero-tagblock">${content.theme.kicker.map((word) => esc(word)).join(" ")}<br>${esc(content.theme.flourish)}</p>
      </div>
      <div class="theme-hero-media">
        ${imageTag(content.images.hero, `${content.brandName} hero dance image`)}
      </div>
    </section>`;
  };

  // Editorial cards: large image, quiet caption below. Shared by Editorial and Muse - the two
  // themes stay genuinely distinct through color, type, and texture, not structure.
  const classesEditorial = (content, ctx) => {
    const items = ctx.visibleClasses.map((item, index) => {
      const thumb = item.image || ctx.classThumbs[index % ctx.classThumbs.length] || content.images.hero;
      return `<article class="theme-class-card${item.highlighted ? " is-highlighted" : ""}">
        <div class="theme-class-card-media">${imageTag(thumb, `${item.title} class thumbnail`)}</div>
        <div class="theme-class-card-body">
          <small>${esc(classDateTime(item))}${item.level ? ` &bull; ${esc(item.level)}` : ""}</small>
          <strong>${esc(item.title)}</strong>
          <span>${esc(classPrice(item))}</span>
        </div>
        ${bookButton(item)}
      </article>`;
    }).join("") || classesEmptyHTML;
    return `<section id="classes" class="theme-classes theme-classes-editorial" data-edit-section="classes">
      <small>${esc(content.classesEyebrow)}</small>
      <h2>${esc(content.classesHeading)}</h2>
      <div class="theme-classes-grid">${items}</div>
    </section>`;
  };

  // Clean numbered schedule, no images - Studio.
  const classesStudio = (content, ctx) => {
    const items = ctx.visibleClasses.map((item, index) => `<article class="theme-class-row">
      <span class="theme-class-index">${String(index + 1).padStart(2, "0")}</span>
      <div class="theme-class-row-body">
        <strong>${esc(item.title)}</strong>
        <span>${esc(classDateTime(item))}</span>
      </div>
      <span class="theme-class-row-level">${esc(item.level || "")}</span>
      <span class="theme-class-row-price">${esc(classPrice(item))}</span>
      ${bookButton(item, "→", "theme-class-row-cta")}
    </article>`).join("") || classesEmptyHTML;
    return `<section id="classes" class="theme-classes theme-classes-list" data-edit-section="classes">
      <small>${esc(content.classesEyebrow)}</small>
      <h2>${esc(content.classesHeading)}</h2>
      <div class="theme-classes-rows">${items}</div>
    </section>`;
  };

  // Bold colorful image cards with a date badge overlay - Electric.
  const classesElectric = (content, ctx) => {
    const items = ctx.visibleClasses.map((item, index) => {
      const thumb = item.image || ctx.classThumbs[index % ctx.classThumbs.length] || content.images.hero;
      const { month, day } = classMonthDay(item);
      return `<article class="theme-class-card${item.highlighted ? " is-highlighted" : ""}">
        <div class="theme-class-card-media">
          ${imageTag(thumb, `${item.title} class thumbnail`)}
          <span class="theme-class-badge">${month ? `<em>${esc(month)}</em>${esc(day)}` : esc(day)}</span>
        </div>
        <strong>${esc(item.title)}</strong>
        <small>${[item.time, item.level].filter(Boolean).map((value) => esc(value)).join(" · ")}</small>
        ${bookButton(item, classPrice(item) || "Book")}
      </article>`;
    }).join("") || classesEmptyHTML;
    return `<section id="classes" class="theme-classes theme-classes-badge" data-edit-section="classes">
      <small>${esc(content.classesEyebrow)}</small>
      <h2>${esc(content.classesHeading)}</h2>
      <div class="theme-classes-grid">${items}</div>
    </section>`;
  };

  // Dark cinematic image-led rows - Noir.
  const classesNoir = (content, ctx) => {
    const items = ctx.visibleClasses.map((item, index) => {
      const thumb = item.image || ctx.classThumbs[index % ctx.classThumbs.length] || content.images.hero;
      return `<article class="theme-class-row">
        <div class="theme-class-row-media">${imageTag(thumb, `${item.title} class thumbnail`)}</div>
        <div class="theme-class-row-body">
          <strong>${esc(item.title)}</strong>
          <span>${esc(classDateTime(item))}${item.level ? ` &bull; ${esc(item.level)}` : ""}</span>
        </div>
        <span class="theme-class-row-price">${esc(classPrice(item))}</span>
        ${bookButton(item, "→", "theme-class-row-cta")}
      </article>`;
    }).join("") || classesEmptyHTML;
    return `<section id="classes" class="theme-classes theme-classes-noir" data-edit-section="classes">
      <small>${esc(content.classesEyebrow)}</small>
      <h2>${esc(content.classesHeading)}</h2>
      <div class="theme-classes-rows">${items}</div>
    </section>`;
  };

  // Experimental numbered event layout, with a small thumbnail per row - Motion.
  const classesMotion = (content, ctx) => {
    const items = ctx.visibleClasses.map((item, index) => {
      const thumb = item.image || ctx.classThumbs[index % ctx.classThumbs.length] || content.images.hero;
      return `<article class="theme-class-row">
        <span class="theme-class-index">${String(index + 1).padStart(2, "0")}</span>
        <div class="theme-class-row-media">${imageTag(thumb, `${item.title} class thumbnail`)}</div>
        <div class="theme-class-row-body">
          <strong>${esc(item.title)}</strong>
          <span>${esc(classDateTime(item))}${item.level ? ` &bull; ${esc(item.level)}` : ""}</span>
        </div>
        <span class="theme-class-row-price">${esc(classPrice(item))}</span>
        ${bookButton(item, "→", "theme-class-row-cta")}
      </article>`;
    }).join("") || classesEmptyHTML;
    return `<section id="classes" class="theme-classes theme-classes-event" data-edit-section="classes">
      <small>${esc(content.classesEyebrow)}</small>
      <h2>${esc(content.classesHeading)}</h2>
      <div class="theme-classes-rows">${items}</div>
    </section>`;
  };

  const heroRenderers = { editorial: heroEditorial, studio: heroStudio, electric: heroElectric, noir: heroNoir, muse: heroMuse, motion: heroMotion };
  const classesRenderers = { editorial: classesEditorial, studio: classesStudio, electric: classesElectric, noir: classesNoir, muse: classesEditorial, motion: classesMotion };

  const renderDesktopPreview = (content, options = {}) => {
    const primaryAction = content.ctaText || themeActionLabel(content.theme);
    const classThumbs = [content.images.gallery, content.images.workshop, content.images.performance, content.images.hero].filter(Boolean);
    const visibleClasses = content.classes.filter((item) => item.published !== false);
    const heroMarkup = (heroRenderers[content.theme.key] || heroEditorial)(content, { primaryAction });
    const classesMarkup = (classesRenderers[content.theme.key] || classesEditorial)(content, { visibleClasses, classThumbs, primaryAction });
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
    const navPages = ["Home", "About", "Classes", "Workshops", "Gallery", "FAQ", "Contact"];
    const navLinks = navPages
      .map((page) => `<a href="#${esc(slugify(page))}">${esc(page)}</a>`)
      .join("");
    const mobileNavLinks = navPages
      .map((page) => `<a href="#${esc(slugify(page))}">${esc(page)}</a>`)
      .join("");
    const isPlaceholderBrand = !content.brandName || /^(test|demo|sample|brand|my brand|website)$/i.test(String(content.brandName).trim());
    const contactHeadline = isPlaceholderBrand ? "Ready to move?" : `Ready to move with ${content.brandName}?`;
    const secondaryContact = content.socials?.length ? "Follow on Instagram" : "Get in Touch";
    const aboutParagraphs = [
      content.whatYouDo,
      content.mission,
      content.whyJoin
    ]
      .filter(Boolean)
      .map((copy) => paragraphHTML(copy))
      .join("");
    return `
      <header class="setup-preview-nav" data-edit-section="header">
        <a class="setup-preview-brand" href="#home" aria-label="${esc(content.brandName)} home"><strong data-live-logo-small>${logoHTML(content, options.logoHTML)}</strong></a>
        <nav class="setup-preview-nav-links" aria-label="Primary navigation">${navLinks}</nav>
        <a class="setup-preview-nav-cta" href="${esc(content.ctaLink || "#classes")}">${esc(primaryAction)}</a>
        <details class="setup-preview-mobile-menu">
          <summary aria-label="Open menu"><span></span><span></span><span></span></summary>
          <div>
            <strong>${esc(content.brandName)}</strong>
            <nav aria-label="Mobile navigation">${mobileNavLinks}</nav>
            <a href="${esc(content.ctaLink || "#classes")}">${esc(primaryAction)}</a>
          </div>
        </details>
      </header>
      ${heroMarkup}
      ${classesMarkup}
      <section id="workshops" class="setup-preview-section setup-preview-workshop" data-edit-section="workshop">
        <div>
          <div class="setup-preview-badges"><span>Featured</span><span>Limited Seats</span><span>Weekend Intensive</span></div>
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
      <section id="about" class="setup-preview-section setup-preview-instructor" data-edit-section="about">
        ${imageTag(content.images.instructor, `${content.instructorName} instructor portrait`)}
        <div class="setup-preview-instructor-copy">
          <small>${esc(content.aboutEyebrow)}</small>
          <h4 data-live-instructor-name>${esc(content.instructorName)}</h4>
          <p class="setup-preview-role">Choreographer, instructor, and movement mentor</p>
          <div data-live-instructor-bio>${aboutParagraphs}</div>
          <blockquote class="setup-preview-instructor-quote">“${esc(content.whyJoin)}”</blockquote>
          <div class="setup-preview-focus-tags">
            ${content.styles.slice(0, 5).map((style) => `<span>${esc(style)}</span>`).join("")}
          </div>
          <div class="setup-preview-socials">${content.socials.slice(0, 3).map((social) => `<a href="#contact">${esc(social)}</a>`).join("") || `<a href="#contact">Instagram</a><a href="#contact">Email</a>`}</div>
          <a class="setup-preview-text-link" href="#contact">Ask about private sessions</a>
        </div>
      </section>
      <section class="setup-preview-section setup-preview-benefits" data-edit-section="benefits">
        <small>${esc(content.benefitsEyebrow)}</small>
        <h4>${esc(content.benefitsHeading)}</h4>
        <div>${benefits}</div>
      </section>
      <section id="gallery" class="setup-preview-section setup-preview-gallery" data-edit-section="gallery">
        <small>${esc(content.galleryEyebrow)}</small>
        <h4>${esc(content.galleryHeading)}</h4>
        <div class="setup-preview-gallery-grid">${gallery}</div>
      </section>
      <div data-instagram-feed data-edit-section="social" data-business-id="${esc(content.businessId)}"></div>
      ${testimonials ? `<div class="setup-preview-proof" data-live-testimonials data-edit-section="testimonials">${testimonials}</div>` : ""}
      <section id="faq" class="setup-preview-section setup-preview-faq" data-edit-section="faq">
        <small>${esc(content.faqEyebrow)}</small>
        <h4>${esc(content.faqHeading)}</h4>
        <div>${faqs}</div>
      </section>
      <section id="contact" class="setup-preview-section setup-preview-contact" data-edit-section="contact">
        <div>
          <small>Contact</small>
          <h4>${esc(contactHeadline)}</h4>
          <p data-live-contact>Reserve your next class, ask about private workshops, or follow along for the next drop.</p>
          <div class="setup-preview-contact-links">${content.contact.slice(0, 3).map((item) => `<span>${esc(item)}</span>`).join("")}</div>
        </div>
        <div class="setup-preview-contact-actions">
          <button type="button">${esc(primaryAction)}</button>
          <a href="#contact">${esc(secondaryContact)}</a>
        </div>
      </section>
      <footer class="setup-preview-footer" data-edit-section="footer">
        <p class="theme-footer-flourish">${esc(content.theme.flourish)}</p>
        <div class="setup-preview-footer-brand">
          <strong>${logoHTML(content, options.logoHTML)}</strong>
          <p>${esc(content.tagline || "A polished home for classes, workshops, and student community.")}</p>
          <a class="setup-preview-footer-cta" href="${esc(content.ctaLink || "#classes")}">${esc(primaryAction)}</a>
        </div>
        <nav class="setup-preview-footer-nav" aria-label="Footer navigation">
          <small>Explore</small>
          ${pageLinks(content)}
        </nav>
        <div class="setup-preview-footer-connect">
          <small>Connect</small>
          ${content.contact.slice(0, 3).map((item) => `<span>${esc(item)}</span>`).join("") || `<span>@beyondeight</span><span>hello@beyond8dance.com</span>`}
        </div>
        <div class="setup-preview-footer-bottom">
          <span>Powered by BeyondEight</span>
          <span><a href="#contact">Privacy</a> <a href="#contact">Terms</a></span>
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
    const businessId = JSON.stringify(String(content.businessId || ""));
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="${esc(baseUrl)}">
  <title>${esc(content.brandName)} | Generated by BeyondEight</title>
  <link rel="stylesheet" href="/styles.css?v=20260919-six-themes">
</head>
<body class="${themeClassFor(content.theme.name)}">
  ${renderSharedPublicSite(content)}
  <script src="/website-template.js?v=20260919-six-themes"><\/script>
  <script>
    (() => {
      const businessId = ${businessId};
      const mount = document.querySelector("[data-instagram-feed]");
      if (!businessId || !mount) return;
      fetch("/api/instagram/feed?businessId=" + encodeURIComponent(businessId))
        .then((response) => response.ok ? response.json() : { items: [] })
        .then((feed) => {
          const templates = window.BeyondEightWebsiteTemplates;
          if (templates) mount.innerHTML = templates.renderInstagramSection(feed);
        })
        .catch(() => mount.replaceChildren());
    })();
  <\/script>
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
    renderInstagramSection,
    renderPublicSite: renderSharedPublicSite,
    generatedSiteHTML
  };
})();
