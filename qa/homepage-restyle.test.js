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

// The chaos cards used to be scattered and individually rotated (absolute position + a
// per-item rotate()), which read as a scrapbook mood-board rather than a precise product
// shot. They're now a plain aligned grid - must not regress to scattered/tilted positioning.
assert.match(css, /\.ed-chaos \{ display: grid;/, "the chaos cards must be a plain aligned grid, not an absolutely-positioned scatter");
assert.doesNotMatch(css, /\.ed-chaos-item \{[^}]*position: absolute/, "chaos cards must not go back to absolute positioning");
assert.doesNotMatch(css, /\.ed-chaos-venmo \{[^}]*rotate\(|\.ed-chaos-dm \{[^}]*rotate\(|\.ed-chaos-sheet \{[^}]*rotate\(|\.ed-chaos-note \{[^}]*rotate\(/, "individual chaos cards must not be tilted");

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
assert.match(html, /between the 8 counts/i, "the closing CTA should use the brand's 8-counts wordplay");
assert.match(html, /<em>We handle everything beyond\.<\/em>/, "the closing CTA's payoff line must still exist");
assert.match(html, /<h2 id="launch-title">You focus on everything between the 8 counts\.<br><em>/, "the closing CTA's black line must be one unbroken run, matching the hero's one-line-per-color treatment");
// A prior pass wrapped the "8" in a sans-face span, reasoning that Fraunces' own glyph (a
// visibly larger top bowl than bottom bowl at this size) reads upside-down. Reverted after
// live side-by-side comparison: the font-mismatch that creates - one visibly different
// typeface sitting mid-sentence in an otherwise all-serif headline - read far more wrong in
// context than the native digit's bowl proportions ever did. Must not come back as a span.
assert.doesNotMatch(html, /class="ed-launch-digit"/, "the '8' must be plain text inheriting the serif headline font, not wrapped in a sans-face span - the font mismatch reads worse than Fraunces' own glyph");
assert.doesNotMatch(css, /\.ed-launch-digit/, "no leftover CSS for the removed sans-face digit span");
// Real bug found live: same pattern as the hero h1 fix earlier - styles.css has a bare
// `h2 { max-width: 1320px; }` rule (unscoped, meant for other pages) that silently capped
// this h2's own box width without an auto margin to re-center it, so the box sat flush-left
// within .ed-launch and text-align: center only centered text WITHIN that off-center box, not
// against the full section. Confirmed live: computed max-width was exactly 1320px, margin-
// left/right both 0px, h2 center 36px off from the section/eyebrow/button center.
assert.match(css, /\.ed-launch h2 \{[^}]*max-width: none/, "the closing CTA's h2 must explicitly reset max-width to none - the legacy bare h2 rule in styles.css caps it at 1320px with no auto margin, pulling the text off-center");

console.log('Homepage editorial redesign structure and existing entry points passed');
