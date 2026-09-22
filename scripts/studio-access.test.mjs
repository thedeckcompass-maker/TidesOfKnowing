import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("../", import.meta.url).pathname;
const studioPage = readFileSync(join(repoRoot, "src/pages/studio/index.astro"), "utf8");
const baseLayout = readFileSync(join(repoRoot, "src/layouts/BaseLayout.astro"), "utf8");
const sitemap = readFileSync(join(repoRoot, "src/pages/sitemap.xml.ts"), "utf8");

assert.match(studioPage, /export const prerender = false/);
assert.match(studioPage, /requireAdmin\(\{/);
assert.match(studioPage, /user: Astro\.locals\.user/);
assert.match(studioPage, /profile: Astro\.locals\.profile/);
assert.match(studioPage, /metaRobots="noindex, nofollow"/);

assert.doesNotMatch(baseLayout, /href=["'{`]\/studio\//);
assert.doesNotMatch(sitemap, /path:\s*["']\/studio\//);

console.log("Deck Creator Studio access contract: passed");
