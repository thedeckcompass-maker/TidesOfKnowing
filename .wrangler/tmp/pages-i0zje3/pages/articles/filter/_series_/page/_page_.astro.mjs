globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute, F as Fragment } from '../../../../../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../../../../../chunks/BaseLayout_DS19gWn5.mjs';
import { g as getCollection } from '../../../../../chunks/_astro_content_Bg9Z9cCj.mjs';
import { s as slugify } from '../../../../../chunks/slugify_CFEDbR9M.mjs';
import { s as sortArticles } from '../../../../../chunks/sortArticles_CRzKJa6r.mjs';
import { t as totalPages, s as slicePage, l as libraryPaginationState, L as LIBRARY_PER_PAGE } from '../../../../../chunks/libraryPageUrls_F05VWkAB.mjs';
import { r as readingMinutesForArticle, $ as $$ArticleCard } from '../../../../../chunks/ArticleCard_BfOHqZjy.mjs';
import { s as seriesOptionsFromArticles, $ as $$LibraryToolbar, a as $$LibraryPagination } from '../../../../../chunks/LibraryPagination_DamlHYMY.mjs';
import { b as breadcrumbJsonLd, $ as $$Breadcrumbs } from '../../../../../chunks/breadcrumbs_SFsIZKDM.mjs';
/* empty css                                              */
export { renderers } from '../../../../../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
async function getStaticPaths() {
  const articles = await getCollection("articles");
  const bySeries = /* @__PURE__ */ new Map();
  for (const a of articles) {
    const n = a.data.seriesName;
    if (!n) continue;
    const s = slugify(n);
    const list = bySeries.get(s) ?? [];
    list.push(a);
    bySeries.set(s, list);
  }
  const out = [];
  for (const [seriesSlug, list] of bySeries) {
    const sorted = sortArticles(list, "series");
    const tp = totalPages(sorted.length, LIBRARY_PER_PAGE);
    if (tp <= 1) continue;
    for (let p = 2; p <= tp; p++) {
      out.push({ params: { series: seriesSlug, page: String(p) } });
    }
  }
  return out;
}
const $$page = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$page;
  const { series: seriesParam, page: pageStr } = Astro2.params;
  const pageNum = Number.parseInt(pageStr ?? "2", 10);
  const articles = await getCollection("articles");
  const filtered = articles.filter(
    (a) => a.data.seriesName && slugify(a.data.seriesName) === seriesParam
  );
  const sorted = sortArticles(filtered, "series");
  const tp = totalPages(sorted.length, LIBRARY_PER_PAGE);
  const listPage = slicePage(sorted, pageNum, LIBRARY_PER_PAGE);
  const seriesTitle = sorted[0]?.data.seriesName ?? (seriesParam ?? "").replace(/-/g, " ");
  const PAGE_DESCRIPTION = `Articles in the \u201C${seriesTitle}\u201D series on Tides of Knowing.`;
  const base = siteBase(Astro2);
  const siteHref = base.href;
  const canonical = new URL(
    `/articles/filter/${seriesParam}/page/${pageNum}/`,
    base
  ).href;
  const PAGE_TITLE = `${seriesTitle} | Articles, page ${pageNum} | Tides of Knowing`;
  const seriesOpts = seriesOptionsFromArticles(articles);
  const minutesById = new Map(
    articles.map((a) => [a.id, readingMinutesForArticle(a)])
  );
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${seriesTitle}, page ${pageNum}`,
    description: PAGE_DESCRIPTION,
    url: canonical
  };
  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Articles", url: "/articles/" },
    {
      label: seriesTitle,
      url: `/articles/filter/${seriesParam}/`
    },
    { label: `Page ${pageNum}`, url: null }
  ];
  const jsonLd = [collectionLd, breadcrumbJsonLd(crumbs, siteHref)];
  const ogImage = listPage[0] ? new URL(listPage[0].data.heroImage, base).href : new URL("/favicon.svg", base).href;
  const pager = libraryPaginationState(
    { kind: "filter", seriesSlug: seriesParam },
    pageNum,
    tp,
    base
  );
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": PAGE_TITLE, "description": PAGE_DESCRIPTION, "ogUrl": canonical, "ogImage": ogImage, "metaAuthor": "Leigh Spencer", "sequentialLinks": {
    prev: pager.relPrevAbsolute ?? void 0,
    next: pager.relNextAbsolute ?? void 0
  }, "jsonLd": jsonLd, "data-astro-cid-zi7obbnd": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="tok-library tok-library--list page-inner" data-astro-cid-zi7obbnd> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, { "items": crumbs, "data-astro-cid-zi7obbnd": true })} <header class="tok-library__hero" data-reveal data-astro-cid-zi7obbnd> <h1 class="tok-library__title" data-astro-cid-zi7obbnd>${seriesTitle}</h1> <p class="tok-library__lede" data-astro-cid-zi7obbnd>${PAGE_DESCRIPTION}</p> <p class="tok-library__page" data-astro-cid-zi7obbnd>Page ${pageNum} of ${tp}</p> <p class="tok-library__sub" data-astro-cid-zi7obbnd> <a${addAttribute(`/series/${seriesParam}/`, "href")} data-astro-cid-zi7obbnd>Series overview →</a> </p> </header> <section class="tok-library__section" aria-labelledby="all-heading" data-reveal data-astro-cid-zi7obbnd> <h2 id="all-heading" class="tok-library__h2" data-astro-cid-zi7obbnd>Articles in this series</h2> ${renderComponent($$result2, "LibraryToolbar", $$LibraryToolbar, { "sort": "newest", "showSort": false, "showFilter": true, "filter": seriesParam, "seriesOptions": seriesOpts, "data-astro-cid-zi7obbnd": true })} ${listPage.length === 0 ? renderTemplate`<p class="tok-library__empty" data-astro-cid-zi7obbnd>No articles on this page.</p>` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-zi7obbnd": true }, { "default": async ($$result3) => renderTemplate` <div class="tok-library__grid" data-astro-cid-zi7obbnd> ${listPage.map((a) => renderTemplate`${renderComponent($$result3, "ArticleCard", $$ArticleCard, { "article": a, "readingMinutes": minutesById.get(a.id) ?? 1, "data-astro-cid-zi7obbnd": true })}`)} </div> ${renderComponent($$result3, "LibraryPagination", $$LibraryPagination, { "prevHref": pager.prevHref, "nextHref": pager.nextHref, "pages": pager.pages, "data-astro-cid-zi7obbnd": true })} ` })}`} </section> </div> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/filter/[series]/page/[page].astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/filter/[series]/page/[page].astro";
const $$url = "/articles/filter/[series]/page/[page]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$page,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
