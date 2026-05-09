globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, F as Fragment } from '../../../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../../../chunks/BaseLayout_DS19gWn5.mjs';
import { g as getCollection } from '../../../chunks/_astro_content_Bg9Z9cCj.mjs';
import { s as sortArticles } from '../../../chunks/sortArticles_CRzKJa6r.mjs';
import { s as slicePage, L as LIBRARY_PER_PAGE, t as totalPages, l as libraryPaginationState } from '../../../chunks/libraryPageUrls_F05VWkAB.mjs';
import { r as readingMinutesForArticle, $ as $$ArticleCard } from '../../../chunks/ArticleCard_BfOHqZjy.mjs';
import { s as seriesOptionsFromArticles, $ as $$LibraryToolbar, a as $$LibraryPagination } from '../../../chunks/LibraryPagination_DamlHYMY.mjs';
import { b as breadcrumbJsonLd, $ as $$Breadcrumbs } from '../../../chunks/breadcrumbs_SFsIZKDM.mjs';
/* empty css                                       */
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const PAGE_DESCRIPTION = "Browse all articles grouped by series, tarot methodology and intuition development from Tides of Knowing.";
  const articles = await getCollection("articles");
  const sorted = sortArticles(articles, "series");
  const listPage = slicePage(sorted, 1, LIBRARY_PER_PAGE);
  const tp = totalPages(sorted.length, LIBRARY_PER_PAGE);
  const base = siteBase(Astro2);
  const siteHref = base.href;
  const canonical = new URL("/articles/sort/series/", base).href;
  const PAGE_TITLE = "Articles, by series | Tides of Knowing | Tarot Methodology & Intuition Development";
  const seriesOpts = seriesOptionsFromArticles(articles);
  const minutesById = new Map(
    articles.map((a) => [a.id, readingMinutesForArticle(a)])
  );
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tides of Knowing Articles, by series",
    description: PAGE_DESCRIPTION,
    url: canonical
  };
  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Articles", url: "/articles/" },
    { label: "By series", url: null }
  ];
  const jsonLd = [collectionLd, breadcrumbJsonLd(crumbs, siteHref)];
  const ogImage = listPage[0] ? new URL(listPage[0].data.heroImage, base).href : new URL("/favicon.svg", base).href;
  const pager = libraryPaginationState({ kind: "series" }, 1, tp, base);
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": PAGE_TITLE, "description": PAGE_DESCRIPTION, "ogUrl": canonical, "ogImage": ogImage, "metaAuthor": "Leigh Spencer", "sequentialLinks": {
    prev: pager.relPrevAbsolute ?? void 0,
    next: pager.relNextAbsolute ?? void 0
  }, "jsonLd": jsonLd, "data-astro-cid-f3bzszme": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="tok-library tok-library--list page-inner" data-astro-cid-f3bzszme> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, { "items": crumbs, "data-astro-cid-f3bzszme": true })} <header class="tok-library__hero" data-reveal data-astro-cid-f3bzszme> <h1 class="tok-library__title" data-astro-cid-f3bzszme>Articles · By series</h1> <p class="tok-library__lede" data-astro-cid-f3bzszme>${PAGE_DESCRIPTION}</p> </header> <section class="tok-library__section" aria-labelledby="all-heading" data-reveal data-astro-cid-f3bzszme> <h2 id="all-heading" class="tok-library__h2" data-astro-cid-f3bzszme>All articles</h2> ${renderComponent($$result2, "LibraryToolbar", $$LibraryToolbar, { "sort": "series", "showFilter": false, "filter": "all", "seriesOptions": seriesOpts, "data-astro-cid-f3bzszme": true })} ${listPage.length === 0 ? renderTemplate`<p class="tok-library__empty" data-astro-cid-f3bzszme>
Articles will appear here as they are published.
</p>` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-f3bzszme": true }, { "default": async ($$result3) => renderTemplate` <div class="tok-library__grid" data-astro-cid-f3bzszme> ${listPage.map((a) => renderTemplate`${renderComponent($$result3, "ArticleCard", $$ArticleCard, { "article": a, "readingMinutes": minutesById.get(a.id) ?? 1, "data-astro-cid-f3bzszme": true })}`)} </div> ${renderComponent($$result3, "LibraryPagination", $$LibraryPagination, { "prevHref": pager.prevHref, "nextHref": pager.nextHref, "pages": pager.pages, "data-astro-cid-f3bzszme": true })} ` })}`} </section> </div> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/sort/series/index.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/sort/series/index.astro";
const $$url = "/articles/sort/series";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
