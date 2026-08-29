const assert = require("node:assert/strict");
const fs = require("node:fs");

const script = fs.readFileSync(require.resolve("../script.js"), "utf8");
const html = fs.readFileSync(require.resolve("../index.html"), "utf8");

assert.match(html, /data-auth-state="logged-out" hidden/, "signed-out navigation must stay hidden while auth resolves");
assert.match(script, /APP_STATES\.AUTH_RESOLVING/, "auth initialization must begin in a resolving state");
assert.doesNotMatch(
  script.slice(script.indexOf("const ensureAccountForPublishing"), script.indexOf("const bindReadyScreenEvents")),
  /signInWithPassword/,
  "new-account publishing must never fall through to password login"
);
assert.match(script, /Check your email to finish creating your account/, "confirmation-required signup must be handled as success");
assert.match(script, /saveGuestSetupDraft\(\);\s*prepareAuthForOwnerAction\("publish"\)/, "pending drafts must survive confirmation");
assert.match(script, /authMode === "login"[\s\S]*signInWithPassword/, "returning users must use password login");
assert.match(script, /Create Account & Publish/, "claim-stage authentication must use the correct CTA");
assert.doesNotMatch(html, />Build My Website</, "authentication must not claim to build an already-created website");

console.log("auth flow regression tests passed");
