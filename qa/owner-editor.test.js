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
assert.match(publicSite, /previous\.map\(\(item, index\) => index === idx \? \{ \.\.\.item, \.\.\.values, published: values\.published !== "Draft" \} : item\)/, "editing one expanded class must not overwrite the rest of state.classes");
assert.doesNotMatch(publicSite, /state\.classes = \[\.\.\.form\.querySelectorAll\("\[data-class-index\]"\)\]\.map\(\(group, index\) => \{ const values[\s\S]{0,40}return \{ \.\.\.previous\[index\]/, "must not rebuild the full classes array from only the DOM fieldsets present");

// The "Why dance with me" benefits section previously had no data-edit-section and its content
// was always the hardcoded demo array, regardless of anything the owner typed - clicking it did
// nothing, and there was no way to change it at all.
assert.match(templates, /data-edit-section="benefits"/, "the benefits section must be clickable like every other section");
assert.match(templates, /benefits: Array\.isArray\(state\.benefits\)/, "benefits content must come from saved state, not always the hardcoded demo array");
assert.match(publicSite, /benefits: `\$\{field\("Section label", "benefitsEyebrow"/, "benefits must have an editor form, not just an on-page click target");

console.log("owner editor architecture regression tests passed");
