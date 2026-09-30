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
// Editorial redesign: "How it works" is 3 compact steps (create, register+pay, roster) in
// one row, rather than the old 5-card grid - the reminder/notifications step was dropped
// since no automated reminder feature actually exists (no email sending exists anywhere in
// this codebase - don't claim functionality that isn't real).
assert.equal((html.match(/<li class="ed-step/g) || []).length, 3);
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
assert.ok((html.match(/data-open-setup/g) || []).length >= 4);
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

// 02.5 — Your own website: one compact visual moment (browser + phone frame), not a
// feature card, and not another giant section. Must use a real business-site URL pattern
// (beyond8dance.com/<slug>) rather than inventing new capability.
assert.match(html, /class="ed-site"/, "the website-builder moment must exist");
assert.match(html, /beyond8dance\.com\/maya-flores/, "the mockup must show the real URL pattern the product actually publishes to");
assert.match(html, /class="ed-site-phone"/, "desktop + mobile should be shown together per the brief");

// 06 — Your business: a compact mini-dashboard (revenue + trend + dancers + returning),
// not the old bare "$600 collected" card.
assert.match(html, /ed-business-revenue/);
assert.match(html, /ed-business-spark/, "a small trend visual should accompany the revenue figure");
assert.match(html, /returning/i);

// Compactness regression guard: the hero must stay content-driven (padding, not a forced
// viewport-height box) - both the old photo-era near-fullscreen height and the old
// image-era fixed max-height must not come back now that it's type + a product panel.
assert.doesNotMatch(css, /\.ed-hero \{[^}]*92svh|\.ed-hero \{[^}]*height: 62vh|\.ed-hero \{[^}]*max-height: 600px/, "the hero must not regress to a forced viewport-height box");
assert.doesNotMatch(css, /clamp\(320px, 44vw, 560px\)/, "the payoff image must not regress to its old tall height");

// Design-identity pass: the homepage previously repeated the same rooftop photo twice
// (hero + "Now go teach" payoff), reused the same floating white card device even for the
// hero's on-image stat chip, and paired generic Source Serif 4 + Inter - three things that
// made it read as a template rather than an independent brand. Must not regress.
assert.doesNotMatch(html, /<figure class="ed-payoff">/, "the payoff must not go back to reusing the hero photo in a second image frame");
assert.match(html, /<p class="ed-payoff">Now go teach\.<\/p>/, "the payoff is now a typographic-only closing statement");
assert.doesNotMatch(css, /\.ed-payoff img \{/, "no payoff image styles should remain once the image is gone");
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

// Watermark pass: the rooftop photo returns, but not as foreground photography - per explicit
// direction it's now the page's own backdrop, fixed behind the whole scroll so it "extends
// throughout the website" rather than being confined to a hero image box. A heavy cream wash
// keeps it as a faint texture, never a punchy foreground photo, and it must never come back as
// an <img> tag or a section-scoped foreground image.
assert.doesNotMatch(html, /<img[^>]*homepage-dance-studio|class="ed-hero-image"|class="ed-secondjob-image"/, "the rooftop photo must not come back as a foreground <img> - only as the page's background watermark");
assert.match(css, /body\.home-restyle \{[\s\S]*?url\("assets\/homepage-dance-studio\.png/, "the rooftop photo must be wired in as the body's background watermark");
assert.match(css, /background-attachment: scroll, fixed/, "the watermark must use background-attachment: fixed so it reads as one continuous backdrop while scrolling, not a photo confined to the hero box");
assert.match(css, /rgba\(255, 252, 252, \.9[0-9]\)/, "the photo must stay behind a heavy (~90%+) cream wash so it reads as a faint watermark, never a punchy foreground photo");
assert.doesNotMatch(css, /\.ed-hero-image \{|\.ed-hero::before \{|\.ed-secondjob-image \{/, "no leftover photo-era foreground-image styles should exist for the watermark treatment");
assert.match(html, /class="ed-hero-visual/, "the hero's foreground visual must still be the product panel, not the photo");
assert.match(html, /class="ed-hero-panel"/, "the hero must still show real product data (class/registered/collected) as its foreground content");
assert.doesNotMatch(css, /\.home-restyle \.site-header \{[^}]*background: transparent/, "the header must stay a solid/translucent background, not fully transparent, so it reads clearly over the watermark");

// Precision pass: mockups now sit straight-on like real product shots, not tilted like a
// scrapbook - the rotate() transforms that were on the business card, website mockup frames,
// and the alternating 3-step mocks must not come back.
assert.doesNotMatch(css, /\.ed-business-card \{[^}]*rotate\(/, "the business dashboard card must sit straight, not tilted");
assert.doesNotMatch(css, /\.ed-site-browser \{[^}]*rotate\(|\.ed-site-phone \{[^}]*rotate\(/, "the website-builder mockup frames must sit straight, not tilted");
assert.doesNotMatch(css, /nth-child\(odd\) \.ed-mock|nth-child\(even\) \.ed-mock/, "the 3-step mockups must not alternate tilt");

// The redesign adds a second "Compare every feature" trigger inside the new pricing
// section, alongside the existing nav Pricing button - both share [data-open-comparison].
// script.js must wire up every matching button (querySelectorAll), not just the first
// (querySelector) - confirmed live: the pricing section's own link silently did nothing
// until this was fixed.
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
assert.match(script, /const openComparisonButtons = document\.querySelectorAll\("\[data-open-comparison\]"\)/, "every [data-open-comparison] trigger must be wired up, not just the first");
assert.doesNotMatch(script, /document\.querySelector\("\[data-open-comparison\]"\)/, "must not regress to querySelector (singular), which only wires up the first matching button");
assert.equal((html.match(/data-open-comparison/g) || []).length, 2, "expected exactly the nav button and the pricing section's compare link");

console.log('Homepage editorial redesign structure and existing entry points passed');
