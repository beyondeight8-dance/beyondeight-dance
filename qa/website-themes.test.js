const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

// website-template.js is a browser IIFE that attaches to window - stub just enough to load it.
global.window = global;
window.location = { origin: "https://beyond8dance.com", href: "https://beyond8dance.com/" };
require(path.join(root, "website-template.js"));
const templates = window.BeyondEightWebsiteTemplates;

const publicSite = fs.readFileSync(path.join(root, "public-site.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const publicStyles = fs.readFileSync(path.join(root, "public-site.css"), "utf8");
const templateSrc = fs.readFileSync(path.join(root, "website-template.js"), "utf8");

// The six approved themes, exactly - not five, not a seventh added later, and each must own a
// real key used to key CSS custom properties.
const expectedThemes = ["Editorial", "Studio", "Electric", "Noir", "Muse", "Motion"];
assert.deepEqual(templates.themes.map((theme) => theme.name), expectedThemes, "must ship exactly these six themes, in this order");
assert.deepEqual(templates.themes.map((theme) => theme.key), ["editorial", "studio", "electric", "noir", "muse", "motion"]);

// Legacy stored theme names (from before this redesign) must still resolve to a real theme
// rather than crashing or silently falling through to an undefined theme.
const legacyMap = {
  "Default Elegant": "Editorial",
  "Bold & Edgy": "Electric",
  "Soft & Graceful": "Muse",
  "Vibrant & Playful": "Motion",
  "Minimal Black": "Noir",
  "": "Editorial",
  "some garbage value": "Editorial"
};
for (const [legacy, expected] of Object.entries(legacyMap)) {
  assert.equal(templates.canonicalThemeName(legacy), expected, `legacy theme name "${legacy}" must map to ${expected}`);
}

// Build one realistic, fully-populated business (real class images, a draft class, a class with
// registration closed) and render it under every theme - the same content model must survive
// unchanged regardless of which theme renders it.
const business = {
  businessId: "biz-1",
  businessName: "Tanvi Kinkhabwala",
  tagline: "Move with purpose. Dance with passion.",
  whatYouDo: "Bollywood, hip hop, and heels classes for every level.",
  styles: ["Bollywood", "Hip Hop", "Heels", "Contemporary"],
  instructorName: "Tanvi Kinkhabwala",
  instructorBio: "Tanvi has trained dancers for over a decade.",
  heroImage: "https://cdn.example.com/real-hero.jpg",
  instructorImage: "https://cdn.example.com/real-instructor.jpg",
  gallery: ["https://cdn.example.com/g1.jpg", "https://cdn.example.com/g2.jpg"],
  testimonials: [["Maya R.", "Amazing energy from the first count."]],
  faqs: [["Do I need experience?", "No, all levels welcome."]],
  benefits: [["Beginner-Friendly", "Clear progressions for new dancers."]],
  classes: [
    { id: "c1", title: "Bollywood Fusion", style: "Bollywood", date: "2026-09-27", time: "19:00", level: "Open Level", price: 25, capacity: 20, instructor: "Tanvi", location: "Studio A", image: "https://cdn.example.com/class1.jpg", published: true, registrationOpen: true },
    { id: "c2", title: "Choreography Lab", style: "Hip Hop", date: "2026-10-04", time: "18:00", level: "Intermediate", price: 30, capacity: 20, instructor: "Tanvi", location: "Studio B", image: "https://cdn.example.com/class2.jpg", published: true, registrationOpen: false },
    { id: "c3", title: "Draft Class", style: "Jazz", date: "2026-11-01", time: "12:00", level: "Open", price: 20, capacity: 10, instructor: "Tanvi", location: "Studio A", image: "", published: false, registrationOpen: true }
  ]
};

const classesLayoutByTheme = {};
for (const theme of templates.themes) {
  const content = templates.buildWebsiteContent({ ...business, theme: theme.name });

  // Same underlying data every time - theme choice is presentation only.
  assert.equal(content.classes.length, 3, `${theme.name}: class count must be unchanged`);
  assert.equal(content.classes[0].title, "Bollywood Fusion");
  assert.equal(content.gallery.length, 2, `${theme.name}: gallery must be unchanged`);
  assert.equal(content.testimonials.length, 1, `${theme.name}: testimonials must be unchanged`);
  assert.equal(content.faqs.length, 1, `${theme.name}: faqs must be unchanged`);
  assert.equal(content.benefits.length, 1, `${theme.name}: benefits must be unchanged`);

  const html = templates.renderPublicSite(content, { ownerToolbar: "", logoUrl: "" });
  assert.match(html, new RegExp(`data-theme-key="${theme.key}"`), `${theme.name}: root must carry its own theme key`);
  assert.match(html, /approved-public-site/, `${theme.name}: public output must use the approved canonical layout`);
  assert.match(html, /public-editorial-hero/, `${theme.name}: public output must use the approved editorial hero`);
  assert.match(html, /class1\.jpg/, `${theme.name}: real class image must render`);
  assert.match(html, /real-hero\.jpg|real-instructor\.jpg/, `${theme.name}: real hero/about image must render`);
  // Published classes keep their booking button; the unpublished draft never renders at all.
  assert.match(html, /data-book-class="c1"/, `${theme.name}: published class must keep its booking button`);
  assert.doesNotMatch(html, /Draft Class/, `${theme.name}: unpublished class must not render`);
  // A class with registrationOpen:false must be visibly closed, not silently bookable.
  assert.match(html, /Registration Closed|✕/, `${theme.name}: closed registration must be shown, not hidden`);

  classesLayoutByTheme[theme.key] = theme.classesLayout;
}

// The six themes must not just be five color variants plus a repeat - Editorial and Muse
// intentionally share one structural family (editorial cards), everything else is distinct.
const layoutFamilies = new Set(Object.values(classesLayoutByTheme));
assert.ok(layoutFamilies.size >= 5, "class-list layouts must span at least 5 structurally distinct families across six themes");
assert.equal(classesLayoutByTheme.editorial, classesLayoutByTheme.muse, "Editorial and Muse intentionally share one card family");
assert.notEqual(classesLayoutByTheme.editorial, classesLayoutByTheme.studio);
assert.notEqual(classesLayoutByTheme.studio, classesLayoutByTheme.electric);
assert.notEqual(classesLayoutByTheme.electric, classesLayoutByTheme.noir);
assert.notEqual(classesLayoutByTheme.noir, classesLayoutByTheme.motion);

// Theme metadata remains intact for the paused theme picker, while the public path uses one
// canonical approved design.
assert.ok(new Set(Object.values(classesLayoutByTheme)).size >= 5, "paused theme architecture must remain available");

// A business with zero real classes renders an honest empty state, never demo classes.
for (const theme of templates.themes) {
  const content = templates.buildWebsiteContent({ businessName: "New Biz", theme: theme.name });
  assert.equal(content.classes.length, 0, `${theme.name}: no saved classes must stay empty`);
  const html = templates.renderPublicSite(content, {});
  assert.match(html, /New classes coming soon/);
  assert.doesNotMatch(html, /data-book-class=/);
}

const sparse = templates.buildWebsiteContent({ businessName: "Real Choreographer", classes: [{ id: "one", title: "An Intentionally Very Long Choreography Class Name That Must Wrap Cleanly", published: true, registrationOpen: true }], testimonials: [], faqs: [], gallery: [], heroImage: "", instructorImage: "" });
const sparseHtml = templates.renderPublicSite(sparse, {});
assert.match(sparseHtml, /data-book-class="one"/, "a single real class must stay bookable");
assert.match(sparseHtml, /An Intentionally Very Long Choreography Class Name That Must Wrap Cleanly/);
assert.doesNotMatch(sparseHtml, /public-editorial-reviews/, "reviews must be hidden when no real reviews exist");
assert.doesNotMatch(sparseHtml, /id="gallery"/, "gallery must be hidden when no real gallery exists");
assert.doesNotMatch(sparseHtml, /<img[^>]+src=""/, "missing optional images must not create broken image elements");
assert.doesNotMatch(sparseHtml, /Maya R\.|Amazing energy|Heels Foundations/, "public output must not contain synthetic sample content");
assert.match(publicStyles, /@media \(max-width: 640px\)/, "the approved public site must include a deliberate mobile layout");

// Classes are managed exclusively on the Dashboard's Classes tab, not re-introduced here.
assert.doesNotMatch(publicSite, /data-class-edit|data-add-class|data-class-save/, "theming work must not reintroduce class editing into the public page");

// No old theme identity should linger anywhere a real theme key is matched.
for (const oldKey of ["elegant", "bold", "soft", "vibrant", "minimal"]) {
  assert.doesNotMatch(styles, new RegExp(`data-theme-key="${oldKey}"`), `styles.css must not reference the retired "${oldKey}" theme key`);
  assert.doesNotMatch(templateSrc, new RegExp(`key: "${oldKey}"`), `website-template.js must not define a theme with the retired "${oldKey}" key`);
}

// Regression guard: the sticky nav, mobile menu, footer, and contact-action buttons once used
// only var(--template-*) custom properties that are never defined anywhere in this file, so
// those elements always rendered hardcoded light colors no matter which theme was selected (a
// light-cream footer on the dark Noir theme, for example - "the theme applying throughout the
// site, not just part of it"). Every themed background/color declaration must resolve through a
// real --site-* token before it may fall back to the dead --template-* name.
assert.doesNotMatch(styles, /background:\s*var\(--template-(?![\s\S]*--site-)/, "a background must never use --template-* without a --site-* theme token first");
assert.doesNotMatch(styles, /color:\s*var\(--template-(?![\s\S]*--site-)/, "a text color must never use --template-* without a --site-* theme token first");
assert.match(styles, /background: color-mix\(in srgb, var\(--footer-bg, var\(--site-page, var\(--template-footer,/, "the footer background must resolve through a real theme token, not the dead --template-footer fallback");

// Regression guard: Noir's full-bleed hero must stay height-capped. It previously had only a
// min-height (vh-based, so viewport/print-context quirks could make it dramatically taller than
// intended, dwarfing every other section on the page).
assert.match(styles, /\.theme-hero-noir\s*\{[^}]*max-height: 720px/, "the Noir hero must have a hard max-height cap, not just a vh-based min-height");

console.log("website theme system regression tests passed");
