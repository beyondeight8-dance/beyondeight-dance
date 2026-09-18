const assert = require("node:assert/strict");
const fs = require("node:fs");

const services = fs.readFileSync(require.resolve("../app-services.js"), "utf8");
const publicSite = fs.readFileSync(require.resolve("../public-site.js"), "utf8");
const templates = fs.readFileSync(require.resolve("../website-template.js"), "utf8");
const dashboard = fs.readFileSync(require.resolve("../dashboard.js"), "utf8");
const schema = fs.readFileSync(require.resolve("../supabase-owner-editor.sql"), "utf8");

assert.match(services, /\.eq\("owner_user_id", user\.id\)/, "owner mutations must verify authoritative ownership");
assert.match(services, /from\("website_drafts"\)\.upsert/, "drafts must save to the private draft table");
assert.match(services, /published_content: publishState/, "publishing must explicitly promote draft content");
assert.doesNotMatch(services.slice(services.indexOf("const getBusinessBundleBySlug"), services.indexOf("const assertBusinessOwner")), /website_drafts/, "public bundle must never query drafts");
assert.match(schema, /alter table public\.website_drafts enable row level security/, "draft table must enforce RLS");
assert.match(schema, /owner_user_id = auth\.uid\(\)/, "draft RLS must be owner scoped");
assert.match(publicSite, /bundle\?\.business\?\.owner_user_id === user\.id/, "the public page must require ownership before showing the owner toolbar");
assert.match(publicSite, /templates\.renderPublicSite/, "owner and visitor modes must share the public renderer");
assert.match(templates, /input\.mode === "public" \? website\.published_content : website\.draft_content/, "renderer must choose published or draft state by mode");
assert.match(publicSite, /const remoteBundle = await app\.getBusinessBundleBySlug\(slug\)/, "public page must query the live database before falling back to any cached preview");
assert.doesNotMatch(publicSite, /localSites\[slug\] \|\| await app\.getBusinessBundleBySlug/, "the pre-auth local preview cache must never take priority over live published data");

// Editing (appearance and classes) now happens exclusively in the Dashboard. The live public
// page must never re-grow a click-any-section drawer/modal editor - it only links back to the
// Dashboard for an owner, and stays a plain read-only renderer plus the booking flow otherwise.
assert.doesNotMatch(publicSite, /data-edit-section/, "the public page must not listen for on-page section edit clicks anymore");
assert.doesNotMatch(publicSite, /editMode/, "there must be no more in-place edit-mode toggle on the live page");
assert.doesNotMatch(publicSite, /openEditor|openClassesManager|editorBody|classDetailForm|classesGridView/, "the old drawer/modal editor must be fully removed from the public page");
assert.match(publicSite, /href="\/dashboard\/\?view=website">Edit Website</, "the owner toolbar must hand editing off to the dashboard's Website tab");

// Classes are managed exclusively from the Dashboard's Classes tab now - the public page must
// not offer its own class create/edit/delete affordances.
assert.doesNotMatch(publicSite, /data-class-edit|data-add-class|data-class-save|data-class-delete/, "the public page must not offer its own class editing controls");
assert.match(dashboard, /const classView = \(\)/, "classes stay managed exclusively on the dashboard's Classes tab");

// Style Your Website: a tabbed, appearance-only panel with exactly the five approved areas -
// Look/Theme, Hero, About Me, Gallery, Socials - and nothing else (no section labels/headings,
// no header/footer controls, no benefits/testimonials/FAQ/contact forms).
assert.match(dashboard, /const websiteTabs = \[\["look", "Look & Theme"\], \["hero", "Hero"\], \["about", "About Me"\], \["gallery", "Gallery"\], \["socials", "Socials"\]\]/, "the website panel must expose exactly the five approved areas");
assert.match(dashboard, /templates\.renderThemePicker\(draftState\.theme \|\| c\.theme\.name\)/, "the Look & Theme tab must offer a visual theme picker");
assert.match(dashboard, /photoCard\("Hero photo", "heroImage"/, "the Hero tab must offer a hero photo");
assert.match(dashboard, /photoCard\("Your photo", "instructorImage"/, "the About Me tab must offer an instructor photo");
assert.match(dashboard, /websiteGalleryTab/, "the Gallery tab must remain available");
assert.match(dashboard, /wfield\("Instagram", "instagram"/, "the Socials tab must offer social links");
assert.doesNotMatch(dashboard, /classesEyebrow|classesHeading|benefitsEyebrow|benefitsHeading|galleryEyebrow|galleryHeading|faqEyebrow|faqHeading|aboutEyebrow/, "section label/heading clutter must not resurface in the website panel");

console.log("owner editor architecture regression tests passed");
