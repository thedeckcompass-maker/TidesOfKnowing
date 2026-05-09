globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../chunks/BaseLayout_DS19gWn5.mjs';
import { $ as $$BlogSidebar } from '../chunks/BlogSidebar_2sFemKOS.mjs';
import { b as breadcrumbJsonLd, $ as $$Breadcrumbs } from '../chunks/breadcrumbs_SFsIZKDM.mjs';
import { g as getCollection } from '../chunks/_astro_content_Bg9Z9cCj.mjs';
import { b as blogCategoryIndex, c as blogCategoryLabel, a as blogCategorySlugFromLabel } from '../chunks/blogCategories_B5dplsU9.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
  const categoryRows = blogCategoryIndex(posts);
  const PAGE_TITLE = "Field Notes | Tides of Knowing | Observations & shorter writing";
  const PAGE_DESCRIPTION = "Field Notes: practitioner observations, shorter reflections, and timely writing from Tides of Knowing. For evergreen methodology and series, browse the articles index.";
  const base = siteBase(Astro2);
  const siteHref = base.href;
  const canonical = new URL("/blog/", base).href;
  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Field Notes", url: null }
  ];
  const blogPostSummaries = posts.map((p) => {
    const slug = p.slug ?? p.id;
    return {
      "@type": "BlogPosting",
      headline: p.data.title,
      url: new URL(`/blog/${slug}/`, siteHref).href,
      datePublished: p.data.date.toISOString()
    };
  });
  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Tides of Knowing | Field Notes",
    description: PAGE_DESCRIPTION,
    url: canonical,
    blogPost: blogPostSummaries
  };
  const jsonLd = [blogLd, breadcrumbJsonLd(crumbs, siteHref)];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": PAGE_TITLE, "description": PAGE_DESCRIPTION, "ogUrl": canonical, "ogImage": new URL("/favicon.svg", base).href, "metaAuthor": "Leigh Spencer", "jsonLd": jsonLd, "data-astro-cid-5tznm7mj": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="tok-blog-index page-inner" data-astro-cid-5tznm7mj> <div class="tok-blog-index-breadcrumbs" data-astro-cid-5tznm7mj> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, { "items": crumbs, "data-astro-cid-5tznm7mj": true })} </div> <div class="tok-blog-index-grid" data-astro-cid-5tznm7mj> <div class="tok-blog-index-main" data-astro-cid-5tznm7mj> <header class="tok-blog-index-head" data-reveal data-astro-cid-5tznm7mj> <h1 class="tok-blog-index-title" data-astro-cid-5tznm7mj>Field Notes</h1> <p class="tok-blog-index-lede" data-astro-cid-5tznm7mj>
The living observational layer of this site: practitioner notes, reflections, and
            shorter pieces. Evergreen methodology and teaching articles live in the${" "} <a href="/articles/" data-astro-cid-5tznm7mj>articles</a> index.
</p> </header> ${posts.length === 0 ? renderTemplate`<p class="tok-blog-index-empty" data-reveal data-astro-cid-5tznm7mj>
The first posts are on their way. Browse the${" "} <a href="/articles/" data-astro-cid-5tznm7mj>articles</a> or learn more${" "} <a href="/about/" data-astro-cid-5tznm7mj>about this publication</a>.
</p>` : renderTemplate`<ul class="tok-blog-feed" data-astro-cid-5tznm7mj> ${posts.map((post) => {
    const slug = post.slug ?? post.id;
    const cat = blogCategoryLabel(post);
    const catSlug = blogCategorySlugFromLabel(cat);
    return renderTemplate`<li class="tok-blog-feed__item" data-reveal data-astro-cid-5tznm7mj> <article class="tok-blog-feed__article" data-astro-cid-5tznm7mj> <p class="tok-blog-feed__meta" data-astro-cid-5tznm7mj> <time${addAttribute(post.data.date.toISOString(), "datetime")} data-astro-cid-5tznm7mj> ${post.data.date.toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })} </time> <span class="tok-blog-feed__sep" aria-hidden="true" data-astro-cid-5tznm7mj>
·
</span> <a class="tok-blog-feed__cat"${addAttribute(`/blog/category/${catSlug}/`, "href")} data-astro-cid-5tznm7mj> ${cat} </a> </p> <h2 class="tok-blog-feed__title" data-astro-cid-5tznm7mj> <a${addAttribute(`/blog/${slug}/`, "href")} data-astro-cid-5tznm7mj>${post.data.title}</a> </h2> <p class="tok-blog-feed__excerpt" data-astro-cid-5tznm7mj>${post.data.description}</p> <p class="tok-blog-feed__more-wrap" data-astro-cid-5tznm7mj> <a class="tok-blog-feed__more"${addAttribute(`/blog/${slug}/`, "href")} data-astro-cid-5tznm7mj>
Read more
</a> </p> </article> </li>`;
  })} </ul>`} </div> ${renderComponent($$result2, "BlogSidebar", $$BlogSidebar, { "categories": categoryRows, "data-astro-cid-5tznm7mj": true })} </div> </div> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/blog/index.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/blog/index.astro";
const $$url = "/blog";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
