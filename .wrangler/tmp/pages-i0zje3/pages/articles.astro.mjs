globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, m as maybeRenderHead, d as addAttribute, b as renderTemplate, r as renderComponent, F as Fragment } from '../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../chunks/BaseLayout_DS19gWn5.mjs';
import { g as getCollection } from '../chunks/_astro_content_Bg9Z9cCj.mjs';
import { s as sortArticlesLibraryNewest, g as getLibraryFeaturedArticles } from '../chunks/articleLibraryOrder_De62hMdp.mjs';
import { s as slicePage, L as LIBRARY_PER_PAGE, t as totalPages, l as libraryPaginationState, a as LIBRARY_FEATURED_COUNT } from '../chunks/libraryPageUrls_F05VWkAB.mjs';
import { r as readingMinutesForArticle, $ as $$ArticleCard } from '../chunks/ArticleCard_BfOHqZjy.mjs';
import { s as seriesOptionsFromArticles, g as groupArticlesBySeries, $ as $$LibraryToolbar, a as $$LibraryPagination } from '../chunks/LibraryPagination_DamlHYMY.mjs';
import { b as breadcrumbJsonLd, $ as $$Breadcrumbs } from '../chunks/breadcrumbs_SFsIZKDM.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro$1 = createAstro("https://www.tidesofknowing.com");
const $$ArticleCardFeatured = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$ArticleCardFeatured;
  const { article, readingMinutes } = Astro2.props;
  const {
    title,
    subtitle,
    slug,
    publishDate,
    excerpt,
    heroImage,
    heroImageAlt,
    seriesName,
    listBadge
  } = article.data;
  const cardBadge = seriesName?.trim() || listBadge?.trim();
  const maxExcerpt = 200;
  const longExcerpt = excerpt.length > maxExcerpt ? `${excerpt.slice(0, maxExcerpt).trim()}\u2026` : excerpt;
  const displayDate = publishDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return renderTemplate`${maybeRenderHead()}<article class="feat-card" data-astro-cid-jt6ziea2> <a class="feat-card__link"${addAttribute(`/articles/${slug}/`, "href")} data-astro-cid-jt6ziea2> <div class="feat-card__media" data-astro-cid-jt6ziea2> <img${addAttribute(heroImage, "src")}${addAttribute(heroImageAlt, "alt")} class="feat-card__img" width="800" height="450" loading="lazy" decoding="async" data-astro-cid-jt6ziea2> </div> <div class="feat-card__body" data-astro-cid-jt6ziea2> ${cardBadge && renderTemplate`<span class="feat-card__badge" data-astro-cid-jt6ziea2>${cardBadge}</span>`} <h2 class="feat-card__title" data-astro-cid-jt6ziea2>${title}</h2> ${subtitle && renderTemplate`<p class="feat-card__subtitle" data-astro-cid-jt6ziea2>${subtitle}</p>`} <p class="feat-card__excerpt" data-astro-cid-jt6ziea2>${longExcerpt}</p> <div class="feat-card__meta" data-astro-cid-jt6ziea2> <time${addAttribute(publishDate.toISOString(), "datetime")} data-astro-cid-jt6ziea2>${displayDate}</time> <span data-astro-cid-jt6ziea2>${readingMinutes} min read</span> </div> <span class="feat-card__cta" data-astro-cid-jt6ziea2>Read article</span> </div> </a> </article> `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/ArticleCardFeatured.astro", void 0);

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const PAGE_TITLE = "Articles | Tides of Knowing | Tarot Methodology & Intuition Development";
  const PAGE_DESCRIPTION = "Browse methodology articles on tarot, precision reading, and intuition development, with series, topics, and pagination. Insights from 40+ years of professional practice.";
  const articles = await getCollection("articles");
  const sortedNewest = sortArticlesLibraryNewest(articles);
  const {
    featured,
    heading: featuredHeading,
    featuredHeadingId,
    ogArticle
  } = getLibraryFeaturedArticles(articles, sortedNewest, LIBRARY_FEATURED_COUNT);
  const listPage = slicePage(sortedNewest, 1, LIBRARY_PER_PAGE);
  const tp = totalPages(sortedNewest.length, LIBRARY_PER_PAGE);
  const seriesOpts = seriesOptionsFromArticles(articles);
  const seriesGroups = groupArticlesBySeries(articles);
  const base = siteBase(Astro2);
  const siteHref = base.href;
  const canonical = new URL("/articles/", base).href;
  const minutesById = new Map(
    articles.map((a) => [a.id, readingMinutesForArticle(a)])
  );
  const articlesItemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: canonical,
    numberOfItems: sortedNewest.length,
    itemListElement: sortedNewest.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: a.data.title,
      url: new URL(`/articles/${a.data.slug}/`, siteHref).href
    }))
  };
  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Articles", url: null }
  ];
  const jsonLd = [articlesItemListLd, breadcrumbJsonLd(crumbs, siteHref)];
  const ogImage = ogArticle ? new URL(ogArticle.data.heroImage, base).href : new URL("/favicon.svg", base).href;
  const pager = libraryPaginationState({ kind: "newest" }, 1, tp, base);
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": PAGE_TITLE, "description": PAGE_DESCRIPTION, "ogUrl": canonical, "ogImage": ogImage, "metaAuthor": "Leigh Spencer", "sequentialLinks": {
    prev: pager.relPrevAbsolute ?? void 0,
    next: pager.relNextAbsolute ?? void 0
  }, "jsonLd": jsonLd, "data-astro-cid-h5q2y2v6": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="tok-library page-inner" data-astro-cid-h5q2y2v6> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, { "items": crumbs, "data-astro-cid-h5q2y2v6": true })} <header class="tok-library__hero tok-library__hero--brand surface-system" data-reveal data-astro-cid-h5q2y2v6> <h1 class="tok-library__title" data-astro-cid-h5q2y2v6>Articles</h1> <p class="tok-library__lede" data-astro-cid-h5q2y2v6>${PAGE_DESCRIPTION}</p> </header> ${featured.length > 0 && renderTemplate`<section class="tok-library__section"${addAttribute(featuredHeadingId, "aria-labelledby")} data-reveal data-astro-cid-h5q2y2v6> <h2${addAttribute(featuredHeadingId, "id")} class="tok-library__h2" data-astro-cid-h5q2y2v6> ${featuredHeading} </h2> <div class="tok-library__feat-grid" data-astro-cid-h5q2y2v6> ${featured.map((a) => renderTemplate`${renderComponent($$result2, "ArticleCardFeatured", $$ArticleCardFeatured, { "article": a, "readingMinutes": minutesById.get(a.id) ?? 1, "data-astro-cid-h5q2y2v6": true })}`)} </div> </section>`} ${seriesGroups.length > 0 && renderTemplate`<section class="tok-library__section" aria-labelledby="series-heading" data-reveal data-astro-cid-h5q2y2v6> <h2 id="series-heading" class="tok-library__h2" data-astro-cid-h5q2y2v6>
Series collections
</h2> <div class="tok-library__series" data-astro-cid-h5q2y2v6> ${seriesGroups.map((g, i) => renderTemplate`<details class="tok-series-acc"${addAttribute(i === 0, "open")} data-astro-cid-h5q2y2v6> <summary class="tok-series-acc__summary" data-astro-cid-h5q2y2v6> <span class="tok-series-acc__name" data-astro-cid-h5q2y2v6>${g.seriesName}</span> <span class="tok-series-acc__count" data-astro-cid-h5q2y2v6>(${g.items.length})</span> </summary> <ol class="tok-series-acc__parts" data-astro-cid-h5q2y2v6> ${g.items.map((a) => renderTemplate`<li data-astro-cid-h5q2y2v6> <a${addAttribute(`/articles/${a.data.slug}/`, "href")} data-astro-cid-h5q2y2v6>${a.data.title}</a> ${a.data.seriesOrder != null && renderTemplate`<span class="tok-series-acc__part" data-astro-cid-h5q2y2v6> ${" "}
· Part ${a.data.seriesOrder} </span>`} </li>`)} </ol> <p class="tok-series-acc__more" data-astro-cid-h5q2y2v6> <a${addAttribute(`/articles/${g.items[0].data.slug}/`, "href")} data-astro-cid-h5q2y2v6>Start reading →</a> ${" \xB7 "} <a${addAttribute(`/series/${g.seriesSlug}/`, "href")} data-astro-cid-h5q2y2v6>Series overview</a> </p> </details>`)} </div> </section>`} <section class="tok-library__section" id="all-articles" aria-labelledby="all-heading" data-reveal data-astro-cid-h5q2y2v6> <h2 id="all-heading" class="tok-library__h2" data-astro-cid-h5q2y2v6>All articles</h2> ${renderComponent($$result2, "LibraryToolbar", $$LibraryToolbar, { "sort": "newest", "showFilter": true, "filter": "all", "seriesOptions": seriesOpts, "data-astro-cid-h5q2y2v6": true })} ${listPage.length === 0 ? renderTemplate`<p class="tok-library__empty" data-astro-cid-h5q2y2v6>
Articles will appear here as they are published.
</p>` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-h5q2y2v6": true }, { "default": async ($$result3) => renderTemplate` <div class="tok-library__grid" data-astro-cid-h5q2y2v6> ${listPage.map((a) => renderTemplate`${renderComponent($$result3, "ArticleCard", $$ArticleCard, { "article": a, "readingMinutes": minutesById.get(a.id) ?? 1, "data-astro-cid-h5q2y2v6": true })}`)} </div> ${renderComponent($$result3, "LibraryPagination", $$LibraryPagination, { "prevHref": pager.prevHref, "nextHref": pager.nextHref, "pages": pager.pages, "data-astro-cid-h5q2y2v6": true })} ` })}`} </section> </div> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/index.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/index.astro";
const $$url = "/articles";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
