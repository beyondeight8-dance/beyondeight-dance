const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'homepage.css'), 'utf8');

assert.match(html, /class="home-restyle"/);
assert.match(html, /homepage\.css/);
assert.match(html, /id="how-it-works"/);
assert.match(html, /id="about"/);
// Content-restructuring pass: "How it works" now walks the full product journey end to end,
// starting with the website - per explicit feedback, the site-builder visual used to live in
// its own standalone section ahead of this one, which read as "the most important step is
// missing" once a reader landed on this section specifically. Folded in as the first step so
// the whole journey (site -> dashboard -> add a class -> choose Venmo/Stripe -> register & pay
// -> roster builds itself) lives in one place - 6 steps, not 5. The reminder/notifications
// step still must not come back since no automated reminder feature actually exists (no email
// sending exists anywhere in this codebase - don't claim functionality that isn't real).
assert.equal((html.match(/<li class="ed-step/g) || []).length, 6);
assert.doesNotMatch(html, /confirmation email has been sent/i, "no fake email-confirmation claim - no email sending exists in this codebase");
assert.doesNotMatch(html, /class reminder/i, "no fake automated-reminder claim - no reminder feature exists in this codebase");

// The Venmo flow is a real external link the student must click, then self-report - it is
// NOT confirmed automatically like card payment. The original copy ("Card or Venmo, right
// on your page. No separate link to chase.") overclaimed this; must not regress.
assert.doesNotMatch(html, /Card or Venmo, right on your page/i, "must not overclaim that Venmo is inline/automatic like card payment");
assert.doesNotMatch(html, /No separate link to chase/i, "Venmo genuinely is a separate external link - this claim was inaccurate");
assert.match(html, /confirmed automatically/i, "card payment's real automatic confirmation should still be called out");

// Brand motif removed entirely per explicit direction: it read as too conceptual, and
// numbering the journey 5,6,7 implied steps 1-4 were missing. Must not resurface, and must
// not be replaced by a plain 1,2,3 numbering system either unless deliberately reintroduced.
assert.doesNotMatch(html, /class="ed-count"/, "the 5-6-7-8 count-off divider must not come back");
assert.doesNotMatch(html, /ed-step-count/, "step numbering must not come back");
assert.doesNotMatch(css, /content: "8"/, "the oversized background '8' watermark (part of the same motif system) must not come back either");
// The header keeps both "Log In" and its own "Get Started" button - a first pass dropped the
// latter, but that wasn't actually what was asked for, so it's back. Separately, the
// Growth/Scale pricing tiers route to "Book a demo" (data-request-demo-plan) instead of
// instant self-serve signup, since they're paid plans. The free Starter tier, the header, the
// hero, and the closing CTA all still use data-open-setup.
assert.ok((html.match(/data-open-setup/g) || []).length >= 4);
assert.match(html, /header-cta/, "the header's own Get Started button must exist");
assert.equal((html.match(/data-request-demo-plan/g) || []).length, 2, "Growth and Scale should both route to Book a demo");
assert.equal((html.match(/>Book a demo</g) || []).length, 2, "both paid tiers must show the real 'Book a demo' label");
assert.equal((html.match(/>Get Started Free</g) || []).length, 1, "only the free Starter tier (plus the hero/launch CTAs, which use the longer 'Get Started Free →' form) should offer self-serve signup");
// Real bug found live: the per-plan "Request a demo" modal (.plan-demo-modal/.plan-demo-form)
// is reached from this homepage for the first time now that the pricing tiers open it, and -
// same as the auth modal and comparison modal before they got scoped overrides - it fell
// straight through to the old bright orange-glow panel background, magenta/orange gradient
// submit button, and pink focus ring, since nothing scoped its colors to this page.
assert.match(css, /\.home-restyle \.plan-demo-form button \{[^}]*background: var\(--home-rose\)/, "the demo-request button must use the redesign's rose, not the legacy orange/magenta gradient");
assert.match(css, /\.home-restyle \.plan-demo-form input:focus/, "the demo-request email field must get a rose focus ring, not the legacy pink one");
for (const hook of ['data-open-auth-login', 'data-open-comparison', 'auth-modal', 'setup-modal', 'comparison-modal']) {
  assert.ok(html.includes(hook), `Existing ${hook} flow remains available`);
}
assert.match(css, /@media \(max-width: 640px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.ok(!css.includes('font-size: clamp('), 'Typography uses fixed responsive sizes (the font shorthand, e.g. font: 400 clamp(...), is fine)');

// The logo <img> was swapped for a tightly-cropped mark with almost no internal padding.
// A leftover transform: scale(2.6) here (tuned to zoom into the OLD logo's large padding)
// over-crops the new artwork and chops off the raised arm - hit live in the onboarding
// modal, which shares this same .home-restyle header markup.
assert.doesNotMatch(css, /\.home-restyle \.brand-mark img \{[^}]*transform:\s*scale\(2\.6\)/, "the old padding-compensation zoom on the logo must not come back");

// Round one: the chaos cards used to be scattered and individually rotated (absolute position
// + a per-item rotate()), which read as a scrapbook mood-board rather than a precise product
// shot, so they were moved to a plain aligned grid. Round two, per a reference image supplied
// live: deliberately reversed back to an overlapping, tilted "messy desk" cluster with
// hand-drawn-style callouts, closer to the reference's own composition - this was an explicit,
// considered reversal of the earlier direction, not a regression, so the ban is gone and
// replaced with assertions locking the new cluster shape instead.
assert.match(css, /\.ed-chaos-cluster \{[^}]*position: relative/, "the chaos cards need their overlapping cluster container");
assert.match(css, /\.ed-chaos-item \{[^}]*position: absolute/, "the chaos cards must be absolutely positioned within the cluster to achieve the overlapping layout");
assert.match(css, /\.ed-chaos-dm \{[^}]*rotate\(|\.ed-chaos-venmo \{[^}]*rotate\(/, "individual chaos cards must be tilted for the messy-desk cluster look, per the supplied reference");
// The cluster's fixed-percentage/pixel positions are tuned for its full-width canvas. Below
// 1050px it scales the whole canvas down (keeping the cards' relative layout and the callouts'
// arrow positions intact) rather than reflowing early; below 800px, where even the scaled
// canvas runs out of room, it falls back to a plain 2-up grid (every other mock on this page
// does the same at narrow widths), with the hand-drawn callouts hidden since "pointing near a
// card" stops meaning anything once the cards reflow into a grid/stack.
assert.match(css, /@media \(max-width: 1050px\) \{[\s\S]*?\.ed-chaos-cluster \{[^}]*transform: scale/, "the chaos cluster must scale down as a whole below 1050px, keeping its collage layout intact");
assert.match(css, /@media \(max-width: 800px\) \{[\s\S]*?\.ed-chaos-item \{ position: relative/, "the chaos cluster must collapse to a plain grid below 800px, not keep fixed-pixel absolute positions that were only tuned for the wide cluster");
assert.match(css, /@media \(max-width: 800px\) \{[\s\S]*?\.ed-chaos-callout \{ display: none/, "the hand-drawn callouts must be hidden once the cluster collapses to a grid - they can't meaningfully point at a specific card once it's reflowed");

// Realism pass: the chaos cards all used the same neutral gray label + generic white card
// treatment, which didn't actually read as Venmo/Instagram/Sheets/a to-do list at a glance.
// Each now borrows real brand color + a small brand-shaped icon, and the to-do card uses
// circular checkbox markers instead of a bullet list.
assert.match(css, /\.ed-chaos-icon-ig \{ color: #c13584/, "the Instagram card should use Instagram's actual brand color for its icon");
assert.match(css, /\.ed-chaos-icon-sheet \{ color: #0f9d58/, "the roster card should use Google Sheets' actual brand green for its icon");
assert.match(css, /\.ed-chaos-todo li::before \{[^}]*border-radius: 50%/, "the to-do card's items should use circular checkbox markers, not a plain bullet list");

// A first pass at the Venmo card used an invented quill-shaped icon next to a plain "Venmo"
// text label - not Venmo's actual logo. Replaced with Venmo's real wordmark (Simple Icons,
// CC0-licensed, built for exactly this use). That mark's own artwork only fills a thin
// horizontal band of its 24x24 canvas (confirmed via getBBox: y 9.7-14.3 of 24), so the
// viewBox must be cropped to that real bounding box or it renders as an illegibly tiny smear
// inside a square icon slot sized for the other cards' square glyphs. The wordmark already
// reads "venmo", so a separate text label next to it would be redundant - must not come back.
assert.match(html, /viewBox="0 9\.726 24 4\.548"/, "the Venmo wordmark must use its real cropped bounding box, not the full 24x24 canvas - otherwise it renders illegibly small");
assert.doesNotMatch(html, />Venmo<\/span>/, "the Venmo card must not pair its wordmark logo with a redundant text label - the logo already reads \"venmo\"");
assert.match(css, /\.ed-chaos-logo-venmo \{[^}]*color: #008cff/, "the Venmo wordmark must use Venmo's actual brand blue");

// An earlier pass added a "Without BeyondEight, today" tag directly on the card cluster, and
// later a "Your dashboard" tag above the dashboard shot, both using a shared .ed-chaos-tag
// pill style. Both were removed per explicit direction, and since neither markup instance
// remains, the now-unused .ed-chaos-tag CSS rule was removed too rather than left dead.
assert.doesNotMatch(html, /Without BeyondEight, today|Your dashboard/, "both .ed-chaos-tag pill labels were removed per explicit direction - must not regress back in");
assert.doesNotMatch(css, /\.ed-chaos-tag \{/, "the .ed-chaos-tag rule has no remaining markup to style - must not regress back in as dead CSS");

// Real bug found live: every other section (.site-header, .ed-business, .ed-pricing,
// .ed-steps) caps its content to a shared max-width column and centers it with margin: auto -
// .ed-reality never did, just a clamp()'d side padding with no cap, so at wide viewports its
// text sat flush against the browser edge while the header/hero content above it stayed
// centered in the narrower column - "RIGHT NOW, WITHOUT BEYONDEIGHT" visibly started well
// left of the logo above it.
assert.match(css, /\.ed-reality \{[^}]*max-width: 1180px[^}]*margin: 0 auto/, "the reality section must share the page's centered content column, or its text runs edge-to-edge at wide viewports instead of lining up with the header/hero above it");

// Copy pass, per explicit direction and then a supplied reference image: the headline now
// folds both opening sentences into one h2 (the standalone lead paragraph was merged in), the
// tool list groups into two lines of two sentences each, and the payoff line moved out of
// .ed-reality-text entirely into its own .ed-reality-pivot block below the full card cluster,
// where it now leads into a new "what if it didn't have to be / meet BeyondEight" close -
// matching the reference's own build-then-pivot structure instead of resolving the tension
// before the visual proof of it even appears.
assert.match(html, /<h2 id="reality-title">You put your class out there\.<br>Then you piece everything else together yourself\.<\/h2>/, "the reality section headline must use the new narrative opener");
assert.match(html, /<p class="ed-reality-detail">DMs for questions\. Venmo for payments\. A spreadsheet for your roster\.<br>Messages for reminders\. All in different places\.<\/p>/, "the reality section needs its new specific-tools line");
assert.doesNotMatch(html, /class="ed-reality-lead"/, "the standalone lead paragraph was folded into the h2 - must not come back as a separate element");
assert.match(html, /<p class="ed-reality-bridge">It works\.<br>But it's a lot to keep track of\.<\/p>/, "the reality section's payoff line must stay the narrative close, not the old \"BeyondEight brings it all together\"");
// Per explicit direction, every multi-sentence line in this section uses an explicit <br>
// between sentences rather than relying on the browser's natural wrap - a plain prose wrap
// previously broke mid-way through unrelated sentences, which read as an awkward accident
// rather than a deliberate line break.
assert.doesNotMatch(html, /<h2 id="reality-title">You put your class out there\. Then/, "the reality headline's two sentences must not go back to plain prose wrapping - each needs its own line via <br>");
// New pivot block, per the supplied reference: after the full card cluster and its payoff
// line, "What if it didn't have to be?" leads into the BeyondEight name itself - the
// reference's own transition before the "How It Works" section properly begins. An earlier
// pass added a small "⌄" chevron between the two, but it rendered as a broken/missing-glyph
// box in a real browser rather than the intended character - removed outright rather than
// swapped for another glyph, since the transition reads fine without one.
assert.doesNotMatch(html, /ed-reality-chevron/, "the chevron glyph rendered as a broken box in a real browser - must not regress back in");
assert.match(html, /<p class="ed-reality-meet">Put it all in <em>one place<\/em>\.<\/p>/, "the reality section needs its pivot headline, per explicit direction");
assert.match(html, /<p class="ed-reality-tagline">BeyondEight brings your classes, registrations, payments and community together &mdash; so you can spend less time on admin and more time doing what you love\.<\/p>/, "the reality section needs its new closing tagline");
assert.match(css, /\.ed-reality-meet em \{ color: var\(--home-rose\)/, "the 'one place' emphasis in the pivot line must use the brand rose, matching every other emphasis mention on the page");
// The eyebrow was drafted as "How it works today," but the real How It Works section further
// down the page (id="how-it-works") already uses the eyebrow "How it works" for the actual
// product walkthrough - having both appear while scrolling reads as a confusing near-duplicate.
// Changed to "Right now" instead, which keeps the same meaning without colliding.
assert.match(html, /<p class="ed-eyebrow">Right now<\/p>/, "the reality section eyebrow must not duplicate the real How It Works section's own eyebrow text further down the page");

// Creative pass, per explicit direction: the text sat in its own left column fighting the chaos
// card cluster for attention in a side-by-side split. Centered instead, stacked above the
// cards, matching the hero's own single-focal-point composition rather than being an
// asymmetric two-column split right under a centered hero.
assert.match(css, /\.ed-reality \{[^}]*display: flex[^}]*flex-direction: column[^}]*align-items: center[^}]*text-align: center/, "the reality section must be a centered single column, matching the hero's composition, not a left-text/right-cards split");
assert.match(css, /\.ed-chaos-cluster \{[^}]*text-align: left/, "the chaos card cluster must reset text-align back to left - card content (amounts, messages, labels) shouldn't inherit the section's center alignment");
assert.doesNotMatch(css, /\.ed-chaos-item \{[^}]*text-align: center/, "individual chaos cards must stay left-aligned even after the section-level centering change");

// Build your site: per explicit feedback this is no longer its own standalone section ahead
// of "How it works" - it's the first step inside that grid, using the same real browser-chrome
// + hero-block visual language (not a generic mock) so it still reads as the actual product.
// Must use a real business-site URL pattern (beyond8dance.com/<slug>) rather than inventing a
// new capability, and must not regress to the old separate two-column section with its own
// desktop+phone frame pairing.
assert.match(html, /class="ed-mock ed-mock-site/, "the website-builder step must exist inside the steps grid");
assert.match(html, /beyond8dance\.com\/maya-flores/, "the mockup must show the real URL pattern the product actually publishes to");
assert.doesNotMatch(html, /class="ed-site"[ >]|class="ed-site-phone"/, "the website moment must not regress to its own standalone section with a separate phone frame");

// Product-accuracy pass: per explicit direction to make the step mocks "look more like the
// actual tool," the dashboard/form/payment/confirmation mocks pull colors, icons and copy
// directly from product-ui.css's --product-* tokens and dashboard.js's real markup (the
// payment option copy, "Class Name" label, stat-card icon-badge pattern) rather than the
// homepage's own invented styling. Inter (the dashboard's real body font) must actually be
// loaded for this, alongside the existing Fraunces/Plus Jakarta Sans pair.
assert.match(html, /family=Inter/, "Inter must be loaded - it's the real dashboard's body font, used in these product-accurate mocks");
assert.match(html, /Class Name/, "the class-form mock must use the real field label, not the earlier invented \"Class Title\"");
assert.match(html, /Accepted cards go straight to your bank/, "the payment mock must use real copy reflecting direct-to-bank Stripe payouts, not generic placeholder text");
// Real bug found live: at narrow (mobile) widths the payment option's title wraps to two
// lines, and the absolutely-positioned "Recommended" badge - anchored at a fixed top offset
// - overlapped the title's first line and visually hid the word "Card". Confirmed fine on
// desktop (title stays on one line there) but broken on mobile. Fixed by giving the option
// enough top padding to clear the badge regardless of how many lines the title wraps to, and
// moving the radio dot down to match. Locks in the clearance so it can't silently shrink back.
assert.match(css, /\.ed-mock-payment-option \{[^}]*padding: 24px/, "the payment option needs enough top padding to clear the absolutely-positioned badge even when its title wraps to two lines on mobile");

// Per explicit follow-up direction, the dashboard and class-form mocks also got real photo
// thumbnails (the Overview's upcoming-class row, the Add Class form's image field) matching
// where the real product actually shows a photo (.owner-overview-class img,
// .owner-image-field img) - not the homepage's own invented icon-only placeholders. The class
// form's image was first tried at the real field's full 16:9 width, which made that card
// visibly taller than its row siblings and misaligned the step labels below it - sized down
// to a thumbnail instead so the row stays balanced; locks in the smaller size.
assert.match(html, /class="ed-mock-class-thumb"/, "the dashboard mock's upcoming-class row needs a real photo thumbnail, matching the real Overview page");
assert.match(html, /class="ed-mock-photo"/, "the class-form mock needs a real photo for its Class Image field, matching the real form");
assert.doesNotMatch(css, /\.ed-mock-photo \{[^}]*width: 100%/, "the class-image thumbnail must not regress to full card width - it visibly misaligned this card's height against its row siblings");

// Uniform-size pass: per explicit direction the six step mocks must all read as one
// consistent set, not each sizing to its own content (they previously ranged from 157px to
// 280px tall). A fixed height (not min-height) on .ed-mock is the actual fix; the per-mock
// fill/center rules below it are necessary too, since a bare fixed height alone just clips or
// leaves dead space - must not regress to min-height, which would let heights vary again.
assert.match(css, /\.ed-mock \{[^}]*height: 280px/, "all six step mocks must share one fixed height so they read as a consistent set");
assert.doesNotMatch(css, /\.ed-mock \{[^}]*min-height: 280px/, "must be a fixed height, not min-height - min-height would let shorter mocks shrink back to their own content size");

// Real bug found live: squeezing every step mock down to a fixed 128px width on mobile (mock
// beside its text, not above it) left the dashboard mock's two-across stat grid only ~44px per
// card - even after min-width: 0 made the grid shrink to its tracks correctly (a grid item
// otherwise floors at its content's min-content width, same trap as the classic flex
// min-width:auto overflow), "Registrations" as one unbreakable word still didn't fit and
// spilled out, overlapping the step's own text next to it. min-width: 0 is still worth keeping
// as defensive CSS, but the actual fix was dropping the 128px-wide row layout entirely per
// explicit direction - see the "mock above text on mobile" note below.
assert.match(css, /\.ed-mock-stat-card \{[^}]*min-width: 0/, "the stat card grid items need min-width: 0 or they floor at their content's width and overflow their 1fr track");

// Mobile step layout: per explicit direction, each step's mock sits above its text (the same
// column layout every wider breakpoint already uses) rather than squeezed beside it at a fixed
// 128px - that row layout was also what caused the stat-grid overflow above, and required
// separately hiding the Instagram-import badge and collapsing the stat grid just to cope with
// the cramped width. None of that workaround is needed once the mock gets its natural width.
assert.doesNotMatch(css, /@media \(max-width: 420px\) \{[\s\S]*?\.ed-step \{ flex-direction: row/, "mobile steps must not go back to a row layout with a fixed-width mock - that's what caused the stat-grid overflow bug in the first place");
assert.doesNotMatch(css, /@media \(max-width: 420px\) \{[\s\S]*?\.ed-mock-form \.ed-mock-ig-import \{ display: none/, "the Instagram-import badge should not need hiding on mobile - that was only necessary to cope with the cramped 128px row layout, which is gone");

// Import-from-Instagram pass: the real Classes page shows this as a secondary button next to
// "+ Add Class" (dashboard.js's classView) - picking a recent post pre-fills this form's
// Description/Class Image fields. Added here per explicit direction.
assert.match(html, /class="ed-mock-ig-import"/, "the Add Class mock needs the real Import from Instagram affordance");
assert.match(html, />Import from Instagram</, "the badge must use the real feature's actual label");
// Real bug found live: the badge's two <span>s are also descendants of .ed-mock-form, so they
// matched `.ed-mock-form span` (the field-label styling rule) too - that selector's higher
// specificity (class+type vs. this rule's single class) won for every property it declares,
// silently turning display:inline-flex back to block and stacking the icon/label into two
// rows, inflating the badge to ~44px tall and overflowing the mock's fixed 280px height. Fixed
// by scoping the badge rules under .ed-mock-form to outrank it explicitly. Locks in the scope.
assert.match(css, /\.ed-mock-form \.ed-mock-ig-import \{/, "the badge rule must be scoped under .ed-mock-form to outrank the field-label span rule's higher specificity");
assert.doesNotMatch(css, /^\.ed-mock-ig-import \{/m, "the badge rule must not regress to an unscoped single-class selector - it loses the specificity fight against .ed-mock-form span");

// Venmo/Stripe-options and confirmation pass, per explicit feedback: the two payment options
// were spread with justify-content: space-between (one pinned to the top, one to the bottom,
// with a lot of empty space between) - centered instead. The confirmation mock's "Payment
// confirmed" pill was also dropped for repeating what the step text right next to it already
// says ("Card, confirmed automatically") - replaced with the actual amount paid, which is
// information this mock didn't show anywhere else.
assert.match(css, /\.ed-mock-payment-options \{[^}]*justify-content: center/, "the two payment options must be centered, not spread to the top/bottom with space-between");
assert.doesNotMatch(html, /Payment confirmed/, "the confirmation mock must not repeat the step text's own \"confirmed automatically\" wording");
assert.match(html, /class="ed-mock-confirm-receipt"/, "the confirmation mock should show the actual amount paid instead of a redundant status pill");

// Grow/analytics pass, per explicit direction to make it "realistic" and "actually helpful":
// restyled onto the same real product tokens (Inter, the --product-* palette) as the other
// mocks instead of the homepage's own rose styling, and given a month-over-month trend (the
// part that actually makes a chart "analytics" rather than a snapshot) plus a "most requested
// class" line - the latter closes a gap the section's own copy already promised ("...and what
// to teach again") but the visual never showed. Must stay framed as representative, not live
// data, since the real Analytics tab remains unbuilt (see the HTML comment above this card).
assert.match(html, /class="ed-business-trend"/, "the analytics card needs a trend, not just a static snapshot, to read as real analytics");
assert.match(html, /vs last month/, "the trend must be a real comparison, not a bare percentage");
assert.match(html, /class="ed-business-popular"/, "the analytics card must show the 'most requested class' insight its own copy promises (\"...and what to teach again\")");
assert.match(css, /\.ed-business-card \{[^}]*font-family: Inter/, "the analytics card must use the real product's font, matching the other product-accurate mocks, not the homepage's own sans");

// Footer-centering pass: per explicit feedback, the footer was the one element on this heavily
// centered page using a traditional left/right justify-content: space-between split (mobile
// already centered it at the 640px breakpoint - only desktop was inconsistent). Centered to
// match.
assert.match(css, /\.restyle-footer \{[^}]*justify-content: center/, "the footer must be centered, matching every other centered block on this page");
assert.doesNotMatch(css, /\.restyle-footer \{[^}]*justify-content: space-between/, "the footer must not regress to a left/right split");

// Site-mock pass: per explicit feedback the website step's visual read as a flat gradient
// block, not an actual website - rebuilt to match the real published Editorial theme
// (public-site.css: .public-editorial-hero) - a full-bleed photo hero with a dark scrim, an
// uppercase serif wordmark, and a real "Book a Class" button - reusing the page's own
// watermark photo rather than a plain color gradient.
assert.match(html, /class="ed-site-wordmark"/, "the site mock needs the uppercase wordmark the real Editorial theme shows over its hero photo");
assert.match(html, />Book a Class</, "the site mock needs the real theme's actual CTA copy");
assert.match(css, /\.ed-site-hero \{[^}]*url\("assets\/homepage-dance-studio\.png/, "the site mock's hero must use a real photo background, not a flat color gradient");
// Real bug found live: at the 128px mobile mock width, the headline wraps to several lines
// and the CTA button - laid out side-by-side with it via justify-content: space-between -
// got pushed past the card's right edge and clipped by the mock's overflow: hidden ("Book a
// Class" rendered as "Book a Clas"). Fine on desktop (headline stays short enough there),
// broken on mobile. Fixed by letting the footer wrap so the button drops to its own line
// instead of being squeezed and clipped.
assert.match(css, /\.ed-site-hero-foot \{[^}]*flex-wrap: wrap/, "the site mock's hero footer must wrap so the CTA button isn't clipped when the headline wraps to multiple lines on mobile");

// 06 — Your business: per explicit direction this is now a representative analytics
// visual (day-of-week registration trend + returning vs. first-time split) rather than a
// revenue figure - the real Analytics tab in the product doesn't exist yet, so this is an
// honest "here's the kind of insight it'll show" mock, not a built feature being claimed as
// real. The old revenue/sparkline card must not come back.
assert.doesNotMatch(html, /ed-business-revenue/, "the revenue figure card was replaced by the day-of-week trend visual");
assert.doesNotMatch(html, /ed-business-spark/, "the sparkline trend accompanying revenue was replaced by the bar chart");
assert.match(html, /class="ed-business-days"/, "the day-of-week registration bar chart must exist");
assert.match(html, /returning/i);
assert.match(html, /first-time/i);

// Compactness regression guard: the hero must stay content-driven (padding, not a forced
// viewport-height box) - both the old photo-era near-fullscreen height and the old
// image-era fixed max-height must not come back now that it's a centered type statement.
assert.doesNotMatch(css, /\.ed-hero \{[^}]*92svh|\.ed-hero \{[^}]*height: 62vh|\.ed-hero \{[^}]*max-height: 600px/, "the hero must not regress to a forced viewport-height box");
assert.doesNotMatch(css, /clamp\(320px, 44vw, 560px\)/, "the payoff image must not regress to its old tall height");

// One-line headline pass: per explicit direction, the small "BeyondEight · built for
// dancepreneurs" eyebrow above the headline was dropped, and the black line + the rose
// <em> line should each render as their own single line at normal desktop widths rather
// than wrapping. The markup itself must not hard-break the black line into two <br>-
// separated halves (the old "Starting your own<br>dance class?" split).
assert.doesNotMatch(html, /BeyondEight &middot; built for dancepreneurs|BeyondEight · built for dancepreneurs/, "the small eyebrow line above the hero headline must stay removed");
assert.match(html, /<h1 id="hero-title">Starting your own dance class\?<br><em>/, "the black headline must be one unbroken run (no internal <br>), only breaking before the rose <em> line");
// Real bug found live: styles.css has a bare `h1 { max-width: 840px; letter-spacing:
// -0.045em; }` rule (an unscoped "Creative typography pass" meant for other pages) that
// silently capped the hero headline's width and tightened its tracking, forcing it to wrap
// even once the container was widened - this rule's higher specificity only overrides
// properties it actually declares, so a property it doesn't mention (here, max-width and
// letter-spacing) keeps leaking through regardless of container width, the same pattern as
// the header's backdrop-filter/box-shadow leak earlier in this redesign. Locks in the
// explicit resets so they can't silently regress.
assert.match(css, /\.ed-hero-copy h1 \{[^}]*max-width: none/, "the hero h1 must explicitly reset max-width to none - the legacy bare h1 rule in styles.css caps it at 840px and this is the only thing stopping that from leaking through");
assert.match(css, /\.ed-hero-copy h1 \{[^}]*letter-spacing: normal/, "the hero h1 must explicitly reset letter-spacing to normal - the legacy bare h1 rule in styles.css tightens it and this is the only thing stopping that from leaking through");

// The hero subhead originally used an em dash and wrapped to two lines on desktop. Per
// explicit direction it must read as one line, with no em dash.
assert.doesNotMatch(html, /ed-hero-sub">[^<]*—/, "the hero subhead must not use an em dash");
assert.match(css, /\.ed-hero-sub \{[^}]*white-space: nowrap/, "the hero subhead needs white-space: nowrap to actually render as one line above 640px, not just a wider max-width");
assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*?\.ed-hero-sub \{[^}]*white-space: normal/, "the subhead's nowrap must be reset back to normal by 640px, or body's legacy overflow-x: hidden silently clips it on phones instead of letting it wrap");

// Simplification pass: per explicit direction, the hero's product-panel visual (the
// Class/Registered/Collected card) was dropped and the hero copy centered instead - the
// hero is now type-only, relying on the body's watermark photo for visual texture. The
// "Now go teach." payoff line and the whole rose "second job" color-block section were
// also dropped outright (not just restyled) since they repeated ground the reality section
// and the new bridge/closing lines already cover. Must not resurface.
assert.doesNotMatch(html, /class="ed-hero-visual|class="ed-hero-panel/, "the hero must not regress to showing a product-panel visual - it's centered type only now");
assert.doesNotMatch(html, /class="ed-payoff"|class="ed-secondjob"|Now go teach/, "the payoff line and the rose second-job section were both removed, not just restyled");
assert.doesNotMatch(css, /\.ed-payoff \{|\.ed-secondjob \{|\.ed-button-light \{/, "no leftover payoff/second-job styles should remain once those sections are gone");
assert.match(css, /"Fraunces"/, "the display typeface should be Fraunces, not the generic Source Serif 4");
assert.match(css, /"Plus Jakarta Sans"/, "the sans typeface should be Plus Jakarta Sans, not the generic Inter");
assert.doesNotMatch(css, /"Source Serif 4"|"Inter"/, "the old generic font pairing must not remain in the homepage's own variables");
assert.match(html, /family=Fraunces/, "the Fraunces font file must actually be loaded");
assert.match(html, /family=Plus\+Jakarta\+Sans/, "the Plus Jakarta Sans font file must actually be loaded");

// Navy pass (supersedes the old "Flow pass"/"Product-first pass" below): per explicit later
// direction, the navy hero/reality color blocking was dropped entirely in favor of one
// continuous cream background - there's no navy-to-cream seam left to fade, because there's
// no navy left at all.
assert.doesNotMatch(css, /\.ed-hero \{[^}]*background: var\(--home-ink\)/, "the hero must not regress to a solid navy background - navy was dropped for the cream watermark treatment");
assert.doesNotMatch(css, /\.ed-reality \{[^}]*background:[^;]*var\(--home-ink\)/, "the reality section must not regress to a navy or navy-gradient background");

// Watermark pass: the rooftop photo returns, but not as foreground photography at hero scale
// - per explicit direction it's the page's own backdrop, fixed behind the whole scroll so it
// "extends throughout the website" rather than being confined to a hero image box. A heavy
// cream wash keeps it as a faint texture, never a punchy foreground photo at that scale.
// Later, explicit direction ("make the visuals look more like the actual tool/website")
// reused this same photo as small <img> thumbnails inside the product-accurate step mocks
// (the site hero, the dashboard's upcoming-class row, the class-image form field) - that's a
// deliberate, separate decision from the original "no foreground photo" rule, which was about
// the old hero/second-job full-bleed treatment specifically. Still must never come back as
// those two large section-scoped foreground classes.
assert.doesNotMatch(css, /\.ed-hero-image \{|\.ed-hero::before \{|\.ed-secondjob-image \{/, "no leftover photo-era foreground-image styles should exist for the watermark treatment");
assert.match(css, /body\.home-restyle \{[\s\S]*?url\("assets\/homepage-dance-studio\.png/, "the rooftop photo must be wired in as the body's background watermark");
assert.match(css, /background-attachment: scroll, fixed/, "the watermark must use background-attachment: fixed so it reads as one continuous backdrop while scrolling, not a photo confined to the hero box");
assert.match(css, /rgba\(255, 252, 252, \.[78][0-9]\)/, "the photo must stay behind a heavy (~78-86%) cream wash so it reads as a faint watermark, never a punchy foreground photo");
// Real bug found live: styles.css has a legacy `body { background: ... !important }` rule
// (a shared decorative background meant for other pages) that silently wins over the more-
// specific body.home-restyle selector and replaces the watermark outright - every opacity
// tweak had zero visible effect until this was found and fixed. Locks in the fix so it can't
// silently regress if the watermark rule's !important is ever "cleaned up" without checking.
assert.match(css, /body\.home-restyle \{[\s\S]*?background-image:[^;]*!important/, "the watermark's background-image must carry !important to win over the legacy body {...!important} rule in styles.css");
// Header blend pass: the header used to be an inset, rounded, drop-shadowed white pill
// floating over the hero as an absolutely-positioned overlay - a distinct card rather than
// part of the watermarked page. Per explicit direction it's now a normal in-flow element
// (no border-radius/shadow/position:absolute) with no background of its own at all, relying
// on the body's own watermark wash - already strongest at the top of the page - for nav text
// legibility, exactly like every other section that already blends with zero special-casing.
assert.doesNotMatch(css, /\.home-restyle \.site-header \{[^}]*border-radius: 0 0 \d+px \d+px/, "the header must not regress to a rounded floating-pill shape");
assert.doesNotMatch(css, /\.home-restyle \.site-header \{[^}]*position: absolute/, "the header must not regress to an absolutely-positioned overlay - see the compositing-seam bug below");
// Real bug found live, the hard way: the seam survived every change to the header's own
// background/blur/position because the actual leak was elsewhere - five different legacy
// `.site-header` rules in styles.css (unrelated to the homepage) set backdrop-filter and
// box-shadow on the bare class name. This rule's higher specificity only overrides properties
// it actually declares, so a property this rule never mentioned kept applying regardless of
// anything else changed here. Isolated by bisecting: hid the header (seam gone), emptied its
// children (seam stayed), swapped in a plain unstyled div (seam gone), which pointed at the
// class's own CSS rather than the element or its content - then diffed every .site-header
// rule in styles.css for properties this rule doesn't set. Locks in the explicit resets so
// this can't silently regress if they're ever "cleaned up" as apparently redundant.
assert.match(css, /\.home-restyle \.site-header \{[^}]*backdrop-filter: none/, "the header must explicitly reset backdrop-filter to none - legacy .site-header rules in styles.css set backdrop-filter and this is the only thing stopping them from leaking through");
assert.match(css, /\.home-restyle \.site-header \{[^}]*box-shadow: none/, "the header must explicitly reset box-shadow to none - legacy .site-header rules in styles.css set box-shadow and this is the only thing stopping them from leaking through");

// Precision pass: mockups now sit straight-on like real product shots, not tilted like a
// scrapbook - the rotate() transforms that were on the business card, website mockup frames,
// and the alternating 3-step mocks must not come back.
assert.doesNotMatch(css, /\.ed-business-card \{[^}]*rotate\(/, "the business dashboard card must sit straight, not tilted");
assert.doesNotMatch(css, /\.ed-mock-site \{[^}]*rotate\(|\.ed-site-browser-bar \{[^}]*rotate\(/, "the website-builder step mock must sit straight, not tilted");
assert.doesNotMatch(css, /nth-child\(odd\) \.ed-mock|nth-child\(even\) \.ed-mock/, "the step mockups must not alternate tilt");

// script.js must wire up every matching [data-open-comparison] button (querySelectorAll),
// not just the first (querySelector) - confirmed live: the pricing section's own link
// silently did nothing until this was fixed.
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
assert.match(script, /const openComparisonButtons = document\.querySelectorAll\("\[data-open-comparison\]"\)/, "every [data-open-comparison] trigger must be wired up, not just the first");
assert.doesNotMatch(script, /document\.querySelector\("\[data-open-comparison\]"\)/, "must not regress to querySelector (singular), which only wires up the first matching button");
// The header nav (Features/How It Works/Pricing/About, plus the hamburger toggle) was
// removed per explicit direction - only Log In and the header's own Get Started button
// stay. The pricing section's own "Compare every feature" link is now the sole
// [data-open-comparison] trigger.
assert.doesNotMatch(html, /class="site-nav"/, "the header nav links (Features/How It Works/Pricing/About) must not come back");
assert.doesNotMatch(html, /class="nav-toggle"/, "the mobile hamburger toggle must not come back - there's no nav left to toggle");
assert.equal((html.match(/data-open-comparison/g) || []).length, 1, "expected exactly the pricing section's compare link, now that the nav Pricing button is gone");

// Real bug found live, twice, after the nav links/toggle were removed and only Log In +
// Get Started were left in the header: (1) a legacy, unscoped `@media (max-width: 920px) {
// .header-cta { display: none; } }` rule in styles.css was leaking through below 920px,
// since .home-restyle .header-cta never declared its own `display` for that property to
// override - the same specificity-leak pattern hit repeatedly elsewhere on this page. (2)
// once visible again, the button had nothing left to make room for it at narrow phone
// widths, and body's own legacy overflow-x: hidden rule meant it didn't scroll or wrap, it
// silently clipped off the right edge below ~390px.
assert.match(css, /\.home-restyle \.header-cta \{[^}]*display: inline-flex/, "the header CTA must declare its own display, or the legacy 920px-breakpoint display:none rule in styles.css leaks through and hides it");
assert.match(css, /@media \(max-width: 420px\) \{[\s\S]*?\.home-restyle \.header-cta \{[^}]*padding: 8px 13px/, "narrow phones need a tighter CTA so it doesn't get clipped by body's overflow-x: hidden");

// Closing CTA: the brand's "8 counts" wordplay replaces the old closing line per explicit
// direction - "You focus on everything between the 8 counts. We handle everything beyond."
// Per the same one-line-headline direction as the hero, the black line must be one
// unbroken run (no internal <br>), only breaking before the rose <em> line.
assert.match(html, /between the <span class="ed-launch-digit">8<\/span> counts/i, "the closing CTA should use the brand's 8-counts wordplay");
assert.match(html, /<em>We handle everything beyond\.<\/em>/, "the closing CTA's payoff line must still exist");
assert.match(html, /<h2 id="launch-title">You focus on everything between the <span class="ed-launch-digit">8<\/span> counts\.<br><em>/, "the closing CTA's black line must be one unbroken run, matching the hero's one-line-per-color treatment");
// Real bug, confirmed twice over: Fraunces' own "8" has roughly equal-sized top and bottom
// bowls, not the bottom-heavy taper every other serif uses (checked Georgia, Times, Playfair,
// Lora, Merriweather side by side - all five taper the same way) - that's what reads as
// upside-down, confirmed live on the actual published page, twice. A first attempt swapped it
// into the homepage's sans face, which fixed the bowl shape but created a worse problem live:
// a visibly different typeface sitting mid-sentence in an all-serif headline. Georgia is the
// fix that stuck - it's already Fraunces' own fallback in --home-display, so it reads as the
// same serif family rather than a foreign font, while its numeral tapers correctly.
assert.match(html, /class="ed-launch-digit"/, "the '8' must stay wrapped in its own span so it can render in a different (but still serif) font than the rest of the headline");
assert.match(css, /\.ed-launch-digit \{[^}]*font-family: Georgia, serif/, "the '8' must render in Georgia - Fraunces' own glyph reads upside-down at this size, confirmed live twice, and a same-family serif swap reads far less jarring than the sans-face swap tried first");
// Real bug found live: same pattern as the hero h1 fix earlier - styles.css has a bare
// `h2 { max-width: 1320px; }` rule (unscoped, meant for other pages) that silently capped
// this h2's own box width without an auto margin to re-center it, so the box sat flush-left
// within .ed-launch and text-align: center only centered text WITHIN that off-center box, not
// against the full section. Confirmed live: computed max-width was exactly 1320px, margin-
// left/right both 0px, h2 center 36px off from the section/eyebrow/button center.
assert.match(css, /\.ed-launch h2 \{[^}]*max-width: none/, "the closing CTA's h2 must explicitly reset max-width to none - the legacy bare h2 rule in styles.css caps it at 1320px with no auto margin, pulling the text off-center");

// Expanded card set and realism, per the supplied reference: a Messages card was added to
// match "Messages for reminders" in the copy, which previously had no visual to back it up -
// this page's own established principle is that copy should be grounded in a real visual where
// the product (or in this case, the described reality) actually shows one. The roster card
// gained an Attending column and a fuller row set, and the old sticky note became a "To Do"
// checklist with circular checkbox markers instead of a single handwritten line.
assert.match(html, /ed-chaos-item ed-chaos-messages/, "a Messages card is needed so 'Messages for reminders' in the copy has a visual to point at");
assert.match(html, /<th>Attending<\/th>/, "the roster mock needs an Attending column, matching the supplied reference");
assert.match(html, /ed-chaos-item ed-chaos-todo/, "the sticky note must be a To Do checklist card");
assert.match(css, /\.ed-chaos-icon-messages \{[^}]*background: #20c966/, "the Messages card should use a brand-green badge for its icon, matching a real chat app notification");
// Hand-drawn-style callouts naming the specific pain point near each relevant card, per the
// reference image - one per card (five total), positioned next to the card it names. A
// parallel attempt at this same redesign (built independently, then ported in wholesale -
// cards, callouts, and all - once it became clear a hand-recreated version wasn't actually
// matching it) is the direct source of this card set's sizing, content, and callout positions;
// only the section-level wrapper (this page's own flowing-section background, not that
// version's own full-bleed photo background and boxed transition block) stayed ours. The
// callouts originally each had a small arrow glyph (a ::after pseudo-element) pointing at
// their card, but that was dropped per explicit direction - removed, not hidden, so it can't
// regress back in by a future pass restoring a "missing" ::after rule.
assert.match(html, /ed-chaos-callout ed-callout-dm/, "the cluster needs its hand-drawn callout captions, per the supplied reference");
assert.equal((html.match(/class="ed-chaos-callout /g) || []).length, 5, "every card needs its own callout - one per card, five total");
assert.match(css, /\.ed-chaos-callout \{[^}]*"Caveat"/, "the callouts must use the handwriting webfont, matching the reference's hand-drawn treatment");
assert.doesNotMatch(css, /\.ed-chaos-callout::after \{/, "the callout arrow glyphs were removed per explicit direction - must not regress back in");

// A realistic dashboard screenshot sits right after the "Put it all in one place" pivot line,
// per explicit direction - visual proof of the promise immediately, rather than making the
// reader wait for the "How it works" steps further down to see the actual product. Reuses the
// real browser-chrome-bar convention from the site-preview mock, scaled up into a standalone
// product shot with a working-looking sidebar nav, stat cards, an upcoming-classes list, and a
// registrations list with payment-status pills.
assert.match(html, /ed-dash-shot-wrap/, "the reality section needs its dashboard screenshot after the pivot line");
assert.match(html, /app\.beyond8dance\.com\/dashboard/, "the dashboard shot needs a realistic browser-chrome URL, matching the site-preview mock's convention");
assert.equal((html.match(/class="ed-dash-stat"/g) || []).length + (html.match(/class="ed-dash-stat is-flag"/g) || []).length, 4, "the dashboard shot needs its four stat cards");
assert.match(html, /<a class="is-active">/, "the sidebar nav needs an active state so it reads as a real, in-use app rather than a static list");
assert.match(html, /ed-dash-pill is-paid">Paid/, "the registrations list needs at least one paid status pill");
assert.match(html, /ed-dash-pill is-pending">Pending/, "the registrations list needs at least one pending status pill, echoing the 'tracking who's paid' pain point from the chaos cluster above");
// The sidebar nav is a fixed 180px column - below tablet width it eats too much of a narrow
// viewport to stay usable, and it isn't load-bearing for what this visual proves (that the
// dashboard brings everything into one screen). Dropped rather than squeezed/scrolled.
assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*?\.ed-dash-nav \{ display: none/, "the dashboard shot's sidebar nav must be hidden below 640px, not squeezed into an unreadable column");

console.log('Homepage editorial redesign structure and existing entry points passed');
