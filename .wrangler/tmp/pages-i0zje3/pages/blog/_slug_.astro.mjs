globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute, f as renderSlot } from '../../chunks/astro/server_N5NZJon5.mjs';
import { g as getCollection, r as renderEntry } from '../../chunks/_astro_content_Bg9Z9cCj.mjs';
import { s as siteBase, $ as $$BaseLayout, a as $$TdcConversionBlock } from '../../chunks/BaseLayout_DS19gWn5.mjs';
import { $ as $$BlogSidebar } from '../../chunks/BlogSidebar_2sFemKOS.mjs';
import { b as breadcrumbJsonLd, $ as $$Breadcrumbs } from '../../chunks/breadcrumbs_SFsIZKDM.mjs';
/* empty css                                     */
import { e as estimateReadingMinutes } from '../../chunks/readingTime_CorU88zo.mjs';
import { b as blogCategoryIndex, c as blogCategoryLabel, a as blogCategorySlugFromLabel } from '../../chunks/blogCategories_B5dplsU9.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro$1 = createAstro("https://www.tidesofknowing.com");
const $$BlogPostLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$BlogPostLayout;
  const {
    title,
    description,
    date,
    readingMinutes,
    ogUrl,
    ogImageAbsolute,
    categoryLabel,
    categorySlug,
    articleTags,
    related = [],
    sidebarCategories,
    prevPost,
    nextPost
  } = Astro2.props;
  const pageTitle = `${title} | Field Notes | Tides of Knowing`;
  const isoDate = date.toISOString();
  const displayDate = date.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const base = siteBase(Astro2);
  const siteHref = base.href;
  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Field Notes", url: "/blog/" },
    { label: title, url: null }
  ];
  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: ogImageAbsolute,
    datePublished: isoDate,
    dateModified: isoDate,
    author: {
      "@type": "Person",
      name: "Leigh Spencer",
      url: "https://www.tidesofknowing.com/about/"
    },
    publisher: {
      "@type": "Organization",
      name: "Tides of Knowing",
      url: "https://www.tidesofknowing.com/"
    },
    url: ogUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": ogUrl
    },
    articleSection: categoryLabel,
    keywords: articleTags.join(", ")
  };
  const jsonLd = [blogPostingLd, breadcrumbJsonLd(crumbs, siteHref)];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": pageTitle, "description": description, "ogUrl": ogUrl, "ogType": "article", "articlePublishedTime": isoDate, "ogImage": ogImageAbsolute, "articleTags": articleTags, "metaAuthor": "Leigh Spencer", "tdcPlacement": "none", "jsonLd": jsonLd, "data-astro-cid-2q5oecfc": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="tok-blog-post-shell page-inner" data-astro-cid-2q5oecfc> <div class="tok-blog-post-breadcrumbs" data-astro-cid-2q5oecfc> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, { "items": crumbs, "data-astro-cid-2q5oecfc": true })} </div> <div class="tok-blog-post-grid" data-astro-cid-2q5oecfc> <div class="tok-blog-post-main" data-astro-cid-2q5oecfc> <header class="tok-blog-post-head" data-reveal data-astro-cid-2q5oecfc> <p class="tok-blog-post-kicker" data-astro-cid-2q5oecfc> <a class="tok-blog-post-cat"${addAttribute(`/blog/category/${categorySlug}/`, "href")} data-astro-cid-2q5oecfc> ${categoryLabel} </a> </p> <h1 class="tok-blog-post-title" data-astro-cid-2q5oecfc>${title}</h1> <p class="tok-blog-post-meta" data-astro-cid-2q5oecfc> <time${addAttribute(isoDate, "datetime")} data-astro-cid-2q5oecfc>${displayDate}</time> <span class="tok-blog-post-meta-sep" aria-hidden="true" data-astro-cid-2q5oecfc>·</span> <span data-astro-cid-2q5oecfc>${readingMinutes} min read</span> </p> </header> <article class="tok-blog-article" data-astro-cid-2q5oecfc> <div class="article-prose tok-blog-post-prose" data-astro-cid-2q5oecfc> ${renderSlot($$result2, $$slots["default"])} </div> </article> <nav class="tok-blog-adj" aria-label="Adjacent Field Notes" data-reveal data-astro-cid-2q5oecfc> ${prevPost ? renderTemplate`<a class="tok-blog-adj__link tok-blog-adj__link--prev"${addAttribute(`/blog/${prevPost.slug}/`, "href")} data-astro-cid-2q5oecfc> <span class="tok-blog-adj__label" data-astro-cid-2q5oecfc>Previous Field Note</span> <span class="tok-blog-adj__title" data-astro-cid-2q5oecfc>${prevPost.title}</span> </a>` : renderTemplate`<span class="tok-blog-adj__spacer" data-astro-cid-2q5oecfc></span>`} ${nextPost ? renderTemplate`<a class="tok-blog-adj__link tok-blog-adj__link--next"${addAttribute(`/blog/${nextPost.slug}/`, "href")} data-astro-cid-2q5oecfc> <span class="tok-blog-adj__label" data-astro-cid-2q5oecfc>Next Field Note</span> <span class="tok-blog-adj__title" data-astro-cid-2q5oecfc>${nextPost.title}</span> </a>` : renderTemplate`<span class="tok-blog-adj__spacer" data-astro-cid-2q5oecfc></span>`} </nav> <div data-reveal data-astro-cid-2q5oecfc> ${renderComponent($$result2, "TdcConversionBlock", $$TdcConversionBlock, { "data-astro-cid-2q5oecfc": true })} </div> ${related.length > 0 && renderTemplate`<section class="tok-blog-related" aria-labelledby="blog-related-heading" data-reveal data-astro-cid-2q5oecfc> <h2 id="blog-related-heading" class="tok-blog-related__title" data-astro-cid-2q5oecfc>
Suggested reading
</h2> <ul class="tok-blog-related__list" data-astro-cid-2q5oecfc> ${related.map((item) => renderTemplate`<li data-astro-cid-2q5oecfc> <a class="tok-blog-related__link"${addAttribute(item.href, "href")} data-astro-cid-2q5oecfc> ${item.title} </a> </li>`)} </ul> </section>`} </div> ${renderComponent($$result2, "BlogSidebar", $$BlogSidebar, { "categories": sidebarCategories, "activeCategorySlug": categorySlug, "data-astro-cid-2q5oecfc": true })} </div> </div> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/layouts/BlogPostLayout.astro", void 0);

const relatedReadingBySlug = {
  // "example-slug": [{ title: "Another piece", href: "/blog/other-slug" }],
};
function getRelatedForSlug(slug) {
  return relatedReadingBySlug[slug] ?? [];
}

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const paramSlug = Astro2.params.slug;
  if (!paramSlug) {
    return Astro2.redirect("/blog/");
  }
  const allPosts = await getCollection("blog", ({ data }) => !data.draft);
  const post = allPosts.find((p) => (p.slug ?? p.id) === paramSlug);
  if (!post) {
    return Astro2.redirect("/blog/");
  }
  const slug = post.slug ?? post.id;
  const rendered = await renderEntry(post);
  const { Content } = rendered;
  const body = post.body ?? "";
  const readingMinutes = post.data.readingTime ?? estimateReadingMinutes(body);
  const base = siteBase(Astro2);
  const defaultOg = new URL("/favicon.svg", base).href;
  const heroImage = post.data.heroImage?.trim();
  const ogImageAbsolute = heroImage ? new URL(heroImage, base).href : defaultOg;
  const ogUrl = new URL(`/blog/${slug}/`, base).href;
  const related = getRelatedForSlug(slug);
  const sidebarCategories = blogCategoryIndex(allPosts);
  const categoryLabel = blogCategoryLabel(post);
  const categorySlug = blogCategorySlugFromLabel(categoryLabel);
  const byDateAsc = [...allPosts].sort(
    (a, b) => a.data.date.valueOf() - b.data.date.valueOf()
  );
  const idx = byDateAsc.findIndex((p) => (p.slug ?? p.id) === slug);
  const prevPost = idx > 0 ? {
    slug: byDateAsc[idx - 1].slug ?? byDateAsc[idx - 1].id,
    title: byDateAsc[idx - 1].data.title
  } : null;
  const nextPost = idx >= 0 && idx < byDateAsc.length - 1 ? {
    slug: byDateAsc[idx + 1].slug ?? byDateAsc[idx + 1].id,
    title: byDateAsc[idx + 1].data.title
  } : null;
  return renderTemplate`${renderComponent($$result, "BlogPostLayout", $$BlogPostLayout, { "title": post.data.title, "description": post.data.description, "date": post.data.date, "readingMinutes": readingMinutes, "ogUrl": ogUrl, "ogImageAbsolute": ogImageAbsolute, "categoryLabel": categoryLabel, "categorySlug": categorySlug, "articleTags": post.data.tags, "related": related, "sidebarCategories": sidebarCategories, "prevPost": prevPost, "nextPost": nextPost }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Content", Content, {})} ` })}`;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/blog/[slug].astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/blog/[slug].astro";
const $$url = "/blog/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
