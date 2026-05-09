globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../chunks/BaseLayout_DS19gWn5.mjs';
import { g as getCollection } from '../chunks/_astro_content_Bg9Z9cCj.mjs';
import { s as slugify } from '../chunks/slugify_CFEDbR9M.mjs';
import { s as sortArticles } from '../chunks/sortArticles_CRzKJa6r.mjs';
import { b as breadcrumbJsonLd, $ as $$Breadcrumbs } from '../chunks/breadcrumbs_SFsIZKDM.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const articles = await getCollection("articles");
  const bySeries = /* @__PURE__ */ new Map();
  for (const a of articles) {
    const name = a.data.seriesName;
    if (!name) continue;
    const slug = slugify(name);
    const cur = bySeries.get(slug);
    if (!cur) bySeries.set(slug, { title: name, items: [a] });
    else cur.items.push(a);
  }
  const rows = [...bySeries.entries()].map(([slug, v]) => {
    const byReadingOrder = sortArticles(v.items, "series");
    const first = byReadingOrder[0];
    const latest = sortArticles(v.items, "newest")[0];
    return {
      slug,
      title: v.title,
      count: v.items.length,
      /** Primary list link: part 1 (by seriesOrder, then publish date). */
      startHref: first ? `/articles/${first.data.slug}/` : `/series/${slug}/`,
      latestTitle: latest?.data.title,
      latestHref: latest ? `/articles/${latest.data.slug}/` : null,
      latestDate: latest?.data.publishDate
    };
  });
  rows.sort((a, b) => a.title.localeCompare(b.title));
  const PAGE_TITLE = "Series | Tides of Knowing Articles";
  const PAGE_DESCRIPTION = "Browse article series on tarot methodology, precision reading, and intuition development.";
  const base = siteBase(Astro2);
  const siteHref = base.href;
  const canonical = new URL("/series/", base).href;
  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Articles", url: "/articles/" },
    { label: "Series", url: null }
  ];
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: canonical
  };
  const jsonLd = [collectionLd, breadcrumbJsonLd(crumbs, siteHref)];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": PAGE_TITLE, "description": PAGE_DESCRIPTION, "ogUrl": canonical, "ogImage": new URL("/favicon.svg", base).href, "metaAuthor": "Leigh Spencer", "jsonLd": jsonLd, "data-astro-cid-4ntybcpi": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="tok-series-index page-inner" data-astro-cid-4ntybcpi> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, { "items": crumbs, "data-astro-cid-4ntybcpi": true })} <header class="tok-series-index__head" data-reveal data-astro-cid-4ntybcpi> <h1 class="tok-series-index__title" data-astro-cid-4ntybcpi>Series</h1> <p class="tok-series-index__lede" data-astro-cid-4ntybcpi>${PAGE_DESCRIPTION}</p> </header> ${rows.length === 0 ? renderTemplate`<p class="tok-series-index__empty" data-reveal data-astro-cid-4ntybcpi>
Series will appear when articles include a <code data-astro-cid-4ntybcpi>seriesName</code> in
          frontmatter.
</p>` : renderTemplate`<ul class="tok-series-index__list" data-astro-cid-4ntybcpi> ${rows.map((r) => renderTemplate`<li class="tok-series-index__item" data-reveal data-astro-cid-4ntybcpi> <a class="tok-series-index__link"${addAttribute(r.startHref, "href")} data-astro-cid-4ntybcpi> <span class="tok-series-index__name" data-astro-cid-4ntybcpi>${r.title}</span> <span class="tok-series-index__meta" data-astro-cid-4ntybcpi> ${r.count} article${r.count === 1 ? "" : "s"} </span> </a> <p class="tok-series-index__sub" data-astro-cid-4ntybcpi> <a class="tok-series-index__overview"${addAttribute(`/series/${r.slug}/`, "href")} data-astro-cid-4ntybcpi>
Series overview
</a> </p> ${r.latestTitle && r.latestHref && r.latestDate && renderTemplate`<p class="tok-series-index__latest" data-astro-cid-4ntybcpi>
Latest:${" "} <a${addAttribute(r.latestHref, "href")} data-astro-cid-4ntybcpi>${r.latestTitle}</a> <time${addAttribute(r.latestDate.toISOString(), "datetime")} data-astro-cid-4ntybcpi> ${" "}
·${" "} ${r.latestDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })} </time> </p>`} </li>`)} </ul>`} </div> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/series/index.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/series/index.astro";
const $$url = "/series";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
