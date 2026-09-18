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
assert.equal((html.match(/class="restyle-step-number"/g) || []).length, 5);
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
assert.match(css, /@media \(max-width: 480px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.ok(!css.includes('font-size: clamp('), 'Typography uses fixed responsive sizes');
console.log('Homepage restyle assets, structure and existing entry points passed');
