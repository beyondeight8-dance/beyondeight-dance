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
for (const filename of ['homepage-dance-studio.png', 'homepage-teaching-studio.png']) {
  assert.ok(html.includes(`assets/${filename}`));
  const bytes = fs.readFileSync(path.join(root, 'assets', filename));
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  assert.ok(bytes.readUInt32BE(16) >= 1024);
  assert.ok(bytes.readUInt32BE(20) >= 768);
}
assert.match(css, /@media \(max-width: 640px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.ok(!css.includes('font-size: clamp('), 'Typography uses fixed responsive sizes (the font shorthand, e.g. font: 400 clamp(...), is fine)');

// The logo <img> was swapped for a tightly-cropped mark with almost no internal padding.
// A leftover transform: scale(2.6) here (tuned to zoom into the OLD logo's large padding)
// over-crops the new artwork and chops off the raised arm - hit live in the onboarding
// modal, which shares this same .home-restyle header markup.
assert.doesNotMatch(css, /\.home-restyle \.brand-mark img \{[^}]*transform:\s*scale\(2\.6\)/, "the old padding-compensation zoom on the logo must not come back");

// A mobile-only bug: .ed-chaos-item switches from absolute to relative positioning at the
// 640px breakpoint, but relative positioning still honors left/top/right/bottom as offsets
// from the element's normal position - without resetting them, the item was pushed past the
// viewport's right edge (confirmed live: rect.right = 398 on a 390px-wide viewport).
assert.match(css, /\.ed-chaos-item \{ position: relative; inset: auto;/, "the chaos items' absolute-positioning offsets must be reset on mobile, not just their position value");

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

// Compactness regression guards: the hero and other sections were cut from near-fullscreen
// heights (e.g. 92svh/880px hero, 320-560px payoff, 420px second-job image) down to modest
// ones as part of an explicit "reduce vertical length ~25-35%" pass. Locks in the smaller
// values so a future edit can't silently re-inflate them.
assert.doesNotMatch(css, /\.ed-hero \{[^}]*92svh/, "the hero must not regress to its old near-fullscreen height");
assert.match(css, /\.ed-hero \{[^}]*max-height: 600px/, "the hero's compact max-height must be in place");
assert.doesNotMatch(css, /clamp\(320px, 44vw, 560px\)/, "the payoff image must not regress to its old tall height");

// Design-identity pass: the homepage previously repeated the same rooftop photo twice
// (hero + "Now go teach" payoff), reused the same floating white card device even for the
// hero's on-image stat chip, and paired generic Source Serif 4 + Inter - three things that
// made it read as a template rather than an independent brand. Must not regress.
assert.doesNotMatch(html, /<figure class="ed-payoff">/, "the payoff must not go back to reusing the hero photo in a second image frame");
assert.match(html, /<p class="ed-payoff">Now go teach\.<\/p>/, "the payoff is now a typographic-only closing statement");
assert.doesNotMatch(css, /\.ed-payoff img \{/, "no payoff image styles should remain once the image is gone");
assert.doesNotMatch(css, /\.ed-hero-chip \{[^}]*background: white/, "the hero chip must not regress to a floating white card - it should sit directly on the photo");
assert.match(css, /"Fraunces"/, "the display typeface should be Fraunces, not the generic Source Serif 4");
assert.match(css, /"Plus Jakarta Sans"/, "the sans typeface should be Plus Jakarta Sans, not the generic Inter");
assert.doesNotMatch(css, /"Source Serif 4"|"Inter"/, "the old generic font pairing must not remain in the homepage's own variables");
assert.match(html, /family=Fraunces/, "the Fraunces font file must actually be loaded");
assert.match(html, /family=Plus\+Jakarta\+Sans/, "the Plus Jakarta Sans font file must actually be loaded");

// Flow pass: the hero photo and the dark Reality section used to meet at a flat, hard-edged
// line (solid black overlay butting directly against solid navy), which read as stacked
// slides rather than one continuous page. Both edges now dissolve into the adjoining
// section's exact color instead of stopping abruptly. Locks in the fix so it can't regress
// back to a flat two-tone overlay/background.
assert.match(css, /\.ed-hero::before \{[^}]*var\(--home-ink\) 0%/, "the hero's bottom edge must fade into the exact ink color the Reality section uses, not stop as flat black");
assert.match(css, /\.ed-reality \{[^}]*linear-gradient\(180deg, var\(--home-ink\)[^}]*#fffcfc 100%/, "the Reality section's bottom edge must fade into the page's cream background instead of ending as a flat navy block");
assert.doesNotMatch(css, /\.ed-secondjob \{[^}]*background: #fdf5f2/, "the second-job section must not reintroduce an off-tone cream that creates seams against the sections around it");

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
