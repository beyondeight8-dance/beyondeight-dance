const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const styles = read('styles.css');
const homepage = read('homepage.css');
const onboarding = read('onboarding.css');
const productUi = read('product-ui.css');

// The logo mark's real artwork is ~1.3:1 (wider than tall). Any .brand-mark box whose
// width isn't greater than its height forces contain-fit to letterbox on the SIDES
// instead of top/bottom, which visibly shrinks the icon and widens the gap to the
// wordmark next to it - hit live in the onboarding modal (32x42, a tall box) before
// this test existed.
const markBoxes = [
  { label: 'styles.css base .brand-mark', text: styles, pattern: /\n\.brand-mark \{\s*\n\s*display: grid;\s*\n\s*width: (\d+)px;\s*\n\s*height: (\d+)px;/ },
  { label: 'homepage.css .home-restyle .brand-mark', text: homepage, pattern: /\.home-restyle \.brand-mark \{ width: (\d+)px; height: (\d+)px;/ },
  { label: 'onboarding.css #setup .brand-mark', text: onboarding, pattern: /#setup\.onboarding-workspace \.brand-mark \{ width: (\d+)px; height: (\d+)px;/ },
  { label: 'product-ui.css .dashboard-route .brand-mark', text: productUi, pattern: /\.dashboard-route \.route-header \.brand-mark \{\s*\n\s*width: (\d+)px;\s*\n\s*height: (\d+)px;/ },
];
for (const { label, text, pattern } of markBoxes) {
  const match = text.match(pattern);
  assert.ok(match, `${label}: could not find its width/height declaration`);
  const [, width, height] = match.map(Number);
  assert.ok(width > height, `${label}: box (${width}x${height}) must be wider than tall to match the logo artwork's own ~1.3:1 aspect ratio`);
}

// The gap between the logo mark and the "BeyondEight" wordmark must read as one
// consistent brand across every surface (homepage, onboarding, dashboard, and every
// other page sharing styles.css's base .brand rule) - not a mix of loose values left
// over from separate design passes.
const TIGHT_GAP = '6px';
for (const [label, text, pattern] of [
  ['styles.css base .brand', styles, /\n\.brand \{\s*\n\s*display: inline-flex;\s*\n\s*align-items: center;\s*\n\s*gap: (\d+px);/],
  ['homepage.css .home-restyle .brand', homepage, /\.home-restyle \.brand \{ flex-shrink: 0; gap: (\d+px); \}/],
  ['onboarding.css #setup .brand', onboarding, /#setup\.onboarding-workspace \.brand \{ gap: (\d+px);/],
  ['product-ui.css .dashboard-route .brand', productUi, /\.dashboard-route \.route-header \.brand \{\s*\n\s*align-items: center;\s*\n\s*gap: (\d+px);/],
]) {
  const match = text.match(pattern);
  assert.ok(match, `${label}: could not find its gap declaration`);
  assert.equal(match[1], TIGHT_GAP, `${label}: gap must match the site-wide tight brand spacing (${TIGHT_GAP})`);
}

console.log('Brand mark consistency (aspect ratio + gap) passed');
