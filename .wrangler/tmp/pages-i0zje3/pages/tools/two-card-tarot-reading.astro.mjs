globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, ax as renderScript, b as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../../chunks/BaseLayout_DS19gWn5.mjs';
/* empty css                                                     */
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$TwoCardTarotReading = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$TwoCardTarotReading;
  const tableBetweenThemHref = "/tools/three-card-relationship-tarot-reading/";
  const repeatedCardMeaningHref = "/tools/repeating-tarot-cards-meaning/";
  const title = "Two Card Tarot Reading \u2013 Interpret the Dynamic Between Two People";
  const description = "Relationship dynamics between two tarot cards: room and entering force, using the structured Tides of Knowing this pairing only.";
  const ogUrl = new URL("/tools/two-card-tarot-reading/", siteBase(Astro2)).href;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "ogUrl": ogUrl, "data-astro-cid-zpf6iest": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="tarot-tool page-inner" data-astro-cid-zpf6iest> <h1 class="tarot-tool__title" data-astro-cid-zpf6iest>When Two Cards Meet</h1> <h2 class="tarot-tool__h2-intent" data-astro-cid-zpf6iest>Two Card Tarot Reading for Relationships and Real-Time Dynamics</h2> <p class="tarot-tool__subtitle" data-astro-cid-zpf6iest>Two cards. One relational field.</p> <p class="tarot-tool__intro" data-astro-cid-zpf6iest>
This tool helps you read the dynamic between you and another person, whether that’s a partner, friend, colleague, or family member.
      You are not reading two separate meanings. You are reading the live interaction between them.
</p> <div id="tok2-tool" class="tarot-tool__tool-wrap"${addAttribute(tableBetweenThemHref, "data-table-between-them-href")}${addAttribute(repeatedCardMeaningHref, "data-repeated-card-meaning-href")} data-astro-cid-zpf6iest> <div class="tarot-tool__panel" aria-labelledby="tok2-tool-heading" data-astro-cid-zpf6iest> <h2 class="visually-hidden" id="tok2-tool-heading" data-astro-cid-zpf6iest>Choose two cards</h2> <div id="tok2-selection-panel" class="tarot-tool__selection-panel" data-astro-cid-zpf6iest> <div class="tarot-tool__fields" data-astro-cid-zpf6iest> <div class="tarot-tool__field" data-astro-cid-zpf6iest> <label class="tarot-tool__label" for="tok2-card-1" data-astro-cid-zpf6iest>Card 1</label> <select class="tarot-tool__select" id="tok2-card-1" name="card1" required aria-required="true" data-astro-cid-zpf6iest> <option value="" data-astro-cid-zpf6iest>Select a card</option> </select> <fieldset class="tarot-tool__orient" id="tok2-orient-fieldset-1" data-astro-cid-zpf6iest> <legend class="tarot-tool__orient-legend" data-astro-cid-zpf6iest>Orientation</legend> <div class="tarot-tool__orient-row" data-astro-cid-zpf6iest> <label class="tarot-tool__orient-choice" data-astro-cid-zpf6iest> <input type="radio" name="tok2_orient_1" value="upright" checked data-astro-cid-zpf6iest>
Upright
</label> <label class="tarot-tool__orient-choice" data-astro-cid-zpf6iest> <input type="radio" name="tok2_orient_1" value="reversed" data-astro-cid-zpf6iest>
Reversed
</label> </div> </fieldset> </div> <div class="tarot-tool__field" data-astro-cid-zpf6iest> <label class="tarot-tool__label" for="tok2-card-2" data-astro-cid-zpf6iest>Card 2</label> <select class="tarot-tool__select" id="tok2-card-2" name="card2" required aria-required="true" data-astro-cid-zpf6iest> <option value="" data-astro-cid-zpf6iest>Select a card</option> </select> <fieldset class="tarot-tool__orient" id="tok2-orient-fieldset-2" data-astro-cid-zpf6iest> <legend class="tarot-tool__orient-legend" data-astro-cid-zpf6iest>Orientation</legend> <div class="tarot-tool__orient-row" data-astro-cid-zpf6iest> <label class="tarot-tool__orient-choice" data-astro-cid-zpf6iest> <input type="radio" name="tok2_orient_2" value="upright" checked data-astro-cid-zpf6iest>
Upright
</label> <label class="tarot-tool__orient-choice" data-astro-cid-zpf6iest> <input type="radio" name="tok2_orient_2" value="reversed" data-astro-cid-zpf6iest>
Reversed
</label> </div> </fieldset> </div> </div> <div class="tarot-tool__actions" data-astro-cid-zpf6iest> <div class="tarot-tool__action" data-astro-cid-zpf6iest> <button class="tarot-tool__button" type="button" id="draw-cards-btn" data-astro-cid-zpf6iest>Draw Cards</button> <div class="tarot-tool__helper" data-astro-cid-zpf6iest>Let the cards choose.</div> </div> <div class="tarot-tool__action" data-astro-cid-zpf6iest> <button class="tarot-tool__button" type="button" id="read-pair-btn" data-astro-cid-zpf6iest>Read Your Cards</button> <div class="tarot-tool__helper" data-astro-cid-zpf6iest>Read the cards you selected at home.</div> </div> <div class="tarot-tool__action" data-astro-cid-zpf6iest> <button class="tarot-tool__button" type="button" id="clear-btn" data-astro-cid-zpf6iest>Clear</button> <div class="tarot-tool__helper" data-astro-cid-zpf6iest>Start again.</div> <div id="tok2-clear-status" class="tarot-tool__helper tarot-tool__helper--status" aria-live="polite" data-astro-cid-zpf6iest></div> </div> </div> </div> <div id="tok2-selection-panel-collapsed" class="tarot-tool__selection-panel tarot-tool__selection-panel--collapsed" hidden data-astro-cid-zpf6iest> <p id="tok2-selected-summary" class="tarot-tool__selected-summary" data-astro-cid-zpf6iest></p> <button class="tarot-tool__change-cards" type="button" id="tok2-change-cards" data-astro-cid-zpf6iest>Change cards</button> </div> <div id="output" data-astro-cid-zpf6iest></div> <div class="tarot-tool__output tarot-tool__combo-copy" id="tok2-output" aria-live="polite" data-astro-cid-zpf6iest></div> <div id="tok2-debug-tools" class="tok2-debug-tools" style="display:none;" data-astro-cid-zpf6iest> <button class="tarot-tool__button tok2-debug-copy-btn" type="button" id="tok2-debug-copy-btn" data-astro-cid-zpf6iest>
Copy Result HTML
</button> </div> </div> </div> </article> ` })} ${renderScript($$result, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/tools/two-card-tarot-reading.astro?astro&type=script&index=0&lang.ts")}  `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/tools/two-card-tarot-reading.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/tools/two-card-tarot-reading.astro";
const $$url = "/tools/two-card-tarot-reading";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$TwoCardTarotReading,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
