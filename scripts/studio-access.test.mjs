import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("../", import.meta.url).pathname;
const studioPage = readFileSync(join(repoRoot, "src/pages/studio/index.astro"), "utf8");
const studioAccess = readFileSync(join(repoRoot, "src/lib/studio/access.ts"), "utf8");
const baseLayout = readFileSync(join(repoRoot, "src/layouts/BaseLayout.astro"), "utf8");
const sitemap = readFileSync(join(repoRoot, "src/pages/sitemap.xml.ts"), "utf8");

assert.match(studioPage, /export const prerender = false/);
assert.match(studioPage, /studioAccessResponse\(Astro\.locals\.user, Astro\.locals\.profile, "\/studio\/", Astro\.locals\.studioEntitlement\)/);
assert.match(studioAccess, /if \(user\) return null/);
assert.match(studioAccess, /status: 303/);
assert.match(studioAccess, /\/auth\/register\/\?redirectTo=/);
assert.match(studioAccess, /encodeURIComponent\(safeReturnTo\)/);
assert.match(studioAccess, /!isAdminProfile\(profile\) && !entitlementAllowsRead\(entitlement\)/);
assert.match(studioAccess, /Location: "\/tools\/deck-creator-studio\/\?access=required"/);
assert.match(studioAccess, /!isAdminProfile\(profile\) && !entitlementAllowsWrite\(entitlement\)/);
assert.match(studioAccess, /status: 403/);
assert.doesNotMatch(studioAccess, /throw new Response/);
assert.match(studioPage, /metaRobots="noindex, nofollow"/);

assert.doesNotMatch(baseLayout, /href=["'{`]\/studio\//);
assert.doesNotMatch(sitemap, /path:\s*["']\/studio\//);

console.log("Deck Creator Studio access contract: passed");
