globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout, a as $$TdcConversionBlock } from '../chunks/BaseLayout_DS19gWn5.mjs';
import { g as getCollection } from '../chunks/_astro_content_Bg9Z9cCj.mjs';
import { s as sortArticlesLibraryNewest } from '../chunks/articleLibraryOrder_De62hMdp.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

function sortBlogPostsForListing(posts) {
  return [...posts].sort((a, b) => {
    const fa = a.data.featured ? 1 : 0;
    const fb = b.data.featured ? 1 : 0;
    if (fa !== fb) return fb - fa;
    return b.data.date.valueOf() - a.data.date.valueOf();
  });
}

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const latest = sortBlogPostsForListing(
    await getCollection("blog", ({ data }) => !data.draft)
  );
  const latestMethodology = sortArticlesLibraryNewest(
    await getCollection("articles")
  ).slice(0, 5);
  const homeUrl = new URL("/", siteBase(Astro2)).href;
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Tides of Knowing",
    url: homeUrl,
    description: "Tides of Knowing is a long-form publication about practical intuition, perception and interpretation through tarot and oracle for personal growth and grounded guidance.",
    publisher: {
      "@type": "Organization",
      name: "Tides of Knowing",
      url: homeUrl
    }
  };
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Tides of Knowing | Practical intuition through tarot and oracle", "description": "Long-form writing on practical intuition, perception and interpretation through tarot and oracle for personal growth, clearer boundaries and grounded guidance.", "ogUrl": homeUrl, "tdcPlacement": "none", "jsonLd": websiteLd, "data-astro-cid-j7pv25f6": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="home-gate surface-system tok-home-hero" aria-labelledby="home-gate-heading" data-astro-cid-j7pv25f6> <div class="page-inner home-gate__inner" data-astro-cid-j7pv25f6> <h1 id="home-gate-heading" class="home-gate__h1" data-reveal data-astro-cid-j7pv25f6>
For readers who know the meanings but still lose the thread.
</h1> <p class="home-gate__support" data-reveal data-astro-cid-j7pv25f6>
Tides of Knowing helps tarot and oracle readers move beyond memorised meanings into clearer
        symbolic perception through the COMPASS Method™, applied tools, guided practice, and training.
</p> <p class="home-gate__trust" data-reveal data-astro-cid-j7pv25f6>
40+ years tarot practice · 30 years as a professional journalist · Fourth-generation Matakite
        · Founder of the COMPASS Method™
</p> </div> </section> <section class="home-pathways surface-reading-soft" aria-labelledby="home-pathways-heading" data-astro-cid-j7pv25f6> <div class="page-inner home-pathways__inner" data-astro-cid-j7pv25f6> <h2 id="home-pathways-heading" class="home-pathways__vh" data-astro-cid-j7pv25f6>Ways into the work</h2> <ul class="home-pathways__list" data-astro-cid-j7pv25f6> <li class="home-pathways__item" data-reveal data-astro-cid-j7pv25f6> <a class="home-pathways__card" href="/articles/compass-method/" data-astro-cid-j7pv25f6> <span class="home-pathways__context" data-astro-cid-j7pv25f6>Your readings feel close, but not quite held</span> <span class="home-pathways__action" data-astro-cid-j7pv25f6>Explore the Method</span> </a> </li> <li class="home-pathways__item" data-reveal data-astro-cid-j7pv25f6> <a class="home-pathways__card" href="/tools/" data-astro-cid-j7pv25f6> <span class="home-pathways__context" data-astro-cid-j7pv25f6>You want to experience the framework directly</span> <span class="home-pathways__action" data-astro-cid-j7pv25f6>Try a Tool</span> </a> </li> <li class="home-pathways__item" data-reveal data-astro-cid-j7pv25f6> <a class="home-pathways__card" href="/practice/" data-astro-cid-j7pv25f6> <span class="home-pathways__context" data-astro-cid-j7pv25f6>You want somewhere to practise with others</span> <span class="home-pathways__action" data-astro-cid-j7pv25f6>Enter the Practice Space</span> </a> </li> <li class="home-pathways__item" data-reveal data-astro-cid-j7pv25f6> <a class="home-pathways__card" href="/compass/" data-link="compass" data-astro-cid-j7pv25f6> <span class="home-pathways__context" data-astro-cid-j7pv25f6>You're ready to build this as a real skill</span> <span class="home-pathways__action" data-astro-cid-j7pv25f6>See the Training</span> </a> </li> </ul> </div> </section> <section class="intro surface-reading" data-astro-cid-j7pv25f6> <div class="page-inner intro__inner" data-astro-cid-j7pv25f6> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
Tides of Knowing is a practical body of work about perception, interpretation, and the
        disciplined use of intuition through the cards.
</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
It is written for tarot and oracle readers who want more than card meanings alone. Some read
        for themselves. Some read for others. Many do both. What matters is the desire to work more
        deeply, more accurately, and with greater trust in what is actually being shown.
</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
This site is not built around collecting endless interpretations.
</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
It is built around learning how to recognise what matters, how to follow what is relevant,
        and how to translate what you perceive into something coherent, grounded, and <a href="/compass/" data-link="compass" data-astro-cid-j7pv25f6>usable</a>.
</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
Because the deeper value of working with cards is not confined to the reading table.
</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
These skills shape how you read people, how you recognise what is and is not yours to carry,
        how you restore boundaries, how you make more meaningful space for yourself, and how you
        navigate life with greater calm, clarity, and self-trust.
</p> <h2 class="latest__title" data-reveal data-astro-cid-j7pv25f6>What you’ll find here</h2> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
Tides of Knowing is structured around long-form article series and standalone essays.
</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
The series are designed to help readers deepen their relationship with the cards, with
        themselves, and with others. They explore the practical foundations of intuitive work: how
        perception functions, what makes a reading hold together, why meaning alone is often not
        enough, and how intuitive skill can be strengthened through attention, structure, and practice.
</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
Alongside these are individual articles written when a particular insight needs to be
        shared. These pieces may respond to something observed in practice, a question that keeps
        arising, or a deeper truth about intuitive work that deserves its own space.
</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
Together, the content is intended to support both personal development and better guidance
        for others.
</p> <h2 class="latest__title" data-reveal data-astro-cid-j7pv25f6>What this work is for</h2> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>The purpose of this site is simple:</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
to help you read, reflect, and deepen your intuition in ways that bring more peace, more
        clarity, and more structure to your life.
</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
For some, that will mean becoming a more grounded and trustworthy reader.
</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
For others, it will mean using the cards as a tool for personal insight, emotional honesty,
        stronger boundaries, and better decision-making.
</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
In both cases, the aim is the same: to make intuitive knowledge more coherent, more
        practical, and more fully lived.
</p> <h2 class="latest__title" data-reveal data-astro-cid-j7pv25f6>About the work</h2> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
I have spent more than thirty years working with language, perception, and interpretation
        as a journalist, reader, and educator.
</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>Tides of Knowing grows out of that intersection.</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
It is the written companion to The Deck Compass and a place for serious, thoughtful
        exploration of what intuition is, how it works, and how it can be developed into a skill that
        serves everyday life.
</p> <p class="intro__text" data-reveal data-astro-cid-j7pv25f6>
You can read more about my background on the${" "} <a href="/about/" data-astro-cid-j7pv25f6>About page</a>.
</p> </div> </section> <section class="home-arch surface-reading-soft" aria-labelledby="home-arch-heading" data-astro-cid-j7pv25f6> <div class="page-inner home-arch__inner" data-astro-cid-j7pv25f6> <h2 id="home-arch-heading" class="home-arch__title" data-reveal data-astro-cid-j7pv25f6>How this work is organised</h2> <ul class="home-arch__list" data-astro-cid-j7pv25f6> <li class="home-arch__item" data-reveal data-astro-cid-j7pv25f6> <a class="home-arch__card" href="/articles/compass-method/" data-astro-cid-j7pv25f6> <span class="home-arch__label" data-astro-cid-j7pv25f6>Method</span> <span class="home-arch__desc" data-astro-cid-j7pv25f6>Understand the framework</span> </a> </li> <li class="home-arch__item" data-reveal data-astro-cid-j7pv25f6> <a class="home-arch__card" href="/tools/" data-astro-cid-j7pv25f6> <span class="home-arch__label" data-astro-cid-j7pv25f6>Tools</span> <span class="home-arch__desc" data-astro-cid-j7pv25f6>Experience it directly</span> </a> </li> <li class="home-arch__item" data-reveal data-astro-cid-j7pv25f6> <a class="home-arch__card" href="/articles/" data-astro-cid-j7pv25f6> <span class="home-arch__label" data-astro-cid-j7pv25f6>Articles</span> <span class="home-arch__desc" data-astro-cid-j7pv25f6>Deepen the thinking</span> </a> </li> <li class="home-arch__item" data-reveal data-astro-cid-j7pv25f6> <a class="home-arch__card" href="/practice/" data-astro-cid-j7pv25f6> <span class="home-arch__label" data-astro-cid-j7pv25f6>Practice</span> <span class="home-arch__desc" data-astro-cid-j7pv25f6>Build the habit through The Deck Compass</span> </a> </li> <li class="home-arch__item" data-reveal data-astro-cid-j7pv25f6> <a class="home-arch__card" href="/compass/" data-link="compass" data-astro-cid-j7pv25f6> <span class="home-arch__label" data-astro-cid-j7pv25f6>Training</span> <span class="home-arch__desc" data-astro-cid-j7pv25f6>Learn the system in a guided cohort</span> </a> </li> </ul> </div> </section> <div class="tok-home-cta-band surface-system" data-reveal data-astro-cid-j7pv25f6> <div class="page-inner tok-home-cta-band__inner" data-astro-cid-j7pv25f6> ${renderComponent($$result2, "TdcConversionBlock", $$TdcConversionBlock, { "data-astro-cid-j7pv25f6": true })} </div> </div> <section class="latest surface-reading-soft" aria-labelledby="field-notes-latest-heading" data-astro-cid-j7pv25f6> <div class="page-inner latest__inner" data-astro-cid-j7pv25f6> <h2 id="field-notes-latest-heading" class="latest__title" data-reveal data-astro-cid-j7pv25f6>
Latest Field Notes
</h2> ${latest.length === 0 ? renderTemplate`<p class="latest__empty" data-reveal data-astro-cid-j7pv25f6>
New entries will appear here as they are published. Browse the${" "} <a href="/blog/" data-astro-cid-j7pv25f6>Field Notes archive</a> ${" "}for shorter pieces. Evergreen methodology and essays live in the${" "} <a href="/articles/" data-astro-cid-j7pv25f6>article library</a>.
</p>` : renderTemplate`<ul class="latest__list" data-astro-cid-j7pv25f6> ${latest.map((post) => renderTemplate`<li class="latest__item" data-reveal data-astro-cid-j7pv25f6> <a class="latest__link"${addAttribute(`/blog/${post.slug ?? post.id}/`, "href")} data-astro-cid-j7pv25f6> <span class="latest__post-title" data-astro-cid-j7pv25f6>${post.data.title}</span> <span class="latest__post-meta" data-astro-cid-j7pv25f6> ${post.data.date.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })} </span> <span class="latest__post-desc" data-astro-cid-j7pv25f6>${post.data.description}</span> </a> </li>`)} </ul>`} </div> </section> <section class="latest methodology surface-reading" aria-labelledby="methodology-heading" data-astro-cid-j7pv25f6> <div class="page-inner latest__inner" data-astro-cid-j7pv25f6> <h2 id="methodology-heading" class="latest__title" data-reveal data-astro-cid-j7pv25f6>
Articles and methodology
</h2> <p class="methodology__intro" data-reveal data-astro-cid-j7pv25f6>
Long-form methodology pieces, series, and topics.${" "} <a class="methodology__hub-link" href="/articles/" data-astro-cid-j7pv25f6>Browse the full article library</a> </p> ${latestMethodology.length === 0 ? renderTemplate`<p class="latest__empty" data-reveal data-astro-cid-j7pv25f6>
Articles will appear here as they are published. Open the${" "} <a href="/articles/" data-astro-cid-j7pv25f6>article library</a> for the full catalog.
</p>` : renderTemplate`<ul class="latest__list" data-astro-cid-j7pv25f6> ${latestMethodology.map((article) => renderTemplate`<li class="latest__item" data-reveal data-astro-cid-j7pv25f6> <a class="latest__link"${addAttribute(`/articles/${article.data.slug}/`, "href")} data-astro-cid-j7pv25f6> <span class="latest__post-title" data-astro-cid-j7pv25f6>${article.data.title}</span> <span class="latest__post-meta" data-astro-cid-j7pv25f6> ${article.data.publishDate.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })} </span> <span class="latest__post-desc" data-astro-cid-j7pv25f6>${article.data.excerpt}</span> </a> </li>`)} </ul>`} </div> </section> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/index.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
