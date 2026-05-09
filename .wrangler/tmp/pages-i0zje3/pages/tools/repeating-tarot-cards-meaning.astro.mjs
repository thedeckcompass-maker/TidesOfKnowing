globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../../chunks/BaseLayout_DS19gWn5.mjs';
/* empty css                                                            */
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$RepeatingTarotCardsMeaning = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$RepeatingTarotCardsMeaning;
  const title = "Repeating Tarot Cards Meaning \u2013 Why the Same Card Keeps Appearing";
  const description = "A tarot tool for understanding why the same card keeps appearing across readings. This tool is currently in development.";
  const ogUrl = new URL("/tools/repeating-tarot-cards-meaning/", siteBase(Astro2)).href;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "ogUrl": ogUrl, "data-astro-cid-wtngkys3": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="tool-holding page-inner" data-astro-cid-wtngkys3> <p class="tool-holding__eyebrow" data-astro-cid-wtngkys3>TAROT TOOL IN DEVELOPMENT</p> <h1 class="tool-holding__title" data-astro-cid-wtngkys3>Repeated Card Meaning Tool</h1> <h2 class="tool-holding__h2-intent" data-astro-cid-wtngkys3>
A tarot interpretation tool for exploring recurring cards across readings, relationships, situations, and periods of time.
</h2> <p class="tool-holding__intro" data-astro-cid-wtngkys3>
When the same card continues appearing, the repetition often points toward something unresolved, unintegrated, re-emerging, or still unfolding beneath the surface of events.
</p> <p class="tool-holding__body" data-astro-cid-wtngkys3>
Rather than treating repeated cards as isolated meanings, this tool is being developed to examine:<br data-astro-cid-wtngkys3>
- what pattern may be attempting to stabilise across multiple readings<br data-astro-cid-wtngkys3>
- what dynamic continues returning into awareness<br data-astro-cid-wtngkys3>
- whether the repetition reflects pressure, timing, avoidance, confirmation, transition, or unfinished movement<br data-astro-cid-wtngkys3>
- how the meaning of a recurring card shifts depending on surrounding circumstances and relational context
</p> <p class="tool-holding__body" data-astro-cid-wtngkys3>
The focus is not simply the card itself, but the evolving relationship between the card, the situation, and the reader's changing position within it.
</p> <p class="tool-holding__status" data-astro-cid-wtngkys3>This tool is currently in development.</p> <section class="tool-holding__signup" aria-labelledby="tool-updates-heading" data-astro-cid-wtngkys3> <h2 id="tool-updates-heading" class="tool-holding__signup-title" data-astro-cid-wtngkys3>
Get notified when this tool is live
</h2> <p class="tool-holding__signup-copy" data-astro-cid-wtngkys3>
Join the Tides of Knowing list for new tarot tools, articles, and COMPASS method updates.
</p> <!-- TODO: Connect this signup form to the chosen email/newsletter provider. --> <form class="tool-holding__form" action="/subscribe/" method="get" data-astro-cid-wtngkys3> <label class="tool-holding__label" for="holding-email-repeated" data-astro-cid-wtngkys3>Email</label> <input class="tool-holding__input" id="holding-email-repeated" name="email" type="email" autocomplete="email" placeholder="you@example.com" required data-astro-cid-wtngkys3> <button class="tool-holding__button" type="submit" data-astro-cid-wtngkys3>Notify Me</button> </form> <p class="tool-holding__privacy" data-astro-cid-wtngkys3>No spam. Just new tools, articles, and occasional Tides of Knowing updates.</p> </section> <p class="tool-holding__back-wrap" data-astro-cid-wtngkys3> <a class="tool-holding__back" href="/tools/two-card-tarot-reading/" data-astro-cid-wtngkys3>Back to When Two Cards Meet</a> </p> </article> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/tools/repeating-tarot-cards-meaning.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/tools/repeating-tarot-cards-meaning.astro";
const $$url = "/tools/repeating-tarot-cards-meaning";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$RepeatingTarotCardsMeaning,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
