globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../chunks/BaseLayout_DS19gWn5.mjs';
/* empty css                                     */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Subscribe = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Subscribe;
  const ogUrl = new URL("/subscribe/", siteBase(Astro2)).href;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Subscribe | Tides of Knowing", "description": "Get new articles and updates from Tides of Knowing. Join the list to stay close to the work.", "ogUrl": ogUrl, "data-astro-cid-ajzedo7x": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="tok-subscribe page-inner" data-astro-cid-ajzedo7x> <header class="tok-subscribe__head" data-astro-cid-ajzedo7x> <h1 class="tok-subscribe__title" data-astro-cid-ajzedo7x>Get new articles and early access</h1> <p class="tok-subscribe__lede" data-astro-cid-ajzedo7x>
This work develops over time.<br data-astro-cid-ajzedo7x>
Join the list to stay close to it.
</p> </header> <div class="tok-subscribe__form-wrap" data-astro-cid-ajzedo7x> <div class="ml-embedded" data-form="6Tmwkx" data-astro-cid-ajzedo7x></div> </div> </article> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/subscribe.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/subscribe.astro";
const $$url = "/subscribe";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Subscribe,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
