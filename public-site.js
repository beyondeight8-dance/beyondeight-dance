(async function () {
  const app = window.BeyondEight;
  const root = document.querySelector("[data-public-site-root]");
  const esc = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const params = new URLSearchParams(window.location.search);
  const querySlug = params.get("slug");
  const slug = querySlug || window.location.pathname.split("/").filter(Boolean)[0];
  const LOCAL_PUBLISHED_SITES_KEY = "beyondeight.localPublishedSites";

  const canonicalThemeName = (theme = "") => {
    const normalized = String(theme).toLowerCase();
    if (normalized.includes("bold") || normalized.includes("urban")) return "Bold & Edgy";
    if (normalized.includes("soft") || normalized.includes("classical")) return "Soft & Graceful";
    if (normalized.includes("vibrant")) return "Vibrant & Playful";
    if (normalized.includes("minimal")) return "Minimal Black";
    return "Default Elegant";
  };

  const themeClass = (theme = "") => {
    const map = {
      "Default Elegant": "generated-elegant",
      "Bold & Edgy": "generated-bold",
      "Soft & Graceful": "generated-soft",
      "Vibrant & Playful": "generated-vibrant",
      "Minimal Black": "generated-minimal"
    };
    return map[canonicalThemeName(theme)] || "generated-elegant";
  };

  const themeProfile = (theme = "") => {
    const name = canonicalThemeName(theme);
    const key = themeClass(name).replace("generated-", "");
    const profiles = {
      elegant: { eyebrow: "Now enrolling", cta: "Join a class" },
      bold: { eyebrow: "Limited drop", cta: "Claim spot" },
      soft: { eyebrow: "Contemporary studio", cta: "Explore classes" },
      vibrant: { eyebrow: "Fresh workshops", cta: "Book a spot" },
      minimal: { eyebrow: "Private training", cta: "Apply now" }
    };
    return { name, key, ...(profiles[key] || profiles.elegant) };
  };

  const buildPublishedContent = ({ business, settings, website }) => {
    const generatedContent = settings?.generated_content || {};
    const selectedStyles = settings?.dance_styles || generatedContent.styles || [];
    const styles = selectedStyles.length ? selectedStyles : ["Heels", "Hip Hop", "Contemporary", "Bollywood", "Jazz"];
    const theme = themeProfile(business.theme || website?.theme || generatedContent.theme);
    const brandName = business.business_name || generatedContent.businessName || "Beyond Movement";
    const headline = business.tagline || generatedContent.tagline || generatedContent.headline || "Move with purpose. Dance with passion.";
    const whatYouDo =
      business.description ||
      generatedContent.whatYouDo ||
      "A polished home for choreography classes, workshops, intensives, and dancer experiences that feel easy to discover and book.";
    const mission =
      business.mission ||
      generatedContent.mission ||
      "We blend strong technique, expressive performance, and a supportive room where dancers can grow with confidence.";
    const whyJoin =
      business.why_join ||
      generatedContent.whyJoin ||
      "Students leave feeling challenged, seen, and excited to keep building their artistry through movement.";
    const instructorName = generatedContent.instructorName || `${brandName} Instructor`;
    const classes = styles.slice(0, 5).map((style, index) => {
      const classTypes = ["Foundations", "Intensive", "Workshop", "Lab", "Training"];
      const days = ["Thu", "Sat", "Sun", "Wed", "Fri"];
      const times = ["7:00 PM", "11:00 AM", "5:30 PM", "6:45 PM", "8:00 PM"];
      return {
        title: `${style} ${classTypes[index % classTypes.length]}`,
        date: `${days[index % days.length]} ${index + 12}`,
        time: times[index % times.length],
        instructor: instructorName
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
      contact: [
        generatedContent.instagram || "Instagram coming soon",
        generatedContent.website || `${window.location.origin}/${business.slug}`,
        "hello@beyond8dance.com"
      ].filter(Boolean)
    };
  };

  try {
    if (!slug || app.reservedSlugs?.has(slug)) {
      root.innerHTML = `<section class="route-loading"><h1>Page not found.</h1><p>This BeyondEight page does not exist.</p><a class="primary-button" href="/">Go home</a></section>`;
      return;
    }

    if (querySlug && window.location.pathname.includes("404.html")) {
      window.history.replaceState({}, "", `/${slug}`);
    }

    const localSites = JSON.parse(window.localStorage.getItem(LOCAL_PUBLISHED_SITES_KEY) || "{}");
    const bundle = localSites[slug] || (await app.getBusinessBundleBySlug(slug));
    if (!bundle) {
      root.innerHTML = `<section class="route-loading"><h1>Website not published yet.</h1><p>This BeyondEight site is private or unavailable.</p><a class="primary-button" href="/">Go home</a></section>`;
      return;
    }

    const { business, settings, website, pages } = bundle;
    const currentUser = await app.getSessionUser?.().catch(() => null);
    const isOwner = Boolean(currentUser && business.owner_user_id && currentUser.id === business.owner_user_id);
    const selectedPages = new Set((pages || []).map((page) => page.title));
    const generatedContent = settings?.generated_content || {};
    const content = buildPublishedContent({ business, settings, website });
    const logoUrl = business.logo_url || generatedContent.logoUrl || generatedContent.logoImage || "";
    const themeName = content.theme.name;
    document.body.classList.add(themeClass(themeName));
    document.title = `${content.brandName} | BeyondEight`;
    const pageLinks = [...selectedPages].slice(0, 6).map((page) => `<a href="#${app.slugify(page)}">${esc(page)}</a>`).join("");
    const specialtyTags = content.styles.map((style) => `<span>${esc(style)}</span>`).join("");
    const classCards = content.classes
      .map(
        (item) =>
          `<article><small>${esc(item.date)} • ${esc(item.time)}</small><h3>${esc(item.title)}</h3><p>${esc(item.instructor)}</p><a href="#register">Register</a></article>`
      )
      .join("");
    const testimonials = content.testimonials.map((quote) => `<blockquote>"${esc(quote)}"</blockquote>`).join("");
    const faqs = content.faqs.map(([question, answer]) => `<details><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join("");
    root.innerHTML = `
      ${
        isOwner
          ? `<div class="owner-toolbar" data-owner-toolbar>
              <strong>BeyondEight</strong>
              <span>Viewing as Owner</span>
              <a href="/dashboard/website/?business=${esc(business.id)}">Edit Website</a>
              <a href="/dashboard/">Dashboard</a>
              <button type="button" data-owner-visitor>View as Visitor</button>
            </div>`
          : ""
      }
      <div class="published-site">
        <header class="published-header">
          <strong class="published-logo">${logoUrl ? `<img src="${esc(logoUrl)}" alt="">` : ""}<span>${esc(content.brandName)}</span></strong>
          <nav>${pageLinks}</nav>
        </header>
        <section class="published-hero">
          <div>
            <p class="eyebrow">${esc(themeName)}</p>
            <h1>${esc(content.headline)}</h1>
            <p>${esc(content.whatYouDo)}</p>
            <div class="published-tags">${specialtyTags}</div>
            <a class="primary-button" href="#classes">${esc(content.theme.cta)}</a>
          </div>
          <figure class="published-hero-card">
            <img src="/assets/dancer-hero.png" alt="">
            <figcaption><strong>${esc(content.theme.eyebrow)}</strong><span>${esc(content.classes[0]?.title || "Signature class")}</span></figcaption>
          </figure>
        </section>
        <section id="classes" class="published-section published-classes"><p class="eyebrow">Upcoming classes</p><h2>Choose your next class.</h2><div class="published-class-grid">${classCards}</div></section>
        <section id="about" class="published-section"><p class="eyebrow">About</p><h2>${esc(content.brandName)} helps dancers move with confidence.</h2><p>${esc(content.mission)} ${esc(content.whyJoin)}</p></section>
        <section class="published-section published-instructor"><img src="/assets/dancer-ethereal.jpg" alt=""><div><p class="eyebrow">Meet the instructor</p><h2>${esc(content.instructorName)}</h2><p>${esc(content.instructorBio)}</p><div class="published-tags">${specialtyTags}</div></div></section>
        <section id="gallery" class="published-section"><p class="eyebrow">Gallery</p><h2>Moments from the studio.</h2><div class="published-gallery"><img src="/assets/dancer-hero.png" alt=""><img src="/assets/dancer-ethereal.jpg" alt=""><img src="/assets/dancer-hero.png" alt=""></div></section>
        <section class="published-section"><p class="eyebrow">Testimonials</p><h2>Dancers feel the difference.</h2><div class="published-testimonials">${testimonials}</div></section>
        <section class="published-section"><p class="eyebrow">FAQ</p><h2>Good to know before class.</h2><div class="published-faq">${faqs}</div></section>
        <section id="register" class="published-section"><div class="published-contact-card"><div><p class="eyebrow">Contact</p><h2>Ready to dance with us?</h2><p>${esc(content.contact.join(" • "))}</p></div><a class="primary-button" href="mailto:hello@beyond8dance.com">Register interest</a></div></section>
        <footer class="published-footer"><span>${esc(content.brandName)}</span><span>Built with BeyondEight</span></footer>
      </div>`;
    root.querySelector("[data-owner-visitor]")?.addEventListener("click", () => {
      root.querySelector("[data-owner-toolbar]")?.remove();
    });
  } catch (error) {
    console.warn("Public site failed:", error);
    root.innerHTML = `<section class="route-loading"><h1>We could not load this website.</h1><p>Please try again soon.</p><a class="primary-button" href="/">Go home</a></section>`;
  }
})();
