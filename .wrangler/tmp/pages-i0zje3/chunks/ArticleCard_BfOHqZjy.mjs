globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as estimateReadingMinutes } from './readingTime_CorU88zo.mjs';
import { c as createAstro, a as createComponent, m as maybeRenderHead, d as addAttribute, b as renderTemplate } from './astro/server_N5NZJon5.mjs';
/* empty css                         */

function readingMinutesForArticle(article) {
  const body = article.body ?? "";
  return article.data.readingTime ?? estimateReadingMinutes(body);
}

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$ArticleCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ArticleCard;
  const { article, readingMinutes } = Astro2.props;
  const {
    title,
    slug,
    publishDate,
    excerpt,
    heroImage,
    heroImageAlt,
    seriesName,
    listBadge
  } = article.data;
  const cardBadge = seriesName?.trim() || listBadge?.trim();
  const maxExcerpt = 120;
  const shortExcerpt = excerpt.length > maxExcerpt ? `${excerpt.slice(0, maxExcerpt).trim()}\u2026` : excerpt;
  const displayDate = publishDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return renderTemplate`${maybeRenderHead()}<article class="article-card" data-astro-cid-di2nlc57> <a class="article-card__link"${addAttribute(`/articles/${slug}/`, "href")} data-astro-cid-di2nlc57> <div class="article-card__media" data-astro-cid-di2nlc57> <img${addAttribute(heroImage, "src")}${addAttribute(heroImageAlt, "alt")} class="article-card__img" width="640" height="360" loading="lazy" decoding="async" data-astro-cid-di2nlc57> </div> <div class="article-card__body" data-astro-cid-di2nlc57> ${cardBadge && renderTemplate`<span class="article-card__badge" data-astro-cid-di2nlc57>${cardBadge}</span>`} <h3 class="article-card__title" data-astro-cid-di2nlc57>${title}</h3> <p class="article-card__excerpt" data-astro-cid-di2nlc57>${shortExcerpt}</p> <div class="article-card__meta" data-astro-cid-di2nlc57> <time${addAttribute(publishDate.toISOString(), "datetime")} data-astro-cid-di2nlc57>${displayDate}</time> <span class="article-card__read" data-astro-cid-di2nlc57>${readingMinutes} min read</span> </div> </div> </a> </article> `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/ArticleCard.astro", void 0);

export { $$ArticleCard as $, readingMinutesForArticle as r };
