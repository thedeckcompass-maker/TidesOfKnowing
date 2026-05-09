globalThis.process ??= {}; globalThis.process.env ??= {};
import { s as slugify } from './slugify_CFEDbR9M.mjs';
import { c as createAstro, a as createComponent, b as renderTemplate, d as addAttribute, m as maybeRenderHead } from './astro/server_N5NZJon5.mjs';
/* empty css                         */

function seriesOptionsFromArticles(articles) {
  const map = /* @__PURE__ */ new Map();
  for (const a of articles) {
    const name = a.data.seriesName;
    if (!name) continue;
    const s = slugify(name);
    if (!map.has(s)) map.set(s, name);
  }
  return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([slug, label]) => ({ slug, label }));
}
function groupArticlesBySeries(articles) {
  const groups = /* @__PURE__ */ new Map();
  for (const a of articles) {
    const name = a.data.seriesName;
    if (!name) continue;
    const list = groups.get(name) ?? [];
    list.push(a);
    groups.set(name, list);
  }
  for (const list of groups.values()) {
    list.sort(
      (a, b) => (a.data.seriesOrder ?? 9999) - (b.data.seriesOrder ?? 9999)
    );
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([seriesName, items]) => ({
    seriesName,
    seriesSlug: slugify(seriesName),
    items
  }));
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro$1 = createAstro("https://www.tidesofknowing.com");
const $$LibraryToolbar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$LibraryToolbar;
  const { sort, showFilter, showSort = true, filter, seriesOptions } = Astro2.props;
  const sortChoices = [
    { id: "newest", label: "Newest", href: "/articles/" },
    { id: "oldest", label: "Oldest", href: "/articles/sort/oldest/" },
    { id: "series", label: "By series", href: "/articles/sort/series/" }
  ];
  return renderTemplate(_a || (_a = __template(["", '<div class="lib-toolbar" data-astro-cid-chie2vwm> ', " ", " ", ' </div> <script>\n  (function () {\n    document.querySelectorAll("[data-lib-nav]").forEach(function (el) {\n      el.addEventListener("change", function () {\n        var v = el.value;\n        if (v) window.location.href = v;\n      });\n    });\n  })();\n<\/script> '])), maybeRenderHead(), showSort && renderTemplate`<div class="lib-toolbar__field" data-astro-cid-chie2vwm> <label class="lib-toolbar__label" for="lib-sort" data-astro-cid-chie2vwm>Sort</label> <select id="lib-sort" class="lib-toolbar__select" data-lib-nav="sort" data-astro-cid-chie2vwm> ${sortChoices.map((c) => renderTemplate`<option${addAttribute(c.href, "value")}${addAttribute(c.id === sort, "selected")} data-astro-cid-chie2vwm> ${c.label} </option>`)} </select> </div>`, showFilter && renderTemplate`<div class="lib-toolbar__field" data-astro-cid-chie2vwm> <label class="lib-toolbar__label" for="lib-filter" data-astro-cid-chie2vwm>
Series
</label> <select id="lib-filter" class="lib-toolbar__select" data-lib-nav="filter" data-astro-cid-chie2vwm> <option value="/articles/"${addAttribute(filter === "all", "selected")} data-astro-cid-chie2vwm>
All series
</option> ${seriesOptions.map((s) => renderTemplate`<option${addAttribute(`/articles/filter/${s.slug}/`, "value")}${addAttribute(filter === s.slug, "selected")} data-astro-cid-chie2vwm> ${s.label} </option>`)} </select> </div>`, !showFilter && renderTemplate`<p class="lib-toolbar__hint" data-astro-cid-chie2vwm>
Series filter applies to the default newest-first library view.
</p>`);
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/LibraryToolbar.astro", void 0);

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$LibraryPagination = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$LibraryPagination;
  const { prevHref, nextHref, pages } = Astro2.props;
  return renderTemplate`${pages.length > 1 && renderTemplate`${maybeRenderHead()}<nav class="lib-pager" aria-label="Pagination" data-astro-cid-qomwhjpe>${prevHref ? renderTemplate`<a class="lib-pager__edge"${addAttribute(prevHref, "href")} rel="prev" data-astro-cid-qomwhjpe>
« Previous
</a>` : renderTemplate`<span class="lib-pager__edge lib-pager__edge--disabled" data-astro-cid-qomwhjpe>« Previous</span>`}<ol class="lib-pager__list" data-astro-cid-qomwhjpe>${pages.map((p) => renderTemplate`<li class="lib-pager__item" data-astro-cid-qomwhjpe>${p.current ? renderTemplate`<span class="lib-pager__current" aria-current="page" data-astro-cid-qomwhjpe>${p.num}</span>` : renderTemplate`<a class="lib-pager__link"${addAttribute(p.href, "href")} data-astro-cid-qomwhjpe>${p.num}</a>`}</li>`)}</ol>${nextHref ? renderTemplate`<a class="lib-pager__edge"${addAttribute(nextHref, "href")} rel="next" data-astro-cid-qomwhjpe>
Next »
</a>` : renderTemplate`<span class="lib-pager__edge lib-pager__edge--disabled" data-astro-cid-qomwhjpe>Next »</span>`}</nav>`}`;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/LibraryPagination.astro", void 0);

export { $$LibraryToolbar as $, $$LibraryPagination as a, groupArticlesBySeries as g, seriesOptionsFromArticles as s };
