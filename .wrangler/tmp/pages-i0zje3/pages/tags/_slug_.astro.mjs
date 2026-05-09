globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../../chunks/BaseLayout_DS19gWn5.mjs';
import { g as getCollection } from '../../chunks/_astro_content_Bg9Z9cCj.mjs';
import { s as slugify } from '../../chunks/slugify_CFEDbR9M.mjs';
import { s as sortArticlesLibraryNewest } from '../../chunks/articleLibraryOrder_De62hMdp.mjs';
import { a as articlesWithTagSlug } from '../../chunks/tags_CRQJUJVj.mjs';
import { b as breadcrumbJsonLd, $ as $$Breadcrumbs } from '../../chunks/breadcrumbs_SFsIZKDM.mjs';
import { r as readingMinutesForArticle, $ as $$ArticleCard } from '../../chunks/ArticleCard_BfOHqZjy.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
async function getStaticPaths() {
  const articles = await getCollection("articles");
  const slugs = [
    ...new Set(
      articles.flatMap((a) => a.data.tags.map((t) => slugify(t)))
    )
  ];
  return slugs.map((slug) => ({ params: { slug } }));
}
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug: tagSlug } = Astro2.params;
  const articles = await getCollection("articles");
  const tagged = sortArticlesLibraryNewest(
    articlesWithTagSlug(articles, tagSlug)
  );
  const tagLabel = tagged[0]?.data.tags.find((t) => slugify(t) === tagSlug) ?? tagSlug.replace(/-/g, " ");
  const PAGE_DESCRIPTION = `Articles tagged \u201C${tagLabel}\u201D on Tides of Knowing.`;
  const base = siteBase(Astro2);
  const siteHref = base.href;
  const canonical = new URL(`/tags/${tagSlug}/`, base).href;
  const PAGE_TITLE = `${tagLabel} | Topics | Tides of Knowing`;
  const minutesById = new Map(
    articles.map((a) => [a.id, readingMinutesForArticle(a)])
  );
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${tagLabel}, topics`,
    description: PAGE_DESCRIPTION,
    numberOfItems: tagged.length,
    itemListElement: tagged.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: new URL(`/articles/${a.data.slug}/`, siteHref).href,
      name: a.data.title
    }))
  };
  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Articles", url: "/articles/" },
    { label: "Topics", url: "/tags/" },
    { label: tagLabel, url: null }
  ];
  const jsonLd = [itemListLd, breadcrumbJsonLd(crumbs, siteHref)];
  const ogImage = tagged[0] ? new URL(tagged[0].data.heroImage, base).href : new URL("/favicon.svg", base).href;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": PAGE_TITLE, "description": PAGE_DESCRIPTION, "ogUrl": canonical, "ogImage": ogImage, "metaAuthor": "Leigh Spencer", "jsonLd": jsonLd, "data-astro-cid-ytpo4vtr": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="tok-tag-landing page-inner" data-astro-cid-ytpo4vtr> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, { "items": crumbs, "data-astro-cid-ytpo4vtr": true })} <header class="tok-tag-landing__head" data-reveal data-astro-cid-ytpo4vtr> <h1 class="tok-tag-landing__title" data-astro-cid-ytpo4vtr>${tagLabel}</h1> <p class="tok-tag-landing__lede" data-astro-cid-ytpo4vtr>${PAGE_DESCRIPTION}</p> </header> ${tagged.length === 0 ? renderTemplate`<p class="tok-tag-landing__empty" data-astro-cid-ytpo4vtr>No articles use this topic.</p>` : renderTemplate`<div class="tok-tag-landing__grid" data-reveal data-astro-cid-ytpo4vtr> ${tagged.map((a) => renderTemplate`${renderComponent($$result2, "ArticleCard", $$ArticleCard, { "article": a, "readingMinutes": minutesById.get(a.id) ?? 1, "data-astro-cid-ytpo4vtr": true })}`)} </div>`} </div> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/tags/[slug].astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/tags/[slug].astro";
const $$url = "/tags/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
