globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, m as maybeRenderHead, d as addAttribute, b as renderTemplate, r as renderComponent, f as renderSlot, an as renderHead, am as unescapeHTML } from './astro/server_N5NZJon5.mjs';
/* empty css                          */

const $$Astro$1 = createAstro("https://www.tidesofknowing.com");
const $$TdcConversionBlock = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$TdcConversionBlock;
  const {
    variant = "default",
    headingId = "tdc-heading",
    kicker = "Stay close to the work",
    heading = "Get new articles and early access",
    description = "This work develops over time. Join the list to stay close to it.",
    ctaLabel = "Join the list \u2192",
    ctaHref = "/subscribe/"
  } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section${addAttribute([
    "tdc",
    { "tdc--subtle": variant === "subtle" },
    { "tdc--inline": variant === "inline" }
  ], "class:list")}${addAttribute(headingId, "aria-labelledby")} data-astro-cid-zqaj4t3i> <div${addAttribute(["tdc__inner", { "page-inner": variant !== "inline" }], "class:list")} data-astro-cid-zqaj4t3i> ${kicker && renderTemplate`<p class="tdc__kicker" data-astro-cid-zqaj4t3i>${kicker}</p>`} ${variant === "inline" ? renderTemplate`<p${addAttribute(headingId, "id")} class="tdc__heading" data-astro-cid-zqaj4t3i>${heading}</p>` : renderTemplate`<h2${addAttribute(headingId, "id")} class="tdc__heading" data-astro-cid-zqaj4t3i>${heading}</h2>`} <p class="tdc__sub" data-astro-cid-zqaj4t3i>${description}</p> <a class="tdc__btn"${addAttribute(ctaHref, "href")} data-astro-cid-zqaj4t3i>${ctaLabel}</a> </div> </section> `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/TdcConversionBlock.astro", void 0);

function siteBase(astro) {
  return astro.site ?? astro.url;
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a, _b;
const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const {
    title,
    description,
    ogUrl,
    ogType = "website",
    articlePublishedTime,
    articleModifiedTime,
    ogImage,
    articleTags,
    metaAuthor,
    sequentialLinks,
    tdcPlacement = "before-footer",
    jsonLd,
    bodyClass: bodyClassProp
  } = Astro2.props;
  const trimmedOg = typeof ogUrl === "string" ? ogUrl.trim() : "";
  const effectiveOgUrl = trimmedOg !== "" ? trimmedOg : Astro2.url.href;
  const base = siteBase(Astro2);
  const canonical = effectiveOgUrl.startsWith("http") ? effectiveOgUrl : new URL(
    effectiveOgUrl.startsWith("/") ? effectiveOgUrl : `/${effectiveOgUrl}`,
    base
  ).href;
  const jsonLdArray = jsonLd ? Array.isArray(jsonLd) ? jsonLd : [jsonLd] : [];
  const structuredScripts = jsonLdArray.map((obj) => JSON.stringify(obj));
  const isToolsSection = /^\/tools(\/|$)/.test(Astro2.url.pathname);
  const pathname = Astro2.url.pathname;
  const isToolsRoute = pathname.startsWith("/tools");
  const isPracticeRoute = pathname.startsWith("/practice");
  const isCompassApplyRoute = pathname.startsWith("/compass/apply");
  const isCompassBlueRoute = pathname.startsWith("/compass") && !isCompassApplyRoute;
  const baseBodySurface = isToolsRoute || isCompassBlueRoute ? "tok-body--system" : "tok-body--reading";
  const bodyClass = [baseBodySurface, bodyClassProp].filter(Boolean).join(" ");
  return renderTemplate(_b || (_b = __template(['<html lang="en" data-astro-cid-37fxchfa> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator"', "><title>", '</title><meta name="description"', ">", '<link rel="canonical"', ">", "", '<meta property="og:title"', '><meta property="og:description"', '><meta property="og:url"', '><meta property="og:type"', ">", "", "", "", "", '<meta name="twitter:card"', '><meta name="twitter:title"', '><meta name="twitter:description"', ">", '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet"><link rel="icon" type="image/svg+xml" href="/favicon.svg">', "", "</head> <body", ' data-astro-cid-37fxchfa> <a class="skip-link" href="#main-content" data-astro-cid-37fxchfa>Skip to content</a> <header class="site-header" data-astro-cid-37fxchfa> <div class="page-inner site-header__inner" data-astro-cid-37fxchfa> <a href="/" class="site-logo site-brand" aria-label="Tides of Knowing home" data-astro-cid-37fxchfa> <img src="/images/brand/tides-of-knowing-mark.svg" alt="" class="site-brand__icon" width="32" height="32" aria-hidden="true" data-astro-cid-37fxchfa> <span class="site-brand__text" data-astro-cid-37fxchfa>Tides of Knowing</span> </a> <button class="site-nav-toggle" type="button" aria-expanded="false" aria-controls="site-primary-nav" data-astro-cid-37fxchfa>\nMenu\n</button> <nav class="site-nav" id="site-primary-nav" aria-label="Primary" data-astro-cid-37fxchfa> <a class="site-nav__link" href="/articles/compass-method/" data-astro-cid-37fxchfa>Method</a> <a class="site-nav__link site-nav__link--tools" href="/tools/"', ' data-astro-cid-37fxchfa>\nTools\n</a> <a class="site-nav__link" href="/articles/" data-astro-cid-37fxchfa>Articles</a> <a class="site-nav__link" href="/practice/"', ' data-astro-cid-37fxchfa>\nPractice\n</a> <a class="site-nav__link" href="/compass/" data-link="compass" data-astro-cid-37fxchfa>Training</a> <a class="site-nav__link" href="/about/" data-astro-cid-37fxchfa>About</a> </nav> </div> </header> <main id="main-content" data-astro-cid-37fxchfa> ', " </main> ", ` <footer class="site-footer" data-astro-cid-37fxchfa> <div class="page-inner site-footer__inner" data-astro-cid-37fxchfa> <div class="site-footer__col" data-astro-cid-37fxchfa> <p class="site-footer__copy site-footer__copy--center" data-astro-cid-37fxchfa>
\xA9 2026 Tides of Knowing \xB7 Leigh Spencer. All rights reserved. Original content.
</p> <nav class="site-footer__discover" aria-label="Sections" data-astro-cid-37fxchfa> <a class="site-footer__discover-link" href="/articles/" data-astro-cid-37fxchfa>Articles</a> <a class="site-footer__discover-link" href="/series/" data-astro-cid-37fxchfa>Series</a> <a class="site-footer__discover-link" href="/tags/" data-astro-cid-37fxchfa>Topics</a> <a class="site-footer__discover-link" href="/blog/" data-astro-cid-37fxchfa>Field Notes</a> <a class="site-footer__discover-link" href="/contact/" data-astro-cid-37fxchfa>Contact</a> <a class="site-footer__discover-link" href="/privacy/" data-astro-cid-37fxchfa>Privacy Policy</a> <a class="site-footer__discover-link" href="/terms/" data-astro-cid-37fxchfa>Terms of Use</a> </nav> </div> <a class="site-footer__email" href="mailto:hello@tidesofknowing.com" data-astro-cid-37fxchfa>hello@tidesofknowing.com</a> </div> <div class="page-inner site-footer__proprietary-wrap" data-astro-cid-37fxchfa> <p class="site-footer__proprietary tok-ip-attribution" data-astro-cid-37fxchfa>
The COMPASS Method\u2122 is an original interpretive framework created by Tides of Knowing.
</p> </div> </footer> <script>
      (function () {
        var toggle = document.querySelector(".site-nav-toggle");
        var nav = document.getElementById("site-primary-nav");
        if (!(toggle instanceof HTMLButtonElement) || !(nav instanceof HTMLElement)) return;

        function closeMenu() {
          nav.classList.remove("site-nav--open");
          toggle.setAttribute("aria-expanded", "false");
        }

        toggle.addEventListener("click", function () {
          var isOpen = nav.classList.toggle("site-nav--open");
          toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        nav.addEventListener("click", function (event) {
          var target = event.target;
          if (target instanceof Element && target.closest("a")) {
            closeMenu();
          }
        });

        document.addEventListener("keydown", function (event) {
          if (event.key === "Escape") closeMenu();
        });

        window.addEventListener("resize", function () {
          if (window.innerWidth > 900) closeMenu();
        });
      })();
    <\/script> <script>
      (function () {
        var nodes = document.querySelectorAll("[data-reveal]");
        if (!nodes.length || !("IntersectionObserver" in window)) {
          nodes.forEach(function (el) {
            el.classList.add("is-visible");
          });
          return;
        }
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                io.unobserve(entry.target);
              }
            });
          },
          { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
        );
        nodes.forEach(function (el) {
          io.observe(el);
        });
      })();
    <\/script> <script>
      (function () {
        document.addEventListener("click", function (event) {
          var target = event.target;
          if (!(target instanceof Element)) return;
          var link = target.closest('[data-link="compass"]');
          if (!link) return;
          console.log("COMPASS link clicked");
        });
      })();
    <\/script> <!-- MailerLite Universal --> <script>
      (function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[])
      .push(arguments);},l=d.createElement(e),l.async=1,l.src=u,
      n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})
      (window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
      ml('account', '2247024');
    <\/script> <!-- End MailerLite Universal --> </body></html>`])), addAttribute(Astro2.generator, "content"), title, addAttribute(description, "content"), metaAuthor && renderTemplate`<meta name="author"${addAttribute(metaAuthor, "content")}>`, addAttribute(canonical, "href"), sequentialLinks?.prev && renderTemplate`<link rel="prev"${addAttribute(sequentialLinks.prev, "href")}>`, sequentialLinks?.next && renderTemplate`<link rel="next"${addAttribute(sequentialLinks.next, "href")}>`, addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(canonical, "content"), addAttribute(ogType, "content"), ogType === "article" && articlePublishedTime && renderTemplate`<meta property="article:published_time"${addAttribute(articlePublishedTime, "content")}>`, ogType === "article" && metaAuthor && renderTemplate`<meta property="article:author"${addAttribute(metaAuthor, "content")}>`, ogType === "article" && articleModifiedTime && renderTemplate`<meta property="article:modified_time"${addAttribute(articleModifiedTime, "content")}>`, ogImage && renderTemplate`<meta property="og:image"${addAttribute(ogImage, "content")}>`, articleTags && articleTags.map((tag) => renderTemplate`<meta property="article:tag"${addAttribute(tag, "content")}>`), addAttribute(ogImage ? "summary_large_image" : "summary", "content"), addAttribute(title, "content"), addAttribute(description, "content"), ogImage && renderTemplate`<meta name="twitter:image"${addAttribute(ogImage, "content")}>`, structuredScripts.map((raw) => renderTemplate(_a || (_a = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(raw))), renderHead(), addAttribute(bodyClass, "class"), addAttribute(isToolsSection ? "page" : void 0, "aria-current"), addAttribute(isPracticeRoute ? "page" : void 0, "aria-current"), renderSlot($$result, $$slots["default"]), tdcPlacement === "before-footer" && renderTemplate`${renderComponent($$result, "TdcConversionBlock", $$TdcConversionBlock, { "data-astro-cid-37fxchfa": true })}`);
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $, $$TdcConversionBlock as a, siteBase as s };
