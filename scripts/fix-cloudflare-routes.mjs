/**
 * Cloudflare Pages requires each _routes.json include/exclude rule to be ≤100 chars.
 * Astro's adapter can emit per-file excludes from public/ that exceed that limit.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const MAX_RULE_LENGTH = 100;
const routesPath = resolve("dist/_routes.json");

function shortenRule(rule) {
  if (rule.length <= MAX_RULE_LENGTH) return rule;

  const segments = rule.split("/").filter(Boolean);
  while (segments.length > 0) {
    const wildcard = `/${segments.join("/")}/*`;
    if (wildcard.length <= MAX_RULE_LENGTH) return wildcard;
    segments.pop();
  }

  return "/*";
}

function dedupeRules(rules) {
  const seen = new Set();
  const out = [];
  for (const rule of rules) {
    const shortened = shortenRule(rule);
    if (seen.has(shortened)) continue;
    seen.add(shortened);
    out.push(shortened);
  }
  return out;
}

const routes = JSON.parse(readFileSync(routesPath, "utf8"));

const original = {
  include: [...(routes.include ?? [])],
  exclude: [...(routes.exclude ?? [])],
};

routes.include = dedupeRules(routes.include ?? []);
routes.exclude = dedupeRules(routes.exclude ?? []);

const tooLong = [...routes.include, ...routes.exclude].filter(
  (r) => r.length > MAX_RULE_LENGTH
);
if (tooLong.length > 0) {
  console.error(
    "[fix-cloudflare-routes] Rules still exceed limit after shortening:"
  );
  for (const r of tooLong) console.error(`  ${r.length} ${r}`);
  process.exit(1);
}

const changed =
  JSON.stringify(original) !==
  JSON.stringify({ include: routes.include, exclude: routes.exclude });

if (changed) {
  const longInclude = original.include.filter((r) => r.length > MAX_RULE_LENGTH);
  const longExclude = original.exclude.filter((r) => r.length > MAX_RULE_LENGTH);
  if (longInclude.length || longExclude.length) {
    console.log("[fix-cloudflare-routes] Shortened over-limit rules:");
    for (const r of [...longInclude, ...longExclude]) {
      console.log(`  ${r.length} ${r}`);
      console.log(`    -> ${shortenRule(r)}`);
    }
  }
}

writeFileSync(routesPath, `${JSON.stringify(routes, null, 2)}\n`, "utf8");
console.log("[fix-cloudflare-routes] OK");
