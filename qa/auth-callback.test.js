const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const callbackSource = fs.readFileSync(require.resolve("../auth-callback.js"), "utf8");

const runCallback = async ({ storage = {}, route = "/dashboard/" } = {}) => {
  const redirects = [];
  const calls = [];
  const localStorage = new Map(Object.entries(storage));
  const status = { textContent: "" };
  const retry = { hidden: true };
  const user = { id: "user-1", email: "owner@example.com" };
  const app = {
    client: {},
    resolveAuthCallbackSession: async () => ({ user }),
    ensureProfile: async (value) => calls.push(["profile", value.id]),
    publishWebsite: async (input) => {
      calls.push(["publish", input]);
      return { business: { id: "business-1" }, website: { id: "website-1" } };
    },
    routeForUser: async () => route
  };
  const context = {
    console,
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    document: {
      querySelector(selector) {
        return selector === ".route-loading p" ? status : retry;
      }
    },
    window: {
      BeyondEight: app,
      localStorage: {
        getItem: (key) => localStorage.get(key) || null,
        setItem: (key, value) => localStorage.set(key, value),
        removeItem: (key) => localStorage.delete(key)
      },
      location: { replace: (value) => redirects.push(value) }
    }
  };
  vm.runInNewContext(callbackSource, context);
  await new Promise((resolve) => setTimeout(resolve, 0));
  return { redirects, calls, localStorage, status, retry };
};

(async () => {
  const draft = { state: { businessName: "Studio Eight", slug: "studio-eight" }, stepIndex: 5 };
  const publishing = await runCallback({
    storage: {
      "beyondeight.pendingOwnerAction": "publish",
      "beyondeight.guestWebsiteDraft": JSON.stringify(draft)
    }
  });
  assert.equal(publishing.calls[1][0], "publish");
  assert.equal(publishing.calls[1][1].user.id, "user-1");
  assert.equal(publishing.calls[1][1].state.slug, "studio-eight");
  assert.equal(publishing.redirects[0], "/studio-eight?owner=1");
  assert.equal(publishing.localStorage.has("beyondeight.guestWebsiteDraft"), false);

  const returning = await runCallback({ route: "/dashboard/" });
  assert.equal(returning.calls.some(([name]) => name === "publish"), false);
  assert.equal(returning.redirects[0], "/dashboard/");
  console.log("auth callback regression tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
