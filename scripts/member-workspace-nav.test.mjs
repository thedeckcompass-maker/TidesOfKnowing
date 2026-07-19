#!/usr/bin/env node
/**
 * Member workspace header navigation — layout contracts.
 * Run: node scripts/member-workspace-nav.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let passed = 0;
let failed = 0;

function run(name, fn) {
  try {
    fn();
    console.log(`  ok — ${name}`);
    passed += 1;
  } catch (err) {
    console.error(`  FAIL — ${name}`);
    console.error(`         ${err.message}`);
    failed += 1;
  }
}

const css = readFileSync(join(REPO_ROOT, "src/styles/member-workspace.css"), "utf8");
const source = readFileSync(
  join(REPO_ROOT, "src/components/community/MemberWorkspaceHeader.astro"),
  "utf8",
);

const mobileBlock = (() => {
  // Drawer rules live in the max-width: 900px block that enables the Menu toggle.
  const toggleIdx = css.indexOf(
    ".member-workspace-header__toggle {\n    display: inline-flex",
  );
  const toggleIdxCrlf = css.indexOf(
    ".member-workspace-header__toggle {\r\n    display: inline-flex",
  );
  const start = Math.max(toggleIdx, toggleIdxCrlf);
  assert.ok(start >= 0, "mobile toggle rule missing");
  const navStart = css.indexOf(".member-workspace-header__nav {", start);
  assert.ok(navStart >= 0, "mobile nav rule missing");
  return css.slice(navStart, navStart + 1600);
})();

const desktopBlock = (() => {
  const start = css.indexOf("@media (min-width: 901px)");
  assert.ok(start >= 0, "desktop member-header media query missing");
  const end = css.indexOf("@media (max-width: 900px)", start);
  return css.slice(start, end > start ? end : start + 1200);
})();

run("menu panel uses centred inset width, not 100vw full-bleed", () => {
  assert.match(mobileBlock, /left:\s*50%/);
  assert.match(mobileBlock, /transform:\s*translateX\(-50%\)/);
  assert.match(mobileBlock, /width:\s*min\(\s*var\(--mwh-nav-max\)\s*,\s*100%\s*\)/);
  assert.match(mobileBlock, /--mwh-nav-max:\s*22rem/);
  assert.match(mobileBlock, /box-sizing:\s*border-box/);
  assert.equal(/width:\s*100vw/.test(mobileBlock), false);
  assert.equal(/100vw/.test(mobileBlock), false);
  assert.equal(/left:\s*0\s*;\s*right:\s*0/.test(mobileBlock), false);
});

run("menu panel has balanced horizontal gutters and safe-area insets", () => {
  assert.match(mobileBlock, /--mwh-nav-gutter:\s*1\.15rem/);
  assert.match(mobileBlock, /env\(safe-area-inset-left/);
  assert.match(mobileBlock, /env\(safe-area-inset-right/);
  assert.match(mobileBlock, /max\(var\(--mwh-nav-gutter\)/);
  assert.equal(/margin-left:\s*-/.test(mobileBlock), false);
  assert.equal(/left:\s*-/.test(mobileBlock), false);
});

run("menu panel allows vertical scroll without horizontal overflow", () => {
  assert.match(mobileBlock, /overflow-x:\s*hidden/);
  assert.match(mobileBlock, /overflow-y:\s*auto/);
  assert.match(mobileBlock, /max-height:\s*calc\(100dvh/);
  // Do not paper over geometry bugs with body overflow clipping.
  assert.equal(/member-workspace-nav-open\)\s*\{\s*overflow-x:\s*clip/.test(css), false);
});

run("menu labels and destinations are unchanged", () => {
  assert.match(source, /\bCommunity\b/);
  assert.match(source, /\bAccount\b/);
  assert.match(source, /Ask Leilia/);
  assert.match(source, /Administration/);
  assert.match(source, /Logout/);
  assert.match(source, /Return to Website/);
  assert.match(source, /href="\/community\/"/);
  assert.match(source, /href="\/community\/account\/"/);
  assert.match(source, /href="\/ask-leilia\/"/);
  assert.match(source, /href="\/ask-leilia\/admin\/"/);
  assert.match(source, /action="\/auth\/logout\/"/);
  assert.match(source, /href="\/"/);
});

run("open and close behaviour keeps aria-expanded and focus return", () => {
  assert.match(source, /aria-expanded/);
  assert.match(source, /aria-controls="member-workspace-nav"/);
  assert.match(source, /dataset\.bound === ["']true["']/);
  assert.match(source, /Escape/);
  assert.match(source, /toggle\.focus/);
  assert.match(source, /orientationchange/);
  assert.match(source, /min-width:\s*901px/);
  assert.match(source, /member-workspace-header__nav--open/);
});

run("desktop navigation breakpoint remains separate from the mobile drawer", () => {
  assert.match(css, /@media \(min-width:\s*901px\)/);
  assert.match(css, /@media \(max-width:\s*900px\)/);
  assert.match(desktopBlock, /\.member-workspace-header__return\s*\{[\s\S]*display:\s*block/);
  assert.equal(/translateX\(-50%\)/.test(desktopBlock), false);
  assert.equal(/--mwh-nav-max/.test(desktopBlock), false);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
