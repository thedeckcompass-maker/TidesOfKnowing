globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../../../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../../../chunks/BaseLayout_DS19gWn5.mjs';
import { $ as $$BlogSidebar } from '../../../chunks/BlogSidebar_2sFemKOS.mjs';
import { b as breadcrumbJsonLd, $ as $$Breadcrumbs } from '../../../chunks/breadcrumbs_SFsIZKDM.mjs';
import { g as getCollection } from '../../../chunks/_astro_content_Bg9Z9cCj.mjs';
import { b as blogCategoryIndex, a as blogCategorySlugFromLabel, c as blogCategoryLabel } from '../../../chunks/blogCategories_B5dplsU9.mjs';
/* empty css                                        */
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const paramSlug = Astro2.params.slug;
  if (!paramSlug) {
    return Astro2.redirect("/blog/");
  }
  const allPosts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
  const categoryRows = blogCategoryIndex(allPosts);
  const row = categoryRows.find((r) => r.slug === paramSlug);
  if (!row) {
    return Astro2.redirect("/blog/");
  }
  const slug = paramSlug;
  const categoryLabel = row.label;
  const posts = allPosts.filter(
    (p) => blogCategorySlugFromLabel(blogCategoryLabel(p)) === slug
  );
  const PAGE_TITLE = `${categoryLabel} | Field Notes | Tides of Knowing`;
  const PAGE_DESCRIPTION = `Field Notes in \u201C${categoryLabel}\u201D from Tides of Knowing.`;
  const base = siteBase(Astro2);
  const siteHref = base.href;
  const canonical = new URL(`/blog/category/${slug}/`, base).href;
  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Field Notes", url: "/blog/" },
    { label: categoryLabel, url: null }
  ];
  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: canonical
  };
  const jsonLd = [collectionLd, breadcrumbJsonLd(crumbs, siteHref)];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": PAGE_TITLE, "description": PAGE_DESCRIPTION, "ogUrl": canonical, "ogImage": new URL("/favicon.svg", base).href, "metaAuthor": "Leigh Spencer", "jsonLd": jsonLd, "data-astro-cid-jl2nr6ax": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="tok-blog-index page-inner" data-astro-cid-jl2nr6ax> <div class="tok-blog-index-breadcrumbs" data-astro-cid-jl2nr6ax> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, { "items": crumbs, "data-astro-cid-jl2nr6ax": true })} </div> <div class="tok-blog-index-grid" data-astro-cid-jl2nr6ax> <div class="tok-blog-index-main" data-astro-cid-jl2nr6ax> <header class="tok-blog-index-head" data-reveal data-astro-cid-jl2nr6ax> <h1 class="tok-blog-index-title" data-astro-cid-jl2nr6ax>${categoryLabel}</h1> <p class="tok-blog-index-lede" data-astro-cid-jl2nr6ax>
Field Notes in this category.${" "} <a href="/blog/" data-astro-cid-jl2nr6ax>All Field Notes</a>
·${" "} <a href="/articles/" data-astro-cid-jl2nr6ax>Articles</a> </p> </header> ${posts.length === 0 ? renderTemplate`<p class="tok-blog-index-empty" data-reveal data-astro-cid-jl2nr6ax>
No Field Notes in this category yet.${" "} <a href="/blog/" data-astro-cid-jl2nr6ax>Back to Field Notes</a>.
</p>` : renderTemplate`<ul class="tok-blog-feed" data-astro-cid-jl2nr6ax> ${posts.map((post) => {
    const postSlug = post.slug ?? post.id;
    const cat = blogCategoryLabel(post);
    const catSlug = blogCategorySlugFromLabel(cat);
    return renderTemplate`<li class="tok-blog-feed__item" data-reveal data-astro-cid-jl2nr6ax> <article class="tok-blog-feed__article" data-astro-cid-jl2nr6ax> <p class="tok-blog-feed__meta" data-astro-cid-jl2nr6ax> <time${addAttribute(post.data.date.toISOString(), "datetime")} data-astro-cid-jl2nr6ax> ${post.data.date.toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })} </time> <span class="tok-blog-feed__sep" aria-hidden="true" data-astro-cid-jl2nr6ax>
·
</span> <a class="tok-blog-feed__cat"${addAttribute(`/blog/category/${catSlug}/`, "href")} data-astro-cid-jl2nr6ax> ${cat} </a> </p> <h2 class="tok-blog-feed__title" data-astro-cid-jl2nr6ax> <a${addAttribute(`/blog/${postSlug}/`, "href")} data-astro-cid-jl2nr6ax>${post.data.title}</a> </h2> <p class="tok-blog-feed__excerpt" data-astro-cid-jl2nr6ax>${post.data.description}</p> <p class="tok-blog-feed__more-wrap" data-astro-cid-jl2nr6ax> <a class="tok-blog-feed__more"${addAttribute(`/blog/${postSlug}/`, "href")} data-astro-cid-jl2nr6ax>
Read more
</a> </p> </article> </li>`;
  })} </ul>`} </div> ${renderComponent($$result2, "BlogSidebar", $$BlogSidebar, { "categories": categoryRows, "activeCategorySlug": slug, "data-astro-cid-jl2nr6ax": true })} </div> </div> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/blog/category/[slug].astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/blog/category/[slug].astro";
const $$url = "/blog/category/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
