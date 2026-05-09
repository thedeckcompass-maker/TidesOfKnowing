globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, m as maybeRenderHead, b as renderTemplate, d as addAttribute } from './astro/server_N5NZJon5.mjs';
/* empty css                          */

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$BlogSidebar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BlogSidebar;
  const { categories, activeCategorySlug = null } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<aside class="tok-blog-sidebar" aria-label="Field Notes sidebar" data-astro-cid-3tvqi4ux> <section class="tok-blog-sidebar__block" data-reveal data-astro-cid-3tvqi4ux> <h2 class="tok-blog-sidebar__h" data-astro-cid-3tvqi4ux>About the author</h2> <p class="tok-blog-sidebar__p" data-astro-cid-3tvqi4ux> <strong data-astro-cid-3tvqi4ux>Leigh Spencer</strong> writes Tides of Knowing: methodology articles for intuitive
      tarot readers, and Field Notes for timely observations, announcements, and shorter reflections.
<a class="tok-blog-sidebar__inline-link" href="/about/" data-astro-cid-3tvqi4ux>Read more</a> </p> </section> <section class="tok-blog-sidebar__block" data-reveal data-astro-cid-3tvqi4ux> <h2 class="tok-blog-sidebar__h" data-astro-cid-3tvqi4ux>Newsletter</h2> <p class="tok-blog-sidebar__p tok-blog-sidebar__p--tight" data-astro-cid-3tvqi4ux>
New articles and occasional Field Notes, in your inbox.
</p> <div class="tok-blog-sidebar__form ml-embedded" data-form="6Tmwkx" data-astro-cid-3tvqi4ux></div> </section> <section class="tok-blog-sidebar__block" data-reveal data-astro-cid-3tvqi4ux> <h2 class="tok-blog-sidebar__h" data-astro-cid-3tvqi4ux>Categories</h2> ${categories.length === 0 ? renderTemplate`<p class="tok-blog-sidebar__p tok-blog-sidebar__muted" data-astro-cid-3tvqi4ux>Categories will appear as Field Notes are added.</p>` : renderTemplate`<ul class="tok-blog-sidebar__cats" data-astro-cid-3tvqi4ux> ${categories.map((c) => renderTemplate`<li data-astro-cid-3tvqi4ux> <a${addAttribute([
    "tok-blog-sidebar__cat",
    { "is-active": activeCategorySlug === c.slug }
  ], "class:list")}${addAttribute(`/blog/category/${c.slug}/`, "href")} data-astro-cid-3tvqi4ux> <span data-astro-cid-3tvqi4ux>${c.label}</span> <span class="tok-blog-sidebar__count" data-astro-cid-3tvqi4ux>${c.count}</span> </a> </li>`)} </ul>`} <p class="tok-blog-sidebar__p tok-blog-sidebar__muted tok-blog-sidebar__tags-note" data-astro-cid-3tvqi4ux>
Tags on each post add finer topics for search and discovery; methodology series live in the${" "} <a href="/articles/" data-astro-cid-3tvqi4ux>articles</a> index.
</p> </section> </aside> `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/BlogSidebar.astro", void 0);

export { $$BlogSidebar as $ };
