const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const html = fs.readFileSync(require.resolve("../index.html"), "utf8");
const script = fs.readFileSync(require.resolve("../script.js"), "utf8");
const css = fs.readFileSync(require.resolve("../onboarding.css"), "utf8");
assert.equal((html.match(/data-workspace-step="/g) || []).length, 5);
assert.equal((html.match(/data-setup-step="/g) || []).length, 4, "saved step indices remain compatible");
assert.match(html, /setup-theme-picker" hidden/, "theme selection remains internal, not a visible step");
for (const name of ["businessName", "businessSlug", "tagline", "instagram", "tiktok", "youtube", "website", "whatYouDo", "mission", "whyJoin", "publishEmail", "publishPassword"]) {
  assert.ok(html.includes('name="' + name + '"'), name + " is retained");
}
assert.doesNotMatch(html, /setup-story-preview/);
assert.match(css, /@media \(max-width: 800px\)/);
assert.match(css, /onboarding-sidebar \{ display: none;/);

const publish = script.slice(script.indexOf("const publishCurrentSetup ="), script.indexOf('setupForm?.addEventListener("submit"'));
async function run(result, error) {
  const link = {};
  const context = {
    readyPublishButton: {disabled: false}, setupMessage: {textContent: ""},
    setupPublished: false, clearGuestSetupDraft() { this.cleared = true; },
    finalizeWebsitePublish: async () => { if (error) throw error; return result; },
    getSetupState: () => ({slug: "draft-slug"}),
    document: {querySelector: () => link},
    setText(selector, value) { context.domain = value; },
    updateSetupStep() { context.rendered = true; },
    updateSetupPreview() {}, setupModal: {scrollTo() {}},
    console: {warn() {}}
  };
  vm.createContext(context);
  await vm.runInContext(publish + "\npublishCurrentSetup();", context);
  return {context, link};
}
(async () => {
  const success = await run({business: {slug: "published-studio"}});
  assert.equal(success.context.setupPublished, true);
  assert.equal(success.link.href, "/published-studio?owner=1");
  assert.equal(success.context.domain, "beyond8dance.com/published-studio");
  assert.equal(success.context.readyPublishButton.disabled, false);
  const failure = await run(null, new Error("Publish failed"));
  assert.equal(failure.context.setupPublished, false);
  assert.equal(failure.context.setupMessage.textContent, "Publish failed");
  assert.equal(failure.context.readyPublishButton.disabled, false);
  const invalid = await run(null);
  assert.equal(invalid.context.setupPublished, false);
  console.log("Onboarding fields, step compatibility, launch success and failure checks passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
