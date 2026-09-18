const assert = require("node:assert/strict");
const fs = require("node:fs");

const services = fs.readFileSync(require.resolve("../app-services.js"), "utf8");
const publicSite = fs.readFileSync(require.resolve("../public-site.js"), "utf8");
const templates = fs.readFileSync(require.resolve("../website-template.js"), "utf8");
const schema = fs.readFileSync(require.resolve("../supabase-owner-editor.sql"), "utf8");

assert.match(services, /\.eq\("owner_user_id", user\.id\)/, "owner mutations must verify authoritative ownership");
assert.match(services, /from\("website_drafts"\)\.upsert/, "drafts must save to the private draft table");
assert.match(services, /published_content: publishState/, "publishing must explicitly promote draft content");
assert.doesNotMatch(services.slice(services.indexOf("const getBusinessBundleBySlug"), services.indexOf("const assertBusinessOwner")), /website_drafts/, "public bundle must never query drafts");
assert.match(schema, /alter table public\.website_drafts enable row level security/, "draft table must enforce RLS");
assert.match(schema, /owner_user_id = auth\.uid\(\)/, "draft RLS must be owner scoped");
assert.match(publicSite, /bundle\?\.business\?\.owner_user_id === user\.id|publicBundle\.business\.owner_user_id === user\.id/, "editor UI must require ownership");
assert.match(publicSite, /templates\.renderPublicSite/, "owner and visitor modes must share the public renderer");
assert.match(templates, /input\.mode === "public" \? website\.published_content : website\.draft_content/, "renderer must choose published or draft state by mode");
assert.match(publicSite, /const remoteBundle = await app\.getBusinessBundleBySlug\(slug\)/, "public page must query the live database before falling back to any cached preview");
assert.doesNotMatch(publicSite, /localSites\[slug\] \|\| await app\.getBusinessBundleBySlug/, "the pre-auth local preview cache must never take priority over live published data");

// The classes editor shows only the expanded class's fieldset in the DOM at a time (a compact
// summary row for every other class), so rebuilding state.classes from a querySelectorAll over
// [data-class-index] must scope to that one class by its own index - not reassign the whole
// array from whatever fieldsets happen to be present, which would silently drop every other
// class from state the moment more than one exists.
assert.match(publicSite, /previous\.map\(\(item, index\) => index === idx \? \{ \.\.\.item, \.\.\.values \} : item\)/, "editing one expanded class must not overwrite the rest of state.classes");
assert.doesNotMatch(publicSite, /state\.classes = \[\.\.\.form\.querySelectorAll\("\[data-class-index\]"\)\]\.map\(\(group, index\) => \{ const values[\s\S]{0,40}return \{ \.\.\.previous\[index\]/, "must not rebuild the full classes array from only the DOM fieldsets present");
// Status is now set only by the explicit Save as Draft / Publish buttons, not a form field
// scanned by updateStateFromForm - there must be no "published" select left for that scan to
// misread (an absent field would otherwise make `values.published !== "Draft"` always true).
assert.doesNotMatch(publicSite, /selectField\("Status", "published"/, "class status must be set by explicit Save as Draft/Publish actions, not a status field");
assert.match(publicSite, /data-class-save="draft">Save as Draft/, "classes must offer an explicit Save as Draft action");
assert.match(publicSite, /data-class-save="publish">Publish/, "classes must offer an explicit Publish action");

// The "Why dance with me" benefits section previously had no data-edit-section and its content
// was always the hardcoded demo array, regardless of anything the owner typed - clicking it did
// nothing, and there was no way to change it at all.
assert.match(templates, /data-edit-section="benefits"/, "the benefits section must be clickable like every other section");
assert.match(templates, /benefits: Array\.isArray\(state\.benefits\)/, "benefits content must come from saved state, not always the hardcoded demo array");
assert.match(publicSite, /benefits: `\$\{field\("Section label", "benefitsEyebrow"/, "benefits must have an editor form, not just an on-page click target");

// Classes now open a card-grid + expand-to-edit modal instead of the side drawer used by every
// other section. The focus-restore logic keys off [data-owner-drawer] OR [data-classes-modal] -
// if a future edit only checks the drawer again, typing in a class field will silently stop
// restoring cursor focus after every keystroke (the same bug class already fixed once for the
// drawer itself).
assert.match(publicSite, /const openClassesManager = \(focus = true\) => \{/, "classes must have their own manager, not the shared section drawer");
assert.doesNotMatch(publicSite, /classes: `<div class="owner-section-intro-fields"/, "classes must not go back through the generic editorBody/drawer path");
assert.match(publicSite, /data-owner-drawer\] \[name\], \[data-classes-modal\] \[name\]/, "focus-restore must cover both the drawer and the classes modal");
assert.match(publicSite, /owner-class-card-add" data-add-class/, "the classes grid must offer an explicit Add Class card");

// A class card is <article> wrapping its own <button> (edit) and <details> (menu) - a <button>
// cannot legally contain another interactive element, and nesting one would make the browser
// break the DOM apart in a way that silently breaks click handling for whichever control lands
// outside the resulting tree.
assert.doesNotMatch(publicSite, /<button type="button" class="owner-class-card\$\{/, "a class card must not itself be a <button> wrapping other interactive controls");
assert.match(publicSite, /<article class="owner-class-card/, "a class card must be a non-interactive container");
assert.match(publicSite, /class="owner-class-card-edit" data-class-edit/, "each card needs its own explicit Edit control, not just a click-anywhere card");
assert.match(publicSite, /class="owner-card-menu"/, "each card needs a secondary-actions menu");

console.log("owner editor architecture regression tests passed");
