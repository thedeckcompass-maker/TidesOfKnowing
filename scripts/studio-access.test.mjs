import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("../", import.meta.url).pathname;
const studioPage = readFileSync(join(repoRoot, "src/pages/studio/index.astro"), "utf8");
const studioAccess = readFileSync(join(repoRoot, "src/lib/studio/access.ts"), "utf8");
const baseLayout = readFileSync(join(repoRoot, "src/layouts/BaseLayout.astro"), "utf8");
const sitemap = readFileSync(join(repoRoot, "src/pages/sitemap.xml.ts"), "utf8");

assert.match(studioPage, /export const prerender = false/);
assert.match(studioPage, /studioAccessResponse\(Astro\.locals\.user, Astro\.locals\.profile\)/);
assert.match(studioAccess, /if \(!user\)/);
assert.match(studioAccess, /status: 303/);
assert.match(studioAccess, /Location: "\/auth\/register\/"/);
assert.match(studioAccess, /if \(!isAdminProfile\(profile\)\)/);
assert.match(studioAccess, /status: 404, statusText: "Not Found"/);
assert.doesNotMatch(studioAccess, /throw new Response/);
assert.match(studioPage, /metaRobots="noindex, nofollow"/);

assert.doesNotMatch(baseLayout, /href=["'{`]\/studio\//);
assert.doesNotMatch(sitemap, /path:\s*["']\/studio\//);

console.log("Deck Creator Studio access contract: passed");
