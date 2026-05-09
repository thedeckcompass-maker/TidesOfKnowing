globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, b as renderTemplate, e as defineScriptVars, d as addAttribute, m as maybeRenderHead, r as renderComponent, F as Fragment, f as renderSlot, s as spreadAttributes } from './astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout, a as $$TdcConversionBlock } from './BaseLayout_DS19gWn5.mjs';
/* empty css                          */
import { g as getCollection } from './_astro_content_YqjCbhqH.mjs';
import { b as breadcrumbJsonLd, $ as $$Breadcrumbs } from './breadcrumbs_SFsIZKDM.mjs';
import { s as slugify } from './slugify_CFEDbR9M.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro$5 = createAstro("https://www.tidesofknowing.com");
const $$ShareButtons = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$ShareButtons;
  const { title, url, placement } = Astro2.props;
  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title);
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`;
  const x = `https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`;
  const rootId = `tok-share-${placement}`;
  return renderTemplate(_a || (_a = __template(["", "<div", "", "", "", '> <p class="tok-share__label"', '>Share</p> <ul class="tok-share__list" role="list"', '> <li> <a class="tok-share__btn tok-share__btn--link"', ' target="_blank" rel="noopener noreferrer" data-share-popup aria-label="Share on Facebook"> <svg class="tok-share__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 22v-8.2h2.7l.4-3.2h-3.1V8.9c0-.9.25-1.5 1.6-1.5h1.7V4.7c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.3H7v3.2h2.4V22h4.1Z"></path></svg> </a> </li> <li> <a class="tok-share__btn tok-share__btn--link"', ' target="_blank" rel="noopener noreferrer" data-share-popup aria-label="Share on LinkedIn"> <svg class="tok-share__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.5 8.8a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4ZM4.7 20.5V9.7h3.6v10.8H4.7Zm6.1 0V14c0-1.4.5-2.4 1.9-2.4 1 0 1.6.7 1.8 1.3.1.2.1.6.1.9v6.7h3.6v-7.5c0-2.9-1.5-4.2-3.6-4.2-1.7 0-2.4 1-2.8 1.6h-.1V9.7h-3.6c.1 3.6 0 10.8 0 10.8Z"></path></svg> </a> </li> <li> <a class="tok-share__btn tok-share__btn--link"', ' target="_blank" rel="noopener noreferrer" data-share-popup aria-label="Share on X"> <svg class="tok-share__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14.5 10.5 20.7 3h-1.5l-5.4 6.3L9.3 3H4l6.5 9.5L4 20.2h1.5l5.7-6.6 4.6 6.6H21l-6.5-9.7Zm-1.9 2.1-.7-1-5.5-7.9h2.4l4.4 6.3.7 1 5.8 8.3h-2.4l-4.7-6.7Z"></path></svg> </a> </li> <li> <button type="button" class="tok-share__btn" data-copy-link aria-label="Copy link to clipboard"> <svg class="tok-share__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M9 9V6.5A2.5 2.5 0 0 1 11.5 4h6A2.5 2.5 0 0 1 20 6.5v6a2.5 2.5 0 0 1-2.5 2.5H15M9 9h6.5A2.5 2.5 0 0 1 18 11.5v6a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 7 17.5v-6A2.5 2.5 0 0 1 9.5 9H9Z"></path></svg> </button> </li> <li class="tok-share__native-wrap"> <button type="button" class="tok-share__btn" data-native-share hidden aria-label="Share using your device"> <svg class="tok-share__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M12 3v10m0 0 3.5-3.5M12 13 8.5 9.5M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"></path></svg> </button> </li> </ul> <p class="tok-share__status" aria-live="polite" aria-atomic="true" data-copy-status></p> </div> <script>(function(){', '\n  (function () {\n    var root = document.getElementById(rootId);\n    if (!root) return;\n    var shareUrl = root.getAttribute("data-share-url") || "";\n    var shareTitle = root.getAttribute("data-share-title") || "";\n\n    root.querySelectorAll("a[data-share-popup]").forEach(function (a) {\n      a.addEventListener("click", function (e) {\n        e.preventDefault();\n        window.open(a.href, "tokShare", "width=600,height=520,noopener,noreferrer");\n      });\n    });\n\n    var copyBtn = root.querySelector("[data-copy-link]");\n    var statusEl = root.querySelector("[data-copy-status]");\n    var copyTimer;\n    if (copyBtn && statusEl) {\n      copyBtn.addEventListener("click", function () {\n        function showCopied() {\n          statusEl.textContent = "Copied";\n          clearTimeout(copyTimer);\n          copyTimer = setTimeout(function () {\n            statusEl.textContent = "";\n          }, 2000);\n        }\n        if (navigator.clipboard && navigator.clipboard.writeText) {\n          navigator.clipboard.writeText(shareUrl).then(showCopied).catch(function () {\n            statusEl.textContent = "";\n          });\n        }\n      });\n    }\n\n    var nativeBtn = root.querySelector("[data-native-share]");\n    if (nativeBtn && typeof navigator !== "undefined" && navigator.share) {\n      nativeBtn.hidden = false;\n      nativeBtn.addEventListener("click", function () {\n        navigator\n          .share({ title: shareTitle, text: shareTitle, url: shareUrl })\n          .catch(function () {});\n      });\n    }\n  })();\n})();<\/script>'])), maybeRenderHead(), addAttribute(["tok-share", `tok-share--${placement}`], "class:list"), addAttribute(rootId, "id"), addAttribute(url, "data-share-url"), addAttribute(title, "data-share-title"), addAttribute(`${rootId}-label`, "id"), addAttribute(`${rootId}-label`, "aria-labelledby"), addAttribute(fb, "href"), addAttribute(li, "href"), addAttribute(x, "href"), defineScriptVars({ rootId }));
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/share/ShareButtons.astro", void 0);

const $$Astro$4 = createAstro("https://www.tidesofknowing.com");
const $$ArticleHeader = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$ArticleHeader;
  const {
    title,
    shareTitle,
    subtitle,
    publishDate,
    readingTime,
    heroImage,
    heroImageAlt,
    heroImageFit = "cover",
    author = "Leigh Spencer",
    shareUrl,
    hideTopShare = false
  } = Astro2.props;
  const resolvedShareTitle = shareTitle ?? title;
  const displayDate = publishDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const iso = publishDate.toISOString();
  return renderTemplate`${maybeRenderHead()}<header class="tok-article-header" data-astro-cid-e5itrpi2> ${heroImage && renderTemplate`<img${addAttribute(heroImage, "src")}${addAttribute(heroImageAlt, "alt")}${addAttribute([
    "tok-article-header__hero",
    { "tok-article-header__hero--contain": heroImageFit === "contain" }
  ], "class:list")} width="1200" height="630" loading="eager" decoding="async" data-astro-cid-e5itrpi2>`} <div class="tok-article-header__inner" data-astro-cid-e5itrpi2> <h1 class="tok-article-header__title" data-astro-cid-e5itrpi2>${title}</h1> ${subtitle && renderTemplate`<p class="tok-article-header__subtitle" data-astro-cid-e5itrpi2>${subtitle}</p>`} <div class="tok-article-header__meta" data-astro-cid-e5itrpi2> <time${addAttribute(iso, "datetime")} data-astro-cid-e5itrpi2>${displayDate}</time> ${readingTime != null && renderTemplate`<span class="tok-article-header__read" data-astro-cid-e5itrpi2>
· ${readingTime} min read
</span>`} </div> <p class="tok-article-header__byline" data-astro-cid-e5itrpi2> <a class="tok-article-header__byline-link" href="/about" data-astro-cid-e5itrpi2>${author}</a> </p> ${!hideTopShare && renderTemplate`${renderComponent($$result, "ShareButtons", $$ShareButtons, { "title": resolvedShareTitle, "url": shareUrl, "placement": "top", "data-astro-cid-e5itrpi2": true })}`} </div> </header> `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/ArticleHeader.astro", void 0);

const $$Astro$3 = createAstro("https://www.tidesofknowing.com");
const $$ShareSidebar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$ShareSidebar;
  const { title, url } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<aside class="tok-share-sidebar" aria-label="Share this article"> ${renderComponent($$result, "ShareButtons", $$ShareButtons, { "title": title, "url": url, "placement": "sidebar" })} </aside>`;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/share/ShareSidebar.astro", void 0);

const $$Astro$2 = createAstro("https://www.tidesofknowing.com");
const $$ArticleAudio = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$ArticleAudio;
  const {
    idPrefix,
    src,
    duration,
    transcript,
    title = "Listen to this article.",
    byline = "Read by author."
  } = Astro2.props;
  const safeId = idPrefix.replace(/[^a-zA-Z0-9_-]/g, "-");
  const labelId1 = `article-audio-title-${safeId}`;
  const labelId2 = `article-audio-byline-${safeId}`;
  return renderTemplate`${maybeRenderHead()}<section class="article-audio"${addAttribute(`${labelId1} ${labelId2}`, "aria-labelledby")} data-astro-cid-4uxuncm5> <div class="article-audio__panel" data-astro-cid-4uxuncm5> <p${addAttribute(labelId1, "id")} class="article-audio__lead" data-astro-cid-4uxuncm5>${title}</p> <p${addAttribute(labelId2, "id")} class="article-audio__credit" data-astro-cid-4uxuncm5>${byline}</p> ${duration && duration.trim() !== "" && renderTemplate`<p class="article-audio__duration" data-astro-cid-4uxuncm5>${duration}</p>`} <audio controls preload="metadata" class="article-audio__element" data-astro-cid-4uxuncm5> <source${addAttribute(src, "src")} type="audio/mpeg" data-astro-cid-4uxuncm5>
Your browser does not support the audio element.
</audio> ${transcript && transcript.trim() !== "" && renderTemplate`<p class="article-audio__transcript" data-astro-cid-4uxuncm5> <a${addAttribute(transcript, "href")} class="article-audio__transcript-link" data-astro-cid-4uxuncm5>Read transcript</a> </p>`} </div> </section> `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/ArticleAudio.astro", void 0);

const $$Astro$1 = createAstro("https://www.tidesofknowing.com");
const $$ArticleSeries = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$ArticleSeries;
  const {
    seriesName,
    seriesOrder,
    seriesTotal,
    previousArticle,
    nextArticle,
    currentSlug
  } = Astro2.props;
  const all = await getCollection("articles");
  const seriesArticles = all.filter((a) => a.data.seriesName === seriesName).sort((a, b) => {
    const ao = a.data.seriesOrder ?? 9999;
    const bo = b.data.seriesOrder ?? 9999;
    if (ao !== bo) return ao - bo;
    return a.data.title.localeCompare(b.data.title);
  });
  return renderTemplate`${maybeRenderHead()}<nav class="tok-series" aria-label="Article series navigation" data-astro-cid-hekez3kr> <div class="tok-series__header" data-astro-cid-hekez3kr> <h2 class="tok-series__name" data-astro-cid-hekez3kr>${seriesName}</h2> ${seriesOrder != null && seriesTotal != null && renderTemplate`<p class="tok-series__progress" data-astro-cid-hekez3kr>
Part ${seriesOrder} of ${seriesTotal} </p>`} </div> <div class="tok-series__nav" data-astro-cid-hekez3kr> ${previousArticle ? renderTemplate`<a${addAttribute(`/articles/${previousArticle}/`, "href")} class="tok-series__link tok-series__link--prev" data-astro-cid-hekez3kr>
← Previous article
</a>` : renderTemplate`<span class="tok-series__placeholder" aria-hidden="true" data-astro-cid-hekez3kr></span>`} ${nextArticle ? renderTemplate`<a${addAttribute(`/articles/${nextArticle}/`, "href")} class="tok-series__link tok-series__link--next" data-astro-cid-hekez3kr>
Next article →
</a>` : renderTemplate`<span class="tok-series__placeholder" aria-hidden="true" data-astro-cid-hekez3kr></span>`} </div> ${seriesArticles.length > 0 && renderTemplate`<div class="tok-series__list-wrap" data-astro-cid-hekez3kr> <p class="tok-series__list-label" data-astro-cid-hekez3kr> <strong data-astro-cid-hekez3kr>Complete series</strong> </p> <ol class="tok-series__list" data-astro-cid-hekez3kr> ${seriesArticles.map((a) => {
    const slug = a.data.slug;
    const isCurrent = slug === currentSlug;
    return renderTemplate`<li${addAttribute([
      "tok-series__item",
      { "tok-series__item--current": isCurrent }
    ], "class:list")} data-astro-cid-hekez3kr> ${isCurrent ? renderTemplate`<span class="tok-series__current" aria-current="page" data-astro-cid-hekez3kr> ${a.data.title} <span class="tok-series__here" data-astro-cid-hekez3kr> ${" "}
← You are here
</span> </span>` : renderTemplate`<a${addAttribute(`/articles/${slug}/`, "href")} data-astro-cid-hekez3kr>${a.data.title}</a>`} </li>`;
  })} </ol> </div>`} </nav> `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/ArticleSeries.astro", void 0);

const ARTICLE_AUDIO_SLUGS = [];

function isSafeArticleSlug(slug) {
  if (!slug || slug.trim() === "") return false;
  if (slug.includes("..") || slug.includes("/") || slug.includes("\\")) return false;
  return true;
}
function trimOpt(s) {
  const t = s?.trim();
  if (t == null || t === "") return void 0;
  return t;
}
function hasDefaultAudioInManifest(slug) {
  return isSafeArticleSlug(slug) && ARTICLE_AUDIO_SLUGS.includes(slug);
}
function getArticleAudio({
  slug,
  frontmatterAudio
}) {
  const fmSrc = trimOpt(frontmatterAudio?.src);
  if (fmSrc) {
    return {
      src: fmSrc,
      duration: trimOpt(frontmatterAudio?.duration),
      transcript: trimOpt(frontmatterAudio?.transcript)
    };
  }
  if (!hasDefaultAudioInManifest(slug)) {
    return null;
  }
  return {
    src: `/audio/articles/${slug}/article.mp3`,
    duration: trimOpt(frontmatterAudio?.duration),
    transcript: trimOpt(frontmatterAudio?.transcript)
  };
}

const articleAuthorAttribution = "Fourth-generation Matakite, tarot practitioner of 40+ years, professional journalist of 30 years, and founder of The COMPASS Method™.";

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$ArticlesLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ArticlesLayout;
  const {
    article,
    readingMinutes,
    headerTitle,
    headerSubtitle,
    hideSystemPathway = false,
    authorBioOverride,
    hideTopShare = false,
    hideMobileShareBar = false,
    conversionBlockCopy
  } = Astro2.props;
  const d = article.data;
  const resolvedHeaderTitle = headerTitle ?? d.title;
  const resolvedHeaderSubtitle = headerSubtitle !== void 0 ? headerSubtitle : d.subtitle;
  const base = siteBase(Astro2);
  const canonicalPath = `/articles/${d.slug}/`;
  const ogUrl = new URL(canonicalPath, base).href;
  const heroAbsolute = new URL(d.heroImage, base).href;
  const pageTitle = `${d.title} | Tides of Knowing`;
  const publishedISO = d.publishDate.toISOString();
  const modifiedISO = d.updatedDate?.toISOString();
  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Articles", url: "/articles/" }
  ];
  if (d.seriesName) {
    crumbs.push({
      label: d.seriesName,
      url: `/series/${slugify(d.seriesName)}/`
    });
  }
  crumbs.push({ label: d.title, url: null });
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: d.title,
    description: d.excerpt,
    image: heroAbsolute,
    datePublished: publishedISO,
    dateModified: modifiedISO ?? publishedISO,
    author: {
      "@type": "Person",
      name: d.author,
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
    keywords: d.tags.join(", ")
  };
  const jsonLdCombined = [
    articleLd,
    breadcrumbJsonLd(crumbs, base.href)
  ];
  const canonicalUrl = ogUrl;
  const articleAudio = getArticleAudio({
    slug: d.slug,
    frontmatterAudio: d.audio
  });
  const isLeighSpencer = d.author.trim() === "Leigh Spencer";
  const pathwayLinks = [
    { href: "/articles/compass-method/", label: "Understand the framework" },
    { href: "/tools/", label: "Practise the relationship" },
    { href: "/practice/", label: "Build the habit" },
    { href: "/compass/", label: "Train with COMPASS", dataCompass: true }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": pageTitle, "description": d.excerpt, "ogUrl": ogUrl, "ogType": "article", "articlePublishedTime": publishedISO, "articleModifiedTime": modifiedISO, "ogImage": heroAbsolute, "articleTags": d.tags, "metaAuthor": d.author, "tdcPlacement": "none", "jsonLd": jsonLdCombined, "data-astro-cid-dbzamkmt": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="article-shell page-inner tok-article-share-shell" data-astro-cid-dbzamkmt> <div class="tok-articles-breadcrumbs" data-astro-cid-dbzamkmt> ${renderComponent($$result2, "Breadcrumbs", $$Breadcrumbs, { "items": crumbs, "data-astro-cid-dbzamkmt": true })} </div> <div class="tok-articles-share-layout" data-astro-cid-dbzamkmt> ${renderComponent($$result2, "ShareSidebar", $$ShareSidebar, { "title": d.title, "url": canonicalUrl, "data-astro-cid-dbzamkmt": true })} <div class="article-main tok-articles-main surface-reading" data-astro-cid-dbzamkmt> ${renderComponent($$result2, "ArticleHeader", $$ArticleHeader, { "title": resolvedHeaderTitle, "shareTitle": d.title, "subtitle": resolvedHeaderSubtitle, "publishDate": d.publishDate, "readingTime": readingMinutes, "heroImage": d.heroImage, "heroImageAlt": d.heroImageAlt, "heroImageFit": d.heroImageFit, "author": d.author, "shareUrl": canonicalUrl, "hideTopShare": hideTopShare, "data-astro-cid-dbzamkmt": true })} <article class="article tok-articles-article" data-astro-cid-dbzamkmt> ${articleAudio ? renderTemplate`<div class="tok-articles-audio-wrap" data-astro-cid-dbzamkmt> ${renderComponent($$result2, "ArticleAudio", $$ArticleAudio, { "idPrefix": d.slug, "src": articleAudio.src, "duration": articleAudio.duration, "transcript": articleAudio.transcript, "data-astro-cid-dbzamkmt": true })} </div>` : null} <p class="tok-article-trust" data-reveal data-astro-cid-dbzamkmt> ${authorBioOverride ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-dbzamkmt": true }, { "default": ($$result3) => renderTemplate`${authorBioOverride}` })}` : isLeighSpencer ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-dbzamkmt": true }, { "default": ($$result3) => renderTemplate`
By Leigh Spencer · ${articleAuthorAttribution}` })}` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-dbzamkmt": true }, { "default": ($$result3) => renderTemplate`By ${d.author}.` })}`} </p> <div class="article-prose article__body tok-articles-body" data-astro-cid-dbzamkmt> ${renderSlot($$result2, $$slots["prepend"])} ${renderSlot($$result2, $$slots["default"])} </div> ${renderSlot($$result2, $$slots["append"])} ${!hideSystemPathway && renderTemplate`<section class="tok-article-pathway" aria-labelledby="article-pathway-heading" data-reveal data-astro-cid-dbzamkmt> <h2 id="article-pathway-heading" class="tok-article-pathway__title" data-astro-cid-dbzamkmt>
Continue through the system
</h2> <ul class="tok-article-pathway__list" role="list" data-astro-cid-dbzamkmt> ${pathwayLinks.map((item) => renderTemplate`<li class="tok-article-pathway__item" data-astro-cid-dbzamkmt> <a class="tok-article-pathway__link"${addAttribute(item.href, "href")}${spreadAttributes(item.dataCompass ? { "data-link": "compass" } : {})} data-astro-cid-dbzamkmt> ${item.label} </a> </li>`)} </ul> </section>`} ${renderComponent($$result2, "ShareButtons", $$ShareButtons, { "title": d.title, "url": canonicalUrl, "placement": "bottom", "data-astro-cid-dbzamkmt": true })} </article> ${d.seriesName && renderTemplate`${renderComponent($$result2, "ArticleSeries", $$ArticleSeries, { "seriesName": d.seriesName, "seriesOrder": d.seriesOrder, "seriesTotal": d.seriesTotal, "previousArticle": d.previousArticle ?? void 0, "nextArticle": d.nextArticle ?? void 0, "currentSlug": d.slug, "data-astro-cid-dbzamkmt": true })}`} <div data-reveal data-astro-cid-dbzamkmt> ${renderComponent($$result2, "TdcConversionBlock", $$TdcConversionBlock, { "kicker": conversionBlockCopy?.kicker, "heading": conversionBlockCopy?.heading, "description": conversionBlockCopy?.description, "ctaLabel": conversionBlockCopy?.ctaLabel, "ctaHref": conversionBlockCopy?.ctaHref, "data-astro-cid-dbzamkmt": true })} </div> </div> </div> ${!hideMobileShareBar && renderTemplate`<div class="tok-share-mobile-bar" aria-label="Share this article" data-astro-cid-dbzamkmt> ${renderComponent($$result2, "ShareButtons", $$ShareButtons, { "title": d.title, "url": canonicalUrl, "placement": "mobile", "data-astro-cid-dbzamkmt": true })} </div>`} </div> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/layouts/ArticlesLayout.astro", void 0);

export { $$ArticlesLayout as $ };
