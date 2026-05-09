var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _worker.js/index.js
import { renderers } from "./renderers.mjs";
import { c as createExports, s as serverEntrypointModule } from "./chunks/_@astrojs-ssr-adapter_BE-AnufH.mjs";
import { manifest } from "./manifest_Bx9cXspl.mjs";
globalThis.process ??= {};
globalThis.process.env ??= {};
var serverIslandMap = /* @__PURE__ */ new Map();
var _page0 = /* @__PURE__ */ __name(() => import("./pages/_image.astro.mjs"), "_page0");
var _page1 = /* @__PURE__ */ __name(() => import("./pages/about.astro.mjs"), "_page1");
var _page2 = /* @__PURE__ */ __name(() => import("./pages/api/compass-apply.astro.mjs"), "_page2");
var _page3 = /* @__PURE__ */ __name(() => import("./pages/api/contact.astro.mjs"), "_page3");
var _page4 = /* @__PURE__ */ __name(() => import("./pages/articles/compass-method.astro.mjs"), "_page4");
var _page5 = /* @__PURE__ */ __name(() => import("./pages/articles/filter/_series_/page/_page_.astro.mjs"), "_page5");
var _page6 = /* @__PURE__ */ __name(() => import("./pages/articles/filter/_series_.astro.mjs"), "_page6");
var _page7 = /* @__PURE__ */ __name(() => import("./pages/articles/page/_page_.astro.mjs"), "_page7");
var _page8 = /* @__PURE__ */ __name(() => import("./pages/articles/sort/oldest/page/_page_.astro.mjs"), "_page8");
var _page9 = /* @__PURE__ */ __name(() => import("./pages/articles/sort/oldest.astro.mjs"), "_page9");
var _page10 = /* @__PURE__ */ __name(() => import("./pages/articles/sort/series/page/_page_.astro.mjs"), "_page10");
var _page11 = /* @__PURE__ */ __name(() => import("./pages/articles/sort/series.astro.mjs"), "_page11");
var _page12 = /* @__PURE__ */ __name(() => import("./pages/articles/_slug_.astro.mjs"), "_page12");
var _page13 = /* @__PURE__ */ __name(() => import("./pages/articles.astro.mjs"), "_page13");
var _page14 = /* @__PURE__ */ __name(() => import("./pages/blog/category/_slug_.astro.mjs"), "_page14");
var _page15 = /* @__PURE__ */ __name(() => import("./pages/blog/_slug_.astro.mjs"), "_page15");
var _page16 = /* @__PURE__ */ __name(() => import("./pages/blog.astro.mjs"), "_page16");
var _page17 = /* @__PURE__ */ __name(() => import("./pages/compass/apply.astro.mjs"), "_page17");
var _page18 = /* @__PURE__ */ __name(() => import("./pages/compass.astro.mjs"), "_page18");
var _page19 = /* @__PURE__ */ __name(() => import("./pages/contact.astro.mjs"), "_page19");
var _page20 = /* @__PURE__ */ __name(() => import("./pages/practice.astro.mjs"), "_page20");
var _page21 = /* @__PURE__ */ __name(() => import("./pages/privacy.astro.mjs"), "_page21");
var _page22 = /* @__PURE__ */ __name(() => import("./pages/series/_slug_.astro.mjs"), "_page22");
var _page23 = /* @__PURE__ */ __name(() => import("./pages/series.astro.mjs"), "_page23");
var _page24 = /* @__PURE__ */ __name(() => import("./pages/sitemap.xml.astro.mjs"), "_page24");
var _page25 = /* @__PURE__ */ __name(() => import("./pages/subscribe.astro.mjs"), "_page25");
var _page26 = /* @__PURE__ */ __name(() => import("./pages/tags/_slug_.astro.mjs"), "_page26");
var _page27 = /* @__PURE__ */ __name(() => import("./pages/tags.astro.mjs"), "_page27");
var _page28 = /* @__PURE__ */ __name(() => import("./pages/terms.astro.mjs"), "_page28");
var _page29 = /* @__PURE__ */ __name(() => import("./pages/tools/repeating-tarot-cards-meaning.astro.mjs"), "_page29");
var _page30 = /* @__PURE__ */ __name(() => import("./pages/tools/tarot-combination-interpreter.astro.mjs"), "_page30");
var _page31 = /* @__PURE__ */ __name(() => import("./pages/tools/three-card-relationship-tarot-reading.astro.mjs"), "_page31");
var _page32 = /* @__PURE__ */ __name(() => import("./pages/tools/two-card-tarot-reading.astro.mjs"), "_page32");
var _page33 = /* @__PURE__ */ __name(() => import("./pages/tools.astro.mjs"), "_page33");
var _page34 = /* @__PURE__ */ __name(() => import("./pages/index.astro.mjs"), "_page34");
var pageMap = /* @__PURE__ */ new Map([
  ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
  ["src/pages/about.astro", _page1],
  ["src/pages/api/compass-apply.ts", _page2],
  ["src/pages/api/contact.ts", _page3],
  ["src/pages/articles/compass-method.astro", _page4],
  ["src/pages/articles/filter/[series]/page/[page].astro", _page5],
  ["src/pages/articles/filter/[series]/index.astro", _page6],
  ["src/pages/articles/page/[page].astro", _page7],
  ["src/pages/articles/sort/oldest/page/[page].astro", _page8],
  ["src/pages/articles/sort/oldest/index.astro", _page9],
  ["src/pages/articles/sort/series/page/[page].astro", _page10],
  ["src/pages/articles/sort/series/index.astro", _page11],
  ["src/pages/articles/[slug].astro", _page12],
  ["src/pages/articles/index.astro", _page13],
  ["src/pages/blog/category/[slug].astro", _page14],
  ["src/pages/blog/[slug].astro", _page15],
  ["src/pages/blog/index.astro", _page16],
  ["src/pages/compass/apply.astro", _page17],
  ["src/pages/compass.astro", _page18],
  ["src/pages/contact.astro", _page19],
  ["src/pages/practice.astro", _page20],
  ["src/pages/privacy.astro", _page21],
  ["src/pages/series/[slug].astro", _page22],
  ["src/pages/series/index.astro", _page23],
  ["src/pages/sitemap.xml.ts", _page24],
  ["src/pages/subscribe.astro", _page25],
  ["src/pages/tags/[slug].astro", _page26],
  ["src/pages/tags/index.astro", _page27],
  ["src/pages/terms.astro", _page28],
  ["src/pages/tools/repeating-tarot-cards-meaning.astro", _page29],
  ["src/pages/tools/tarot-combination-interpreter.astro", _page30],
  ["src/pages/tools/three-card-relationship-tarot-reading.astro", _page31],
  ["src/pages/tools/two-card-tarot-reading.astro", _page32],
  ["src/pages/tools/index.astro", _page33],
  ["src/pages/index.astro", _page34]
]);
var _manifest = Object.assign(manifest, {
  pageMap,
  serverIslandMap,
  renderers,
  actions: /* @__PURE__ */ __name(() => import("./noop-entrypoint.mjs"), "actions"),
  middleware: /* @__PURE__ */ __name(() => import("./_astro-internal_middleware.mjs"), "middleware")
});
var _args = void 0;
var _exports = createExports(_manifest);
var __astrojsSsrVirtualEntry = _exports.default;
var _start = "start";
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
  serverEntrypointModule[_start](_manifest, _args);
}
export {
  __astrojsSsrVirtualEntry as default,
  pageMap
};
//# sourceMappingURL=bundledWorker-0.36808527575928274.mjs.map
