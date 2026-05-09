globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../chunks/BaseLayout_DS19gWn5.mjs';
/* empty css                                    */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Practice = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Practice;
  const tdcUrl = "https://www.thedeckcompass.com/";
  const title = "Practice with The Deck Compass | Tides of Knowing";
  const description = "The Deck Compass is a live practice environment where readers and seekers meet, practise readings, and use guided journaling to reinforce the COMPASS Method\u2122.";
  const ogUrl = new URL("/practice/", siteBase(Astro2)).href;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "ogUrl": ogUrl, "data-astro-cid-cbf7hq7v": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="practice page-inner" data-astro-cid-cbf7hq7v> <header class="practice__hero" data-astro-cid-cbf7hq7v> <h1 class="practice__h1" data-astro-cid-cbf7hq7v>Where symbolic perception becomes practice.</h1> <p class="practice__lede" data-astro-cid-cbf7hq7v>
The Deck Compass is a live practice environment for readers and seekers who want to move beyond memorised meanings and strengthen the habits that make readings hold together.
</p> <p class="practice__cta-row" data-astro-cid-cbf7hq7v> <a class="practice__cta"${addAttribute(tdcUrl, "href")} data-astro-cid-cbf7hq7v>Continue to The Deck Compass</a> </p> <p class="practice__support" data-astro-cid-cbf7hq7v>
A companion practice platform to Tides of Knowing and the COMPASS Method™.
</p> </header> <section class="practice__section" aria-labelledby="practice-why-heading" data-astro-cid-cbf7hq7v> <h2 id="practice-why-heading" class="practice__h2" data-astro-cid-cbf7hq7v>Why Practice Matters</h2> <p class="practice__p" data-astro-cid-cbf7hq7v>
Reading changes when it happens under live conditions. It is one thing to understand a method in theory. It is another to notice what appears, stay with it, and reflect on what happened afterwards.
</p> <p class="practice__pull" data-astro-cid-cbf7hq7v>
Most readers accumulate meanings. Very few develop perception under live conditions.
</p> </section> <section class="practice__section" aria-labelledby="practice-inside-heading" data-astro-cid-cbf7hq7v> <h2 id="practice-inside-heading" class="practice__h2" data-astro-cid-cbf7hq7v>What Happens Inside</h2> <div class="practice__cards" data-astro-cid-cbf7hq7v> <div class="practice__card" data-astro-cid-cbf7hq7v> <h3 class="practice__card-label" data-astro-cid-cbf7hq7v>Meet</h3> <p class="practice__card-text" data-astro-cid-cbf7hq7v>
Readers and seekers connect for practice readings.
</p> </div> <div class="practice__card" data-astro-cid-cbf7hq7v> <h3 class="practice__card-label" data-astro-cid-cbf7hq7v>Read</h3> <p class="practice__card-text" data-astro-cid-cbf7hq7v>
Sessions give the method a live symbolic field.
</p> </div> <div class="practice__card" data-astro-cid-cbf7hq7v> <h3 class="practice__card-label" data-astro-cid-cbf7hq7v>Reflect</h3> <p class="practice__card-text" data-astro-cid-cbf7hq7v>
Guided journaling helps you notice what occurred.
</p> </div> <div class="practice__card" data-astro-cid-cbf7hq7v> <h3 class="practice__card-label" data-astro-cid-cbf7hq7v>Reinforce</h3> <p class="practice__card-text" data-astro-cid-cbf7hq7v>
Repeated practice strengthens the habits behind clearer interpretation.
</p> </div> </div> </section> <section class="practice__section" aria-labelledby="practice-compass-heading" data-astro-cid-cbf7hq7v> <h2 id="practice-compass-heading" class="practice__h2" data-astro-cid-cbf7hq7v>How It Connects to COMPASS</h2> <ul class="practice__method-lines" data-astro-cid-cbf7hq7v> <li class="practice__method-line" data-astro-cid-cbf7hq7v>COMPASS gives the method.</li> <li class="practice__method-line" data-astro-cid-cbf7hq7v>The tools give controlled practice.</li> <li class="practice__method-line" data-astro-cid-cbf7hq7v>
The Deck Compass gives repetition, reflection, and live conditions.
</li> </ul> <p class="tok-ip-attribution" data-astro-cid-cbf7hq7v>
The COMPASS Method™ is an original interpretive framework created by Tides of Knowing.
</p> </section> <section class="practice__section" aria-labelledby="practice-for-heading" data-astro-cid-cbf7hq7v> <h2 id="practice-for-heading" class="practice__h2" data-astro-cid-cbf7hq7v>Who It Is For</h2> <div class="practice__audience" data-astro-cid-cbf7hq7v> <div class="practice__audience-col" data-astro-cid-cbf7hq7v> <h3 class="practice__audience-title" data-astro-cid-cbf7hq7v>For readers who:</h3> <ul class="practice__list" data-astro-cid-cbf7hq7v> <li data-astro-cid-cbf7hq7v>know meanings but lose the thread</li> <li data-astro-cid-cbf7hq7v>want to practise without performance pressure</li> <li data-astro-cid-cbf7hq7v>need repetition to develop confidence</li> <li data-astro-cid-cbf7hq7v>want to strengthen perception before explanation</li> <li data-astro-cid-cbf7hq7v>are ready to move from insight into habit</li> </ul> </div> <div class="practice__audience-col" data-astro-cid-cbf7hq7v> <h3 class="practice__audience-title" data-astro-cid-cbf7hq7v>For seekers who:</h3> <ul class="practice__list" data-astro-cid-cbf7hq7v> <li data-astro-cid-cbf7hq7v>want thoughtful readings</li> <li data-astro-cid-cbf7hq7v>are open to reflective dialogue</li> <li data-astro-cid-cbf7hq7v>want to participate in a more conscious reading environment</li> </ul> </div> </div> </section> <section class="practice__section practice__section--final" aria-labelledby="practice-final-heading" data-astro-cid-cbf7hq7v> <h2 id="practice-final-heading" class="practice__visually-hidden" data-astro-cid-cbf7hq7v>Continue to The Deck Compass</h2> <p class="practice__cta-row practice__cta-row--final" data-astro-cid-cbf7hq7v> <a class="practice__cta"${addAttribute(tdcUrl, "href")} data-astro-cid-cbf7hq7v>Continue to The Deck Compass</a> </p> </section> </article> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/practice.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/practice.astro";
const $$url = "/practice";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Practice,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
