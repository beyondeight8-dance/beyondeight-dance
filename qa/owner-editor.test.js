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

console.log("owner editor architecture regression tests passed");
