globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate } from '../../chunks/astro/server_N5NZJon5.mjs';
import { g as getCollection, r as renderEntry } from '../../chunks/_astro_content_Bg9Z9cCj.mjs';
import { $ as $$ArticlesLayout } from '../../chunks/ArticlesLayout_CtgKJZaG.mjs';
import { e as estimateReadingMinutes } from '../../chunks/readingTime_CorU88zo.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const slug = Astro2.params.slug;
  const articles = await getCollection("articles");
  const article = articles.find((entry) => entry.data.slug === slug);
  if (!article) {
    return Astro2.redirect("/articles/");
  }
  const { Content } = await renderEntry(article);
  const body = article.body ?? "";
  const readingMinutes = article.data.readingTime ?? estimateReadingMinutes(body);
  return renderTemplate`${renderComponent($$result, "ArticlesLayout", $$ArticlesLayout, { "article": article, "readingMinutes": readingMinutes }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Content", Content, {})} ` })}`;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/[slug].astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/[slug].astro";
const $$url = "/articles/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
