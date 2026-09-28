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
// link, and website-editor.js, both depend on this to land owners on the right tab). The
// Stripe Connect return redirect depends on ?view=payments landing on Payments the same way.
assert.match(dashboard, /initialView === "website" \|\| initialView === "payments" \? initialView : "overview"/, "?view=website and ?view=payments must open directly on their tabs");
assert.match(dashboard, /uploadWebsiteImage/, "website photos must be uploadable from the dashboard, not just classes");
assert.match(dashboard, /selectTheme/, "the theme picker must be wired to an immediate save");
assert.match(dashboard, /owner-nav-footer/, "the product shell must expose the website and owner profile in its sidebar");
assert.match(dashboard, /owner-overview-grid/, "the overview must include the operational main and right-rail layout");
assert.match(dashboard, /Upcoming Classes/);
assert.match(dashboard, /Recent Activity/);
assert.match(dashboard, /Create New Class/);
// The overview's "Quick Actions" rail card duplicated buttons already available elsewhere
// on the page (Create Class, View Registrations, Edit My Website) - removed as clutter.
assert.doesNotMatch(dashboard, /owner-rail-actions/, "the redundant Quick Actions card must not come back");

// Import from Instagram: lets an owner start a class from a recent post's photo/caption
// instead of typing from scratch. Must reuse the existing public feed endpoint (no new
// API route), stay gated behind having a payment method configured like any other new
// class, and never auto-publish - it only prefills the same review-before-save form.
assert.match(dashboard, /data-import-instagram/);
assert.match(dashboard, /const openInstagramPicker = async \(\) => \{/);
assert.match(dashboard, /\/api\/instagram\/feed\?businessId=/, "the picker must reuse the existing Instagram feed endpoint, not a new one");
assert.match(dashboard, /const openForm = \(index = -1, prefill = \{\}\) => /, "openForm must accept a prefill object so the picker can hand off into the normal class form");
assert.match(dashboard, /openForm\(-1, \{ description: String\(item\.caption/, "picking a post must open the normal editable class form, not publish directly");
assert.match(dashboard, /data-import-instagram.*hasPaymentMethod\(\)/, "importing from Instagram must respect the same payment-method gate as any other new class");

// A Stripe payment is confirmed automatically by the webhook - offering the manual
// "Mark as Pending" toggle (built for self-reported Venmo payments) on a Stripe-paid row
// implies the owner can revert a real, already-settled card charge, which isn't true.
assert.match(dashboard, /const isStripePaid = status === "paid" && item\.payment_method === "stripe"/, "Stripe-paid rows must be identified so the manual pending toggle can be hidden for them");
assert.match(dashboard, /status === "paid" && !isStripePaid/, "Mark as Pending must not render for a Stripe-paid registration");
// The status badge and its action button must share one grid cell so the row stays
// vertically centered instead of the button wrapping onto its own full-width row.
assert.match(dashboard, /class="owner-registration-status"/, "the status badge and action button must be grouped into a single column");
console.log("owner dashboard regression tests passed");
