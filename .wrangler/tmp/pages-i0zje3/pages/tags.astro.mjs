globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../chunks/BaseLayout_DS19gWn5.mjs';
import { g as getCollection } from '../chunks/_astro_content_Bg9Z9cCj.mjs';
import { t as tagsFromArticles } from '../chunks/tags_CRQJUJVj.mjs';
import { b as breadcrumbJsonLd, $ as $$Breadcrumbs } from '../chunks/breadcrumbs_SFsIZKDM.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const articles = await getCollection("articles");
  const tagRows = tagsFromArticles(articles);
  const PAGE_TITLE = "Topics | Tides of Knowing Articles";
  const PAGE_DESCRIPTION = "Explore articles by topic: tarot methodology, intuition development, and precision reading.";
  const base = siteBase(Astro2);
  const siteHref = base.href;
  const canonical = new URL("/tags/", base).href;
  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Articles", url: "/articles/" },
    { label: "Topics", url: null }
  ];
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: canonical
  };
  const jsonLd = [collectionLd, breadcrumbJsonLd(crumbs, siteHref)];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": PAGE_TITLE, "description": PAGE_DESCRIPTION, "ogUrl": canonical, "ogImage": new URL("/favicon.svg", base).href, "metaAuthor": "Leigh Spencer", "jsonLd": jsonLd, "data-astro-cid-os4i7owy": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="tok-tags-index page-inner" data-astro-cid-os4i7owy> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, { "items": crumbs, "data-astro-cid-os4i7owy": true })} <header class="tok-tags-index__head" data-reveal data-astro-cid-os4i7owy> <h1 class="tok-tags-index__title" data-astro-cid-os4i7owy>Topics</h1> <p class="tok-tags-index__lede" data-astro-cid-os4i7owy>${PAGE_DESCRIPTION}</p> </header> ${tagRows.length === 0 ? renderTemplate`<p class="tok-tags-index__empty" data-reveal data-astro-cid-os4i7owy>
Topics will appear when articles include <code data-astro-cid-os4i7owy>tags</code> in
          frontmatter.
</p>` : renderTemplate`<ul class="tok-tags-index__list" data-astro-cid-os4i7owy> ${tagRows.map((t) => renderTemplate`<li class="tok-tags-index__item" data-reveal data-astro-cid-os4i7owy> <a class="tok-tags-index__link"${addAttribute(`/tags/${t.slug}/`, "href")} data-astro-cid-os4i7owy> <span class="tok-tags-index__label" data-astro-cid-os4i7owy>${t.label}</span> <span class="tok-tags-index__count" data-astro-cid-os4i7owy>${t.count}</span> </a> </li>`)} </ul>`} </div> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/tags/index.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/tags/index.astro";
const $$url = "/tags";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
