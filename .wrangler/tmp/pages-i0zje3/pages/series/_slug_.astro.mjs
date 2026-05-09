globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../../chunks/BaseLayout_DS19gWn5.mjs';
import { g as getCollection } from '../../chunks/_astro_content_Bg9Z9cCj.mjs';
import { s as slugify } from '../../chunks/slugify_CFEDbR9M.mjs';
import { s as sortArticles } from '../../chunks/sortArticles_CRzKJa6r.mjs';
import { b as breadcrumbJsonLd, $ as $$Breadcrumbs } from '../../chunks/breadcrumbs_SFsIZKDM.mjs';
import { r as readingMinutesForArticle, $ as $$ArticleCard } from '../../chunks/ArticleCard_BfOHqZjy.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

const seriesData = {
  "the-ai-and-intuition-series": {
    title: "The AI and Intuition Series",
    description: "Seven essays on what large language models can and cannot reach in intuitive practice: pre-symbolic perception, tarot as interface, meaning versus attention, augmentation versus replacement, and the practitioner’s edge.",
    totalParts: 7,
    status: "complete",
    publishedDate: "2026-05-03"
  },
  "the-deck-compass-methodology-series": {
    title: "The Deck Compass Methodology Series",
    description: "A four-part exploration of the cognitive shift in serious tarot practice: from accumulation to precision, from card definitions to contextual meaning, from lists to flow, and from prediction to conditions.",
    totalParts: 4,
    status: "complete",
    publishedDate: "2026-04-06"
  }
};

const $$Astro = createAstro("https://www.tidesofknowing.com");
async function getStaticPaths() {
  const articles = await getCollection("articles");
  const slugs = [
    ...new Set(
      articles.filter((a) => a.data.seriesName).map((a) => slugify(a.data.seriesName))
    )
  ];
  return slugs.map((slug) => ({ params: { slug } }));
}
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  const articles = await getCollection("articles");
  const inSeries = articles.filter(
    (a) => a.data.seriesName && slugify(a.data.seriesName) === slug
  );
  const sorted = sortArticles(inSeries, "series");
  const seriesTitle = sorted[0]?.data.seriesName ?? slug.replace(/-/g, " ");
  const meta = seriesData[slug];
  const description = meta?.description ?? `Articles in the \u201C${seriesTitle}\u201D series from Tides of Knowing.`;
  const base = siteBase(Astro2);
  const siteHref = base.href;
  const canonical = new URL(`/series/${slug}/`, base).href;
  const PAGE_TITLE = `${seriesTitle} | Series | Tides of Knowing`;
  const minutesById = new Map(
    articles.map((a) => [a.id, readingMinutesForArticle(a)])
  );
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: seriesTitle,
    description,
    numberOfItems: sorted.length,
    itemListElement: sorted.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: new URL(`/articles/${a.data.slug}/`, siteHref).href,
      name: a.data.title
    }))
  };
  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Articles", url: "/articles/" },
    { label: "Series", url: "/series/" },
    { label: seriesTitle, url: null }
  ];
  const jsonLd = [itemListLd, breadcrumbJsonLd(crumbs, siteHref)];
  const ogImage = sorted[0] ? new URL(sorted[0].data.heroImage, base).href : new URL("/favicon.svg", base).href;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": PAGE_TITLE, "description": description, "ogUrl": canonical, "ogImage": ogImage, "metaAuthor": "Leigh Spencer", "jsonLd": jsonLd, "data-astro-cid-n7wrilah": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="tok-series-landing page-inner" data-astro-cid-n7wrilah> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, { "items": crumbs, "data-astro-cid-n7wrilah": true })} <header class="tok-series-landing__head" data-reveal data-astro-cid-n7wrilah> <h1 class="tok-series-landing__title" data-astro-cid-n7wrilah>${seriesTitle}</h1> ${meta?.status && renderTemplate`<p class="tok-series-landing__status" data-astro-cid-n7wrilah> ${meta.status === "complete" ? "Complete series" : "Ongoing series"} ${meta.totalParts != null && ` \xB7 ${meta.totalParts} parts`} </p>`} <p class="tok-series-landing__desc" data-astro-cid-n7wrilah>${description}</p> <p class="tok-series-landing__filter" data-astro-cid-n7wrilah> <a${addAttribute(`/articles/filter/${slug}/`, "href")} data-astro-cid-n7wrilah>Paginated library view →</a> </p> </header> ${sorted.length === 0 ? renderTemplate`<p class="tok-series-landing__empty" data-astro-cid-n7wrilah>No articles in this series.</p>` : renderTemplate`<ol class="tok-series-landing__parts" data-reveal data-astro-cid-n7wrilah> ${sorted.map((a, i) => renderTemplate`<li class="tok-series-landing__part" data-astro-cid-n7wrilah> <span class="tok-series-landing__pos" data-astro-cid-n7wrilah>
Part ${a.data.seriesOrder ?? i + 1} </span> ${renderComponent($$result2, "ArticleCard", $$ArticleCard, { "article": a, "readingMinutes": minutesById.get(a.id) ?? 1, "data-astro-cid-n7wrilah": true })} </li>`)} </ol>`} </div> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/series/[slug].astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/series/[slug].astro";
const $$url = "/series/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
