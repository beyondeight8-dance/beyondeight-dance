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
assert.doesNotMatch(dashboard, /edit=classes&new=1/);
assert.match(editor, /data-editor-nav="\$\{key\}"/);
assert.match(editor, /\["classes", "Classes"\]/);
// "Edit Website" (toolbar button, or ?owner=1 with no ?edit=) must land on the live page
// with click-to-edit affordances, not force a specific section's drawer open. A drawer only
// opens when the owner clicks an actual on-page section, or an explicit ?edit= deep link.
assert.doesNotMatch(editor, /data-owner-edit.*openEditor\(/, "Edit Website must not force any editor section open");
assert.match(editor, /if \(editMode && requestedEditor\) openEditor\(requestedEditor\)/, "only an explicit ?edit= deep link may open a section automatically");
assert.match(editor, /data-move-gallery/);
assert.match(editor, /data-remove-gallery/);
assert.match(editor, /uploadBusinessMedia/);
assert.match(template, /content\.classes\.filter\(\(item\) => item\.published !== false\)/);
assert.match(template, /data-book-class/);
assert.match(editor, /createRegistration/);
assert.match(editor, /Pay .* with Venmo/);
// Nav tabs with no real feature behind them must say so, not link to a dead editor section.
assert.match(dashboard, /UNBUILT_VIEWS = new Set\(\["instructors", "reviews", "analytics"\]\)/);
assert.doesNotMatch(dashboard, /edit=\$\{title\.toLowerCase\(\)\}/, "unbuilt tabs must not link to a website-editor section that does not exist");
assert.match(dashboard, /comingSoon\("Instructors"/);
assert.match(dashboard, /comingSoon\("Reviews"/);
assert.match(dashboard, /comingSoon\("Analytics"/);
assert.match(dashboard, /social: \(\) => placeholder\("Social"\)/, "Social opens the live editor like every other dashboard entry point, not a forced section");
assert.doesNotMatch(dashboard, /\?owner=1&edit=/, "no dashboard link should force a specific editor section open");
assert.match(template, /data-instagram-feed data-edit-section="social"/, "the Instagram/social area must be clickable in edit mode like every other section");
// Class/registration search+filter must preserve the class's real array index, or actions
// (edit/duplicate/toggle/delete) target the wrong class once the list is filtered.
assert.match(dashboard, /const filteredClasses = \(\) => classes\(\)\.map\(\(item, index\) => \(\{ item, index \}\)\)/);
assert.match(dashboard, /list\.map\(\(\{ item, index \}\) => row\(item, index\)\)/);
assert.match(dashboard, /data-class-search/);
assert.match(dashboard, /data-registration-search/);
console.log("owner dashboard regression tests passed");
