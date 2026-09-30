const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const dashboard = fs.readFileSync(path.join(root, "dashboard.js"), "utf8");
const editor = fs.readFileSync(path.join(root, "public-site.js"), "utf8");
const template = fs.readFileSync(path.join(root, "website-template.js"), "utf8");
const productUi = fs.readFileSync(path.join(root, "product-ui.css"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const dashboardIndex = fs.readFileSync(path.join(root, "dashboard", "index.html"), "utf8");
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
assert.match(dashboard, /\["toggle",isDraft \? "Publish" : "Unpublish"\]/);
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
assert.match(dashboard, /const filteredClasses = \(\) => \{.*classes\(\)\.map\(\(item, index\) => \(\{ item, index \}\)\)/);
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
// Registrations redesign: the Mark as Paid/Pending action moved out of an always-visible
// inline button into the same kebab-menu pattern used on the Classes page, so the row stays
// a clean fixed-height table row instead of wrapping when the action button is present.
assert.match(dashboard, /<details class="owner-class-menu" name="reg-menu">/, "the registration row action must live in the shared kebab-menu pattern");

// Overview redesign: the brand logo and logout control moved from a static top header
// (dashboard/index.html) into the dynamically-rendered sidebar (nav()), so the logout
// button now only exists after dashboard.js renders - it must be bound inside bind()
// (re-queried on every render), not once at module load against a static element that no
// longer exists.
assert.doesNotMatch(dashboardIndex, /<header class="route-header">/, "the standalone top header must not come back now that the brand+logout live in the sidebar");
assert.doesNotMatch(dashboard, /const logout = document\.querySelector\("\[data-dashboard-logout\]"\)/, "logout must not be queried once at module load against a static element");
assert.match(dashboard, /root\.querySelector\("\[data-dashboard-logout\]"\)\?\.addEventListener\("click"/, "logout must be bound inside bind(), re-queried after every render");
assert.match(dashboard, /class="owner-nav-brand"/, "the sidebar must render its own brand logo");
assert.match(dashboard, /\["payments","Payments","card"\],\["website","Website","globe"\]/, "nav order must match the approved design (Payments before Website)");

// Two real naming collisions with older, unrelated CSS were found live while building this
// redesign: (1) a legacy `.owner-nav span` rule (styles.css, written for the old Soon badge
// span) matched every span inside the new sidebar - icons, the brand mark, the brand name -
// painting them as dark 999px pills; (2) a completely different pre-existing
// `.owner-quick-actions` rule (styles.css, `grid-template-columns: 180px 1fr`) silently forced
// the new Quick Actions card into a broken 2-column layout. Locks in both fixes.
assert.doesNotMatch(styles, /\.owner-nav span,/, "the legacy .owner-nav span badge rule must not come back and clobber the new sidebar's icons/brand spans");
assert.doesNotMatch(dashboard, /class="owner-quick-actions"/, "must not reuse the .owner-quick-actions class name - it collides with an older, unrelated 180px/1fr grid rule in styles.css");
assert.match(dashboard, /class="owner-quick-panel"/, "the Quick Actions card must use its own non-colliding class name");
assert.match(productUi, /\.owner-quick-panel \{ display: grid;/, "the Quick Actions card's own grid rule must exist under its non-colliding name");

// The "Your Website" card's photo overlay text must be the business's own real headline,
// never an invented tagline - and it must render above the darkening gradient (both are
// position: absolute with no natural stacking order without an explicit z-index).
assert.match(dashboard, /siteContent\.headline/, "the site card's overlay text must be the business's real headline, not invented copy");
assert.match(productUi, /\.owner-site-tagline \{ position: absolute; z-index: 1;/, "the tagline must sit above the darkening gradient overlay via z-index, not rely on paint order");

// The time-of-day emoji next to the greeting ("Good evening 🌙") was removed at the
// user's request - must not come back.
assert.doesNotMatch(dashboard, /greetingEmoji/, "the time-of-day greeting emoji must not come back");
assert.doesNotMatch(dashboard, /owner-welcome-emoji/, "the greeting emoji wrapper span must not come back");

// Classes redesign: card-based rows (photo, icon fact row, tag pills, big registered count,
// status pill, primary action, kebab menu) replacing the old thin owner-class-row list.
assert.match(dashboard, /class="owner-class-card\$\{item\.highlighted/, "class rows must use the new card layout, not the old thin owner-class-row");
assert.match(dashboard, /class="owner-class-media"/);
assert.match(dashboard, /class="owner-class-facts"/);
assert.match(dashboard, /class="owner-class-tags"/);
assert.match(dashboard, /class="owner-class-count"/);
assert.match(dashboard, /class="owner-class-primary/);
assert.match(dashboard, /class="owner-class-menu" name="class-menu"/, "kebab menus must share a name so opening one closes any other open menu (native <details> exclusivity)");
// Placeholder-image system: never falls back to a generic unrelated stock photo. Empty until
// real, style-matched photos are wired into CLASS_STYLE_IMAGES; until then the card shows the
// same clean initial-letter placeholder used elsewhere in the product, never a stock photo.
assert.match(dashboard, /const classFallbackImage = \(style\) => \{/);
assert.match(dashboard, /const classImage = \(item\) => imageUrl\(item\.image\) \|\| classFallbackImage\(item\.style\)/);
assert.match(dashboard, /owner-class-media-empty/, "no real photo must fall back to the initial-letter placeholder, not a generic stock image");
// Upcoming/Past/All-dates and class-type (style) filters, built from the owner's real class
// styles - never a hardcoded style taxonomy.
assert.match(dashboard, /const classStyleOptions = \(\) => \{/);
assert.match(dashboard, /data-class-time-filter/);
assert.match(dashboard, /data-class-style-filter/);
assert.match(dashboard, /classFilter\.time=event\.target\.value/, "the time filter select must be wired in bind()");
assert.match(dashboard, /classFilter\.style=event\.target\.value/, "the style filter select must be wired in bind()");
// Proactive collision check (established after two real bugs this session where a new class
// name silently inherited an older, unrelated rule from styles.css) - the old thin-row classes
// must be fully retired from both stylesheets, not left as dead/colliding rules.
assert.doesNotMatch(productUi, /\.owner-class-row \{/, "the old thin owner-class-row grid rule must be fully replaced by owner-class-card, not left dead");
assert.doesNotMatch(styles, /\.owner-class-card \{|\.owner-class-media \{|\.owner-class-facts \{|\.owner-class-menu \{/, "none of the new Classes-card class names may collide with older rules in styles.css");

// Registrations redesign: stat cards (reusing the same statCard()/owner-stat-cards pattern as
// the Overview page), a table-style list (student/class/date/status/amount/actions), and
// class-type + sort filters alongside the existing search/status filters.
assert.match(dashboard, /const registrationClassOptions = \(\) => \{/, "the class filter must be built from the owner's real registrations, never a hardcoded list");
assert.match(dashboard, /data-registration-class-filter/);
assert.match(dashboard, /data-registration-sort/);
assert.match(dashboard, /registrationFilter\.classId=event\.target\.value/, "the class filter select must be wired in bind()");
assert.match(dashboard, /registrationFilter\.sort=event\.target\.value/, "the sort select must be wired in bind()");
assert.match(dashboard, /class="owner-reg-row"/);
assert.match(dashboard, /class="owner-reg-student"/);
assert.match(dashboard, /class="owner-reg-avatar"/);
assert.match(dashboard, /class="owner-reg-class"/);
assert.match(dashboard, /class="owner-reg-status /);
assert.match(dashboard, /class="owner-reg-amount"/);
assert.match(dashboard, /statCard\("dollar", `\$\$\{totalRevenue\.toFixed\(2\)\}`, "Total Revenue", "all time"\)/, "the revenue stat must be a real computed sum, not a placeholder");
// Revenue must only count registrations actually confirmed paid - counting pending/unpaid
// registrations would overstate real revenue.
assert.match(dashboard, /registrations\.filter\(\(item\) => item\.payment_status === "paid"\)\.reduce/, "Total Revenue must only sum confirmed-paid registrations");
// Export must be a real client-side CSV of what's currently filtered/sorted (what the owner is
// looking at), never a fake/disabled button.
assert.match(dashboard, /data-export-registrations/);
assert.match(dashboard, /const exportRegistrations = \(\) => \{/);
assert.match(dashboard, /new Blob\(\[csv\], \{ type: "text\/csv/, "export must produce a real CSV file, not a stubbed action");
// Collision guard, same discipline as the Classes redesign: none of the new owner-reg-* class
// names may collide with older rules in styles.css.
assert.doesNotMatch(styles, /\.owner-reg-row \{|\.owner-reg-student \{|\.owner-reg-class \{|\.owner-reg-status \{|\.owner-reg-avatar \{/, "none of the new Registrations-table class names may collide with older rules in styles.css");
// Real bug found live while building this redesign: `.owner-reg-student span` (meant to style
// only the email line) also matched the avatar span, since the avatar is a <span> too - it
// silently overrode the avatar's centered-grid layout and blush color with the email's
// block/muted-gray style, making the initial letter invisible. Locks in the scoped fix.
assert.doesNotMatch(productUi, /\.owner-reg-student span,\s*\n\.dashboard-route \.owner-reg-class span/, "the email/meta span rule must not broaden back to match the avatar span too");
assert.match(productUi, /\.owner-reg-student > div > span/, "the email span rule must stay scoped to the nested text div, not every span in the row");

// The sidebar's "Log out" control must carry the same icon+label treatment as every other
// sidebar link (View My Website, the nav tabs) - plain text with an icon, no button chrome at
// rest. A filled pink box was only ever its :hover state, never a resting-state bug, but the
// icon itself was genuinely missing until this pass.
assert.match(dashboard, /data-dashboard-logout>\$\{navIcon\("logout"\)\}<span>Log out<\/span>/, "the logout control must show the door/arrow icon alongside its label");
assert.match(dashboard, /logout: `<svg viewBox="0 0 24 24"/, "a dedicated logout icon must exist in the shared ICONS set");

console.log("owner dashboard regression tests passed");
