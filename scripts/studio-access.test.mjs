import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("../", import.meta.url).pathname;
const studioPage = readFileSync(join(repoRoot, "src/pages/studio/index.astro"), "utf8");
const baseLayout = readFileSync(join(repoRoot, "src/layouts/BaseLayout.astro"), "utf8");
const sitemap = readFileSync(join(repoRoot, "src/pages/sitemap.xml.ts"), "utf8");

assert.match(studioPage, /export const prerender = false/);
assert.match(studioPage, /if \(!Astro\.locals\.user\)/);
assert.match(studioPage, /return Astro\.redirect\("\/auth\/register\/", 303\)/);
assert.match(studioPage, /if \(!isAdminProfile\(Astro\.locals\.profile\)\)/);
assert.match(studioPage, /return new Response\(null, \{ status: 404, statusText: "Not Found" \}\)/);
assert.doesNotMatch(studioPage, /throw new Response/);
assert.match(studioPage, /metaRobots="noindex, nofollow"/);

assert.doesNotMatch(baseLayout, /href=["'{`]\/studio\//);
assert.doesNotMatch(sitemap, /path:\s*["']\/studio\//);

console.log("Deck Creator Studio access contract: passed");
