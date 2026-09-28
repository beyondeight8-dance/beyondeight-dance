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
// Editorial redesign: "How it works" is 3 asymmetric steps (create, register+pay, roster)
// rather than the old 5-card grid - the reminder/notifications step was dropped since no
// automated reminder feature actually exists (see STRIPE_INTEGRATION_TODO.md-style honesty
// requirement from the redesign brief: don't claim functionality that isn't real).
assert.equal((html.match(/<li class="ed-step/g) || []).length, 3);
assert.match(html, /class="ed-step-count">5</);
assert.match(html, /class="ed-step-count">6</);
assert.match(html, /class="ed-step-count">7</);
assert.doesNotMatch(html, /confirmation email has been sent/i, "no fake email-confirmation claim - no email sending exists in this codebase");
assert.doesNotMatch(html, /class reminder/i, "no fake automated-reminder claim - no reminder feature exists in this codebase");
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

// Brand motif: the "5·6·7·8" count-off must appear as a deliberate, restrained transition
// beat plus the how-it-works step numbering - not sprinkled everywhere (the brief explicitly
// warns that overusing this becomes gimmicky rather than designed).
assert.match(html, /class="ed-count"/);
assert.equal((html.match(/class="ed-count"/g) || []).length, 1, "the count-off divider must appear once, not repeatedly");

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
