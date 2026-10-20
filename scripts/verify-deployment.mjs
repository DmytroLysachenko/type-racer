import assert from "node:assert/strict";

const [originArg, ...flags] = process.argv.slice(2);
if (
  !originArg ||
  flags.some((flag) => !["--require-seo", "--require-cookie"].includes(flag))
) {
  console.error(
    "Usage: pnpm verify:deployment <origin> [--require-seo] [--require-cookie]",
  );
  process.exit(2);
}

const origin = new URL(originArg);
assert(
  ["http:", "https:"].includes(origin.protocol),
  "Expected an HTTP origin",
);
assert.equal(origin.pathname, "/", "Pass an origin without a path");
const requireSeo = flags.includes("--require-seo");
const requireCookie = flags.includes("--require-cookie");

async function request(path, options) {
  const response = await fetch(new URL(path, origin), {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
    ...options,
  });
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  return response;
}

for (const [path, heading] of [
  ["/", "Same text. Same clock."],
  ["/practice", "Find your rhythm."],
]) {
  const html = await (await request(path)).text();
  assert(
    html.includes(`<h1>${heading}</h1>`),
    `${path}: expected heading missing`,
  );
  if (requireSeo) {
    const canonical = new URL(path, origin).toString();
    const match = html.match(/<link rel="canonical" href="([^"]+)"\s*\/>/);
    assert(
      match &&
        new URL(match[1]).toString().replace(/\/$/, "") ===
          canonical.replace(/\/$/, ""),
      `${path}: canonical URL missing or SITE_URL differs from this origin`,
    );
  }
  console.log(`PASS ${path}: page and heading`);
}

const clock = await request("/api/time");
assert.match(clock.headers.get("cache-control") ?? "", /no-store/);
const { now } = await clock.json();
assert(Number.isSafeInteger(now), "/api/time: invalid timestamp");
assert(
  Math.abs(now - Date.now()) < 60_000,
  "/api/time: clock differs by over 60 seconds",
);
console.log("PASS /api/time: fresh server clock");

const guest = await request("/api/guest", {
  method: "POST",
  headers: { "content-type": "application/json", origin: origin.origin },
  body: JSON.stringify({ name: "Release check" }),
});
const identity = await guest.json();
assert.match(identity.id, /^[0-9a-f-]{36}$/i);
assert.equal(identity.name, "Release check");
if (requireCookie) {
  const cookie = guest.headers.get("set-cookie") ?? "";
  assert.match(cookie, /typearena_guest=/);
  assert.match(cookie, /httponly/i);
  assert.match(cookie, /samesite=lax/i);
  if (origin.protocol === "https:") assert.match(cookie, /secure/i);
}
console.log("PASS /api/guest: bounded guest identity and cookie check");

if (requireSeo) {
  const robots = await (await request("/robots.txt")).text();
  assert(robots.includes(new URL("/sitemap.xml", origin).toString()));
  const sitemap = await (await request("/sitemap.xml")).text();
  assert(sitemap.includes(new URL("/practice", origin).toString()));
  console.log("PASS robots and sitemap");
}

console.log(
  "Deployment smoke checks passed. Live presence and device checks remain manual.",
);
