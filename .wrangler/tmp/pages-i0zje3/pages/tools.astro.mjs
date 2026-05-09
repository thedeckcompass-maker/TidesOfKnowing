globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../chunks/BaseLayout_DS19gWn5.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const title = "Tarot Interpretation Tools | Tides of Knowing";
  const description = "Practise tarot card relationships, spread flow, and repeated pattern recognition with free interpretation tools from Tides of Knowing.";
  const ogUrl = new URL("/tools/", siteBase(Astro2)).href;
  const tableBetweenThemUrl = "/tools/three-card-relationship-tarot-reading/";
  const repeatedCardMeaningUrl = "/tools/repeating-tarot-cards-meaning/";
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "ogUrl": ogUrl, "data-astro-cid-qkptn22r": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="tools-hub page-inner" data-astro-cid-qkptn22r> <div class="tools-hub__frame" data-astro-cid-qkptn22r> <p class="tools-hub__frame-label" data-astro-cid-qkptn22r>The COMPASS Method™ in practice</p> <p class="tools-hub__frame-lede" data-astro-cid-qkptn22r>
These tools are not here to give you more meanings to memorise. They are controlled practice
        spaces for noticing how symbolic information behaves, how patterns form, and where your
        attention begins to stabilise.
</p> </div> <h1 class="tools-hub__title" data-astro-cid-qkptn22r>Tarot Interpretation Tools</h1> <p class="tools-hub__intro" data-astro-cid-qkptn22r>
These tools help tarot readers practise card relationships, spread flow, and repeated pattern recognition, so readings stay relational instead of collapsing into isolated keywords.
</p> <ul class="tools-hub__grid" role="list" data-astro-cid-qkptn22r> <li class="tools-hub__card" data-astro-cid-qkptn22r> <a class="tools-hub__card-link" href="/tools/two-card-tarot-reading/" data-astro-cid-qkptn22r> <span class="tools-hub__card-name" data-astro-cid-qkptn22r>When Two Cards Meet</span> </a> <p class="tools-hub__card-desc" data-astro-cid-qkptn22r>Two-card relational reading: room and entering force.</p> <p class="tools-hub__compass" data-astro-cid-qkptn22r>
This tool trains Map and Sense: noticing the relationship between two cards before forcing
          them into a fixed interpretation.
</p> <p class="tools-hub__status tools-hub__status--live" data-astro-cid-qkptn22r>Available now</p> </li> <li class="tools-hub__card tools-hub__card--soon" data-astro-cid-qkptn22r> <a class="tools-hub__card-link tools-hub__card-link--soon"${addAttribute(tableBetweenThemUrl, "href")} data-astro-cid-qkptn22r> <span class="tools-hub__card-name" data-astro-cid-qkptn22r>The Table Between Them</span> </a> <p class="tools-hub__card-desc" data-astro-cid-qkptn22r>Three-card interpreter: movement, sequence, and story.</p> <p class="tools-hub__status tools-hub__status--next" data-astro-cid-qkptn22r>COMING SOON</p> </li> <li class="tools-hub__card tools-hub__card--soon" data-astro-cid-qkptn22r> <a class="tools-hub__card-link tools-hub__card-link--soon"${addAttribute(repeatedCardMeaningUrl, "href")} data-astro-cid-qkptn22r> <span class="tools-hub__card-name" data-astro-cid-qkptn22r>Repeated Card Meaning Tool</span> </a> <p class="tools-hub__card-desc" data-astro-cid-qkptn22r>
Explore why a card may keep appearing and what repeated patterns may be asking you to notice.
</p> <p class="tools-hub__status tools-hub__status--next" data-astro-cid-qkptn22r>COMING SOON</p> </li> </ul> <section class="tools-hub__prompt" aria-labelledby="tools-prompt-heading" data-astro-cid-qkptn22r> <h2 id="tools-prompt-heading" class="tools-hub__prompt-title" data-astro-cid-qkptn22r>Practice Prompt of the Week</h2> <p class="tools-hub__prompt-lead" data-astro-cid-qkptn22r>
Before you interpret, name the first relationship you notice between the cards.
</p> <p class="tools-hub__prompt-support" data-astro-cid-qkptn22r>
A short weekly exercise for strengthening perception before explanation.
</p> </section> <p class="tools-hub__bridge" data-astro-cid-qkptn22r>
If this helps in isolation, The Deck Compass is where the practice stabilises with other readers
      and seekers.${" "} <a class="tools-hub__bridge-link" href="/practice/" data-astro-cid-qkptn22r>Practice the Method</a> </p> <p class="tools-hub__notify" data-astro-cid-qkptn22r> <a class="tools-hub__notify-link" href="/subscribe/" data-astro-cid-qkptn22r>Get notified when The Table Between Them launches.</a> </p> </article> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/tools/index.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/tools/index.astro";
const $$url = "/tools";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
