const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dashboard = fs.readFileSync(path.join(root, "dashboard.js"), "utf8");
const editor = fs.readFileSync(path.join(root, "public-site.js"), "utf8");
const template = fs.readFileSync(path.join(root, "website-template.js"), "utf8");

assert.match(dashboard, /templates\.buildWebsiteContent/, "Dashboard must render the shared website state.");
assert.match(dashboard, /saveWebsiteDraft/, "Class operations must save private drafts.");
assert.match(dashboard, /publishWebsiteDraft/, "Dashboard must publish through the shared draft promotion path.");
assert.match(dashboard, /Registration data will appear after booking is connected/, "Unavailable registration data must be disclosed.");
assert.match(dashboard, /Website Views[\s\S]*<strong>—<\/strong>/, "Locked analytics must not contain invented traffic values.");
assert.match(dashboard, /data-class-action="duplicate"/, "Owners must be able to duplicate classes.");
assert.match(dashboard, /data-class-action="toggle"/, "Owners must be able to publish and unpublish classes.");
assert.match(dashboard, /data-class-action="delete"/, "Owners must be able to delete classes.");

assert.match(editor, /data-editor-nav="\$\{key\}"/, "Website editor must render unified section navigation.");
assert.match(editor, /\["classes", "Classes"\]/, "Classes must be the first editor section.");
assert.match(editor, /openEditor\("classes"\)/, "Entering edit mode must default to Classes.");
assert.match(editor, /data-move-gallery/, "Gallery images must support reordering.");
assert.match(editor, /data-remove-gallery/, "Gallery images must support removal.");
assert.match(editor, /uploadBusinessMedia/, "Owner images must use authenticated business media storage.");
assert.match(template, /content\.classes\.filter\(\(item\) => item\.published !== false\)/, "Draft classes must stay off the public website.");

console.log("owner dashboard regression tests passed");
