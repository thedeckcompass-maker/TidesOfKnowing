globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../../chunks/BaseLayout_DS19gWn5.mjs';
/* empty css                                                                    */
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$ThreeCardRelationshipTarotReading = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ThreeCardRelationshipTarotReading;
  const title = "Three Card Tarot Reading for Relationships \u2013 The Table Between Them";
  const description = "A deeper tarot tool for exploring the relational field between three cards. This tool is currently in development.";
  const ogUrl = new URL("/tools/three-card-relationship-tarot-reading/", siteBase(Astro2)).href;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "ogUrl": ogUrl, "data-astro-cid-2gxr6vyp": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="tool-holding page-inner" data-astro-cid-2gxr6vyp> <p class="tool-holding__eyebrow" data-astro-cid-2gxr6vyp>TAROT TOOL IN DEVELOPMENT</p> <h1 class="tool-holding__title" data-astro-cid-2gxr6vyp>The Table Between Them</h1> <h2 class="tool-holding__h2-intent" data-astro-cid-2gxr6vyp>
A three-card relational tarot reading for what is spoken, what remains unspoken, and what is beginning to take shape between two people.
</h2> <p class="tool-holding__intro" data-astro-cid-2gxr6vyp>
Where When Two Cards Meet explores the tension between two forces, The Table Between Them introduces a third presence: the relational field itself.
</p> <p class="tool-holding__body" data-astro-cid-2gxr6vyp>
This reading is designed to examine:<br data-astro-cid-2gxr6vyp>
- what is openly expressed<br data-astro-cid-2gxr6vyp>
- what sits beneath the interaction<br data-astro-cid-2gxr6vyp>
- what the connection is moving toward
</p> <p class="tool-holding__body" data-astro-cid-2gxr6vyp>
The spread is intended for relationships of all kinds, romantic, familial, creative, professional, strained, or unresolved, with a focus on the dynamics emerging between people rather than fixed personality descriptions.
</p> <p class="tool-holding__status" data-astro-cid-2gxr6vyp>The Table Between Them is currently in development.</p> <section class="tool-holding__signup" aria-labelledby="tool-updates-heading" data-astro-cid-2gxr6vyp> <h2 id="tool-updates-heading" class="tool-holding__signup-title" data-astro-cid-2gxr6vyp>
Get notified when this tool is live
</h2> <p class="tool-holding__signup-copy" data-astro-cid-2gxr6vyp>
Join the Tides of Knowing list for new tarot tools, articles, and COMPASS method updates.
</p> <!-- TODO: Connect this signup form to the chosen email/newsletter provider. --> <form class="tool-holding__form" action="/subscribe/" method="get" data-astro-cid-2gxr6vyp> <label class="tool-holding__label" for="holding-email-table" data-astro-cid-2gxr6vyp>Email</label> <input class="tool-holding__input" id="holding-email-table" name="email" type="email" autocomplete="email" placeholder="you@example.com" required data-astro-cid-2gxr6vyp> <button class="tool-holding__button" type="submit" data-astro-cid-2gxr6vyp>Notify Me</button> </form> <p class="tool-holding__privacy" data-astro-cid-2gxr6vyp>No spam. Just new tools, articles, and occasional Tides of Knowing updates.</p> </section> <p class="tool-holding__back-wrap" data-astro-cid-2gxr6vyp> <a class="tool-holding__back" href="/tools/two-card-tarot-reading/" data-astro-cid-2gxr6vyp>Back to When Two Cards Meet</a> </p> </article> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/tools/three-card-relationship-tarot-reading.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/tools/three-card-relationship-tarot-reading.astro";
const $$url = "/tools/three-card-relationship-tarot-reading";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ThreeCardRelationshipTarotReading,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
