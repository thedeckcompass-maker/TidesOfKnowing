globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, m as maybeRenderHead, d as addAttribute, b as renderTemplate } from './astro/server_N5NZJon5.mjs';
/* empty css                          */

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Breadcrumbs = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Breadcrumbs;
  const { items } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<nav class="breadcrumbs" aria-label="Breadcrumb" data-astro-cid-ilhxcym7> <ol class="breadcrumbs__list" data-astro-cid-ilhxcym7> ${items.map((item, i) => renderTemplate`<li class="breadcrumbs__item" data-astro-cid-ilhxcym7> ${item.url ? renderTemplate`<a class="breadcrumbs__link"${addAttribute(item.url, "href")} data-astro-cid-ilhxcym7> ${item.label} </a>` : renderTemplate`<span class="breadcrumbs__current" aria-current="page" data-astro-cid-ilhxcym7> ${item.label} </span>`} ${i < items.length - 1 && renderTemplate`<span class="breadcrumbs__sep" aria-hidden="true" data-astro-cid-ilhxcym7>
/
</span>`} </li>`)} </ol> </nav> `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/Breadcrumbs.astro", void 0);

function breadcrumbJsonLd(items, siteHref) {
  const itemListElement = items.map((item, i) => {
    const position = i + 1;
    if (item.url) {
      const abs = new URL(item.url, siteHref).href;
      return {
        "@type": "ListItem",
        position,
        name: item.label,
        item: abs
      };
    }
    return {
      "@type": "ListItem",
      position,
      name: item.label
    };
  });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement
  };
}

export { $$Breadcrumbs as $, breadcrumbJsonLd as b };
