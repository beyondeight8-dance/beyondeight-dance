const assert = require("node:assert/strict");
const fs = require("node:fs");

const config = fs.readFileSync(require.resolve("../app-config.js"), "utf8");
const services = fs.readFileSync(require.resolve("../app-services.js"), "utf8");
const htmlFiles = [
  "../index.html",
  "../404.html",
  "../auth/callback/index.html",
  "../dashboard/index.html",
  "../dashboard/website/index.html"
];
const expectedRef = "awycvqzoijlwivxjgzak";

assert.match(config, new RegExp(`https://${expectedRef}\\.supabase\\.co`));
assert.match(services, /validateSupabaseConfig/);
assert.match(services, /payload\.ref/);
assert.match(services, /configuration does not match its project/);
htmlFiles.forEach((file) => {
  const html = fs.readFileSync(require.resolve(file), "utf8");
  assert.match(html, /app-config\.js\?v=20260928-embedded-checkout/);
  assert.match(html, /app-services\.js\?v=20260928-embedded-checkout/);
});

console.log("Supabase configuration regression tests passed");
