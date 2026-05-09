globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute, F as Fragment } from '../../../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../../../chunks/BaseLayout_DS19gWn5.mjs';
import { g as getCollection } from '../../../chunks/_astro_content_Bg9Z9cCj.mjs';
import { s as slugify } from '../../../chunks/slugify_CFEDbR9M.mjs';
import { s as sortArticles } from '../../../chunks/sortArticles_CRzKJa6r.mjs';
import { s as slicePage, L as LIBRARY_PER_PAGE, t as totalPages, l as libraryPaginationState } from '../../../chunks/libraryPageUrls_F05VWkAB.mjs';
import { r as readingMinutesForArticle, $ as $$ArticleCard } from '../../../chunks/ArticleCard_BfOHqZjy.mjs';
import { s as seriesOptionsFromArticles, $ as $$LibraryToolbar, a as $$LibraryPagination } from '../../../chunks/LibraryPagination_DamlHYMY.mjs';
import { b as breadcrumbJsonLd, $ as $$Breadcrumbs } from '../../../chunks/breadcrumbs_SFsIZKDM.mjs';
/* empty css                                       */
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
async function getStaticPaths() {
  const articles = await getCollection("articles");
  const slugs = [
    ...new Set(
      articles.filter((a) => a.data.seriesName).map((a) => slugify(a.data.seriesName))
    )
  ];
  return slugs.map((series) => ({ params: { series } }));
}
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const { series: seriesParam } = Astro2.params;
  const articles = await getCollection("articles");
  const filtered = articles.filter(
    (a) => a.data.seriesName && slugify(a.data.seriesName) === seriesParam
  );
  const sorted = sortArticles(filtered, "series");
  const listPage = slicePage(sorted, 1, LIBRARY_PER_PAGE);
  const tp = totalPages(sorted.length, LIBRARY_PER_PAGE);
  const seriesTitle = sorted[0]?.data.seriesName ?? seriesParam.replace(/-/g, " ");
  const PAGE_DESCRIPTION = `Articles in the \u201C${seriesTitle}\u201D series on Tides of Knowing.`;
  const base = siteBase(Astro2);
  const siteHref = base.href;
  const canonical = new URL(`/articles/filter/${seriesParam}/`, base).href;
  const PAGE_TITLE = `${seriesTitle} | Articles | Tides of Knowing`;
  const seriesOpts = seriesOptionsFromArticles(articles);
  const minutesById = new Map(
    articles.map((a) => [a.id, readingMinutesForArticle(a)])
  );
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${seriesTitle} | Tides of Knowing Articles`,
    description: PAGE_DESCRIPTION,
    url: canonical
  };
  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Articles", url: "/articles/" },
    { label: seriesTitle, url: null }
  ];
  const jsonLd = [collectionLd, breadcrumbJsonLd(crumbs, siteHref)];
  const ogImage = listPage[0] ? new URL(listPage[0].data.heroImage, base).href : new URL("/favicon.svg", base).href;
  const pager = libraryPaginationState(
    { kind: "filter", seriesSlug: seriesParam },
    1,
    tp,
    base
  );
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": PAGE_TITLE, "description": PAGE_DESCRIPTION, "ogUrl": canonical, "ogImage": ogImage, "metaAuthor": "Leigh Spencer", "sequentialLinks": {
    prev: pager.relPrevAbsolute ?? void 0,
    next: pager.relNextAbsolute ?? void 0
  }, "jsonLd": jsonLd, "data-astro-cid-gydtnd2l": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="tok-library tok-library--list page-inner" data-astro-cid-gydtnd2l> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, { "items": crumbs, "data-astro-cid-gydtnd2l": true })} <header class="tok-library__hero" data-reveal data-astro-cid-gydtnd2l> <h1 class="tok-library__title" data-astro-cid-gydtnd2l>${seriesTitle}</h1> <p class="tok-library__lede" data-astro-cid-gydtnd2l>${PAGE_DESCRIPTION}</p> <p class="tok-library__sub" data-astro-cid-gydtnd2l> <a${addAttribute(`/series/${seriesParam}/`, "href")} data-astro-cid-gydtnd2l>Series overview →</a> </p> </header> <section class="tok-library__section" aria-labelledby="all-heading" data-reveal data-astro-cid-gydtnd2l> <h2 id="all-heading" class="tok-library__h2" data-astro-cid-gydtnd2l>Articles in this series</h2> ${renderComponent($$result2, "LibraryToolbar", $$LibraryToolbar, { "sort": "newest", "showSort": false, "showFilter": true, "filter": seriesParam, "seriesOptions": seriesOpts, "data-astro-cid-gydtnd2l": true })} ${listPage.length === 0 ? renderTemplate`<p class="tok-library__empty" data-astro-cid-gydtnd2l>No articles in this series yet.</p>` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-gydtnd2l": true }, { "default": async ($$result3) => renderTemplate` <div class="tok-library__grid" data-astro-cid-gydtnd2l> ${listPage.map((a) => renderTemplate`${renderComponent($$result3, "ArticleCard", $$ArticleCard, { "article": a, "readingMinutes": minutesById.get(a.id) ?? 1, "data-astro-cid-gydtnd2l": true })}`)} </div> ${renderComponent($$result3, "LibraryPagination", $$LibraryPagination, { "prevHref": pager.prevHref, "nextHref": pager.nextHref, "pages": pager.pages, "data-astro-cid-gydtnd2l": true })} ` })}`} </section> </div> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/filter/[series]/index.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/filter/[series]/index.astro";
const $$url = "/articles/filter/[series]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
