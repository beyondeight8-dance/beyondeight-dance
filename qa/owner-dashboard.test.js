const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const dashboard = fs.readFileSync(path.join(root, "dashboard.js"), "utf8");
const editor = fs.readFileSync(path.join(root, "public-site.js"), "utf8");
const template = fs.readFileSync(path.join(root, "website-template.js"), "utf8");
assert.match(dashboard, /templates\.buildWebsiteContent/);
assert.match(dashboard, /saveWebsiteDraft/);
assert.match(dashboard, /publishWebsiteDraft/);
assert.match(dashboard, /listRegistrations/);
// The old "Website Views PRO" overview tile was a permanent "—" placeholder with no real
// data and no upgrade path. Replaced with a real, actionable stat: pending payment count.
assert.doesNotMatch(dashboard, /Website Views/, "the fake PRO stat placeholder must not come back");
assert.match(dashboard, /Pending Payments/);
assert.match(dashboard, /updateRegistrationStatus/, "registrations must be confirmable, not just listed");
assert.match(dashboard, /\["duplicate","Duplicate"\]/);
assert.match(dashboard, /\["toggle",item\.published/);
assert.match(dashboard, /\["delete","Delete"\]/);
assert.match(dashboard, /data-class-form/);
assert.match(dashboard, /uploadBusinessMedia/);
assert.match(dashboard, /highlighted/);
assert.match(template, /content\.classes\.filter\(\(item\) => item\.published !== false\)/);
assert.match(template, /data-book-class/);
assert.match(editor, /createRegistration/);
assert.match(editor, /Pay .* with Venmo/);
// Nav tabs with no real feature behind them must say so, not link to a dead editor section.
assert.match(dashboard, /UNBUILT_VIEWS = new Set\(\["instructors", "reviews", "analytics"\]\)/);
assert.match(dashboard, /comingSoon\("Instructors"/);
assert.match(dashboard, /comingSoon\("Reviews"/);
assert.match(dashboard, /comingSoon\("Analytics"/);
// A standalone "Social" nav tab was a dead placeholder that duplicated the Website panel's own
// Socials tab. It must stay removed rather than come back as a second, competing entry point.
assert.doesNotMatch(dashboard, /\["social","Social"\]/, "Social must not resurface as its own top-level nav tab");
// Class/registration search+filter must preserve the class's real array index, or actions
// (edit/duplicate/toggle/delete) target the wrong class once the list is filtered.
assert.match(dashboard, /const filteredClasses = \(\) => classes\(\)\.map\(\(item, index\) => \(\{ item, index \}\)\)/);
assert.match(dashboard, /list\.map\(\(\{ item, index \}\) => row\(item, index\)\)/);
assert.match(dashboard, /data-class-search/);
assert.match(dashboard, /data-registration-search/);

// Style Your Website: reachable directly via ?view=website (the live page's "Edit Website"
// link, and website-editor.js, both depend on this to land owners on the right tab).
assert.match(dashboard, /new URLSearchParams\(window\.location\.search\)\.get\("view"\) === "website" \? "website" : "overview"/, "?view=website must open directly on the Website tab");
assert.match(dashboard, /uploadWebsiteImage/, "website photos must be uploadable from the dashboard, not just classes");
assert.match(dashboard, /selectTheme/, "the theme picker must be wired to an immediate save");
assert.match(dashboard, /owner-nav-footer/, "the product shell must expose the website and owner profile in its sidebar");
assert.match(dashboard, /owner-overview-grid/, "the overview must include the operational main and right-rail layout");
assert.match(dashboard, /Upcoming Classes/);
assert.match(dashboard, /Recent Activity/);
assert.match(dashboard, /Create New Class/);
console.log("owner dashboard regression tests passed");
