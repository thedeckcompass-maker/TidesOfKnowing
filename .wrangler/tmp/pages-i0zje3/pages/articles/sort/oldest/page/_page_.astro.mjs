globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, F as Fragment } from '../../../../../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../../../../../chunks/BaseLayout_DS19gWn5.mjs';
import { g as getCollection } from '../../../../../chunks/_astro_content_Bg9Z9cCj.mjs';
import { a as sortArticlesLibraryOldest } from '../../../../../chunks/articleLibraryOrder_De62hMdp.mjs';
import { t as totalPages, L as LIBRARY_PER_PAGE, s as slicePage, l as libraryPaginationState } from '../../../../../chunks/libraryPageUrls_F05VWkAB.mjs';
import { r as readingMinutesForArticle, $ as $$ArticleCard } from '../../../../../chunks/ArticleCard_BfOHqZjy.mjs';
import { s as seriesOptionsFromArticles, $ as $$LibraryToolbar, a as $$LibraryPagination } from '../../../../../chunks/LibraryPagination_DamlHYMY.mjs';
import { b as breadcrumbJsonLd, $ as $$Breadcrumbs } from '../../../../../chunks/breadcrumbs_SFsIZKDM.mjs';
/* empty css                                              */
export { renderers } from '../../../../../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
async function getStaticPaths() {
  const articles = await getCollection("articles");
  const sorted = sortArticlesLibraryOldest(articles);
  const tp = totalPages(sorted.length, LIBRARY_PER_PAGE);
  if (tp <= 1) return [];
  return Array.from({ length: tp - 1 }, (_, i) => ({
    params: { page: String(i + 2) }
  }));
}
const $$page = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$page;
  const PAGE_DESCRIPTION = "Articles on tarot methodology, precision reading, and intuition development, oldest first.";
  const pageNum = Number.parseInt(Astro2.params.page ?? "2", 10);
  const articles = await getCollection("articles");
  const sorted = sortArticlesLibraryOldest(articles);
  const tp = totalPages(sorted.length, LIBRARY_PER_PAGE);
  const listPage = slicePage(sorted, pageNum, LIBRARY_PER_PAGE);
  const base = siteBase(Astro2);
  const siteHref = base.href;
  const canonical = new URL(
    `/articles/sort/oldest/page/${pageNum}/`,
    base
  ).href;
  const PAGE_TITLE = `Articles, oldest first, page ${pageNum} | Tides of Knowing`;
  const seriesOpts = seriesOptionsFromArticles(articles);
  const minutesById = new Map(
    articles.map((a) => [a.id, readingMinutesForArticle(a)])
  );
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Tides of Knowing Articles, oldest first, page ${pageNum}`,
    description: PAGE_DESCRIPTION,
    url: canonical
  };
  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Articles", url: "/articles/" },
    { label: "Oldest first", url: "/articles/sort/oldest/" },
    { label: `Page ${pageNum}`, url: null }
  ];
  const jsonLd = [collectionLd, breadcrumbJsonLd(crumbs, siteHref)];
  const ogImage = listPage[0] ? new URL(listPage[0].data.heroImage, base).href : new URL("/favicon.svg", base).href;
  const pager = libraryPaginationState({ kind: "oldest" }, pageNum, tp, base);
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": PAGE_TITLE, "description": PAGE_DESCRIPTION, "ogUrl": canonical, "ogImage": ogImage, "metaAuthor": "Leigh Spencer", "sequentialLinks": {
    prev: pager.relPrevAbsolute ?? void 0,
    next: pager.relNextAbsolute ?? void 0
  }, "jsonLd": jsonLd, "data-astro-cid-h6xuyosw": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="tok-library tok-library--list page-inner" data-astro-cid-h6xuyosw> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, { "items": crumbs, "data-astro-cid-h6xuyosw": true })} <header class="tok-library__hero" data-reveal data-astro-cid-h6xuyosw> <h1 class="tok-library__title" data-astro-cid-h6xuyosw>Articles · Oldest first</h1> <p class="tok-library__lede" data-astro-cid-h6xuyosw>${PAGE_DESCRIPTION}</p> <p class="tok-library__page" data-astro-cid-h6xuyosw>Page ${pageNum} of ${tp}</p> </header> <section class="tok-library__section" aria-labelledby="all-heading" data-reveal data-astro-cid-h6xuyosw> <h2 id="all-heading" class="tok-library__h2" data-astro-cid-h6xuyosw>All articles</h2> ${renderComponent($$result2, "LibraryToolbar", $$LibraryToolbar, { "sort": "oldest", "showFilter": false, "filter": "all", "seriesOptions": seriesOpts, "data-astro-cid-h6xuyosw": true })} ${listPage.length === 0 ? renderTemplate`<p class="tok-library__empty" data-astro-cid-h6xuyosw>No articles on this page.</p>` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-h6xuyosw": true }, { "default": async ($$result3) => renderTemplate` <div class="tok-library__grid" data-astro-cid-h6xuyosw> ${listPage.map((a) => renderTemplate`${renderComponent($$result3, "ArticleCard", $$ArticleCard, { "article": a, "readingMinutes": minutesById.get(a.id) ?? 1, "data-astro-cid-h6xuyosw": true })}`)} </div> ${renderComponent($$result3, "LibraryPagination", $$LibraryPagination, { "prevHref": pager.prevHref, "nextHref": pager.nextHref, "pages": pager.pages, "data-astro-cid-h6xuyosw": true })} ` })}`} </section> </div> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/sort/oldest/page/[page].astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/sort/oldest/page/[page].astro";
const $$url = "/articles/sort/oldest/page/[page]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$page,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
