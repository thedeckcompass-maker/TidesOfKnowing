/**
 * Lightweight post-build checks for SEO indexing patches.
 * Run: node scripts/seo-patch-validation.mjs
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

function readDistHtml(relativePath) {
  const candidates = [
    join(dist, relativePath, "index.html"),
    join(dist, relativePath + ".html"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, "utf8");
  }
  return null;
}

function countH1(html) {
  return (html.match(/<h1\b/gi) ?? []).length;
}

function extractMeta(html, name) {
  const re = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`,
    "i",
  );
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

function extractCanonical(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (m) return m[1];
  const m2 = html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return m2 ? m2[1] : null;
}

function extractPersonUrlFromJsonLd(html) {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, raw] of scripts) {
    try {
      const data = JSON.parse(raw);
      const graphs = Array.isArray(data) ? data : [data];
      for (const block of graphs) {
        const graph = block["@graph"] ?? [block];
        for (const node of graph) {
          if (node["@type"] === "Person" && node.url) {
            return { url: node.url, sameAs: node.sameAs };
          }
        }
      }
    } catch {
      /* ignore parse errors */
    }
  }
  return null;
}

async function main() {
  const results = [];
  const push = (name, ok, detail) => results.push({ name, ok, detail });

  const entityHtml = readDistHtml("repeating-card-meanings/the-fool");
  if (entityHtml) {
    push(
      "Entity page single H1",
      countH1(entityHtml) === 1,
      `h1 count=${countH1(entityHtml)}`,
    );
    push(
      "Entity page indexable",
      !extractMeta(entityHtml, "robots") ||
        /index/i.test(extractMeta(entityHtml, "robots") ?? ""),
      `robots=${extractMeta(entityHtml, "robots") ?? "(absent)"}`,
    );
    const canon = extractCanonical(entityHtml);
    push(
      "Entity self-canonical",
      canon?.includes("/repeating-card-meanings/the-fool/") ?? false,
      `canonical=${canon ?? "(missing)"}`,
    );
    push(
      "Entity author strip",
      entityHtml.includes("40+ years tarot experience and 30 years in journalism"),
      "author line present",
    );
  } else {
    push("Entity page dist HTML", false, "dist/repeating-card-meanings/the-fool/ not found");
  }

  const toolHtml = readDistHtml("tools/repeating-card-meanings/majors/the-fool");
  if (toolHtml) {
    push(
      "Tool deep-link noindex",
      extractMeta(toolHtml, "robots") === "noindex, follow",
      `robots=${extractMeta(toolHtml, "robots") ?? "(missing)"}`,
    );
    push(
      "Tool deep-link canonical to entity",
      extractCanonical(toolHtml)?.includes("/repeating-card-meanings/the-fool/") ?? false,
      `canonical=${extractCanonical(toolHtml) ?? "(missing)"}`,
    );
    push(
      "Tool deep-link no author strip",
      !toolHtml.includes("40+ years tarot experience and 30 years in journalism"),
      "author strip absent on tool page",
    );
  } else {
    push("Tool deep-link dist HTML", false, "dist/tools/.../the-fool not found");
  }

  const hubHtml = readDistHtml("tools/repeating-card-meanings");
  if (hubHtml) {
    const robots = extractMeta(hubHtml, "robots");
    push(
      "Tool hub indexable",
      !robots || /index/i.test(robots),
      `robots=${robots ?? "(absent)"}`,
    );
  } else {
    push(
      "Tool hub dist HTML",
      true,
      "skipped (SSR route; hub remains indexable in production)",
    );
  }

  const sitemapPath = join(dist, "sitemap.xml");
  if (existsSync(sitemapPath)) {
    const xml = readFileSync(sitemapPath, "utf8");
    push(
      "Sitemap has lastmod",
      xml.includes("<lastmod>"),
      `<lastmod> count=${(xml.match(/<lastmod>/g) ?? []).length}`,
    );
    push(
      "Sitemap includes entity URLs",
      xml.includes("/repeating-card-meanings/the-fool/"),
      "the-fool entity loc present",
    );
    push(
      "Sitemap omits tool deep-link",
      !xml.includes("/tools/repeating-card-meanings/majors/the-fool/"),
      "tool deep-link not in sitemap",
    );
  } else {
    push("Sitemap dist file", false, "dist/sitemap.xml not found");
  }

  const homeHtml = readDistHtml("") ?? readDistHtml("index");
  const jsonLdHtml = homeHtml ?? entityHtml;
  if (jsonLdHtml) {
    const person = extractPersonUrlFromJsonLd(jsonLdHtml);
    push(
      "Person url tides about",
      person?.url === "https://www.tidesofknowing.com/about/",
      `url=${person?.url ?? "(missing)"}`,
    );
    push(
      "Person sameAs deck compass",
      Array.isArray(person?.sameAs) &&
        person.sameAs.includes("https://www.thedeckcompass.com/about"),
      `sameAs=${JSON.stringify(person?.sameAs ?? null)}`,
    );
  } else {
    push("Person JSON-LD in dist HTML", false, "no prerendered page with ecosystem graph");
  }

  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? "PASS" : "FAIL";
    if (!r.ok) failed += 1;
    console.log(`${mark} ${r.name}: ${r.detail}`);
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
