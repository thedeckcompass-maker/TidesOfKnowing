globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, m as maybeRenderHead, d as addAttribute, b as renderTemplate, r as renderComponent, s as spreadAttributes } from '../../chunks/astro/server_N5NZJon5.mjs';
import { g as getCollection } from '../../chunks/_astro_content_Bg9Z9cCj.mjs';
import { $ as $$ArticlesLayout } from '../../chunks/ArticlesLayout_CtgKJZaG.mjs';
/* empty css                                             */
export { renderers } from '../../renderers.mjs';

const $$Astro$2 = createAstro("https://www.tidesofknowing.com");
const $$PullQuote = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$PullQuote;
  const { quote, attribution, className } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<figure${addAttribute(["tok-pullquote", className], "class:list")} data-astro-cid-72kxyawv> <blockquote class="tok-pullquote__quote" data-astro-cid-72kxyawv> <p data-astro-cid-72kxyawv>${quote}</p> </blockquote> ${attribution && renderTemplate`<figcaption class="tok-pullquote__attribution" data-astro-cid-72kxyawv>${attribution}</figcaption>`} </figure> `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/typography/PullQuote.astro", void 0);

const $$Astro$1 = createAstro("https://www.tidesofknowing.com");
const $$SevenConditions = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$SevenConditions;
  const { heading, intro, items, closingQuote } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section class="seven-conditions" aria-labelledby="seven-conditions-heading" data-astro-cid-hbmoqjde> <h2 id="seven-conditions-heading" class="seven-conditions__title" data-astro-cid-hbmoqjde>${heading}</h2> <p class="seven-conditions__intro" data-astro-cid-hbmoqjde>${intro}</p> <div class="seven-conditions__list" data-astro-cid-hbmoqjde> ${items.map((item, index) => renderTemplate`<article class="seven-conditions__item"${addAttribute(`condition-${item.key}`, "aria-labelledby")} data-astro-cid-hbmoqjde> <img class="seven-conditions__icon"${addAttribute(item.icon, "src")} alt="" aria-hidden="true" loading="lazy" decoding="async" data-astro-cid-hbmoqjde> <h3${addAttribute(`condition-${item.key}`, "id")} class="seven-conditions__name" data-astro-cid-hbmoqjde> ${item.letter} · ${item.name} </h3> <p class="seven-conditions__tagline" data-astro-cid-hbmoqjde>${item.tagline}</p> <p class="seven-conditions__body" data-astro-cid-hbmoqjde>${item.body}</p> ${index < items.length - 1 && renderTemplate`<hr class="seven-conditions__rule" aria-hidden="true" data-astro-cid-hbmoqjde>`} </article>`)} </div> ${renderComponent($$result, "PullQuote", $$PullQuote, { "quote": closingQuote, "data-astro-cid-hbmoqjde": true })} </section> `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/components/method/SevenConditions.astro", void 0);

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$CompassMethod = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$CompassMethod;
  const articles = await getCollection("articles");
  const article = articles.find((entry) => entry.data.slug === "compass-method");
  if (!article) {
    return Astro2.redirect("/articles/");
  }
  const readingMinutes = article.data.readingTime;
  const conditions = [
    {
      key: "center",
      letter: "C",
      name: "Center",
      tagline: "Presence before perception.",
      body: "Center is the condition of being fully arrived before the reading begins. Without it, attention is still tangled in whatever preceded the moment: the previous client, the unread message, the held opinion. That residue colours everything that follows. Center is what prevents a reading from becoming an extension of the reader's own unsettled state. It is the first condition because nothing downstream of it can stay clean if it is skipped.",
      icon: "/images/compass/icons/center/center-transparent.svg"
    },
    {
      key: "open",
      letter: "O",
      name: "Open",
      tagline: "Receptivity without agenda.",
      body: "Open is the condition of meeting what arrives rather than reaching for what is expected. It is the difference between perception and projection, between letting a card speak and arriving with the meaning already decided. Without Open, the reader will find what they brought with them and call it intuition. This condition prevents the most common form of interpretive drift: confirming a hypothesis instead of perceiving a signal.",
      icon: "/images/compass/icons/open/open-transparent.svg"
    },
    {
      key: "map",
      letter: "M",
      name: "Map",
      tagline: "Observation before interpretation.",
      body: "Map is the condition of seeing what is actually present before assigning meaning to it. Position, orientation, sequence, repetition, absence: these are observable facts of the spread, and they hold information that interpretation will overwrite if it moves too quickly. Map prevents the reader from leaping to story before the structure has been read. It is the discipline that keeps interpretation accountable to what is in front of you.",
      icon: "/images/compass/icons/map/map-transparent.svg"
    },
    {
      key: "perceive",
      letter: "P",
      name: "Perceive",
      tagline: "Signal clarity.",
      body: "Perceive is the condition of distinguishing what is genuinely registering from what is noise, association, or memory. Not every impression that arises during a reading is a perception. Some are echoes of past readings, some are emotional weather, some are the mind filling silence. Perceive prevents these from being mistaken for symbolic information. It is the condition that protects the reading from its own static.",
      icon: "/images/compass/icons/perceive/perceive-transparent.svg"
    },
    {
      key: "align",
      letter: "A",
      name: "Align",
      tagline: "Checking for distortion.",
      body: "Align is the condition of testing perception against the spread before speaking it. It is the moment of asking whether what is forming actually fits what is present, or whether something has bent: by hope, by fear, by the reader's investment in a particular outcome. Align prevents distortion from passing into language unchecked. It is the condition that separates a reading the reader believes from a reading the reader can stand behind.",
      icon: "/images/compass/icons/align/align-transparent.svg"
    },
    {
      key: "sense",
      letter: "S",
      name: "Sense",
      tagline: "Integrating the whole.",
      body: "Sense is the condition of holding the full reading as a single coherent field rather than a sequence of separate cards. Meaning in tarot is rarely located in any one position; it emerges from how the conditions speak to each other across the spread. Sense prevents the fragmented reading, the one where each card was interpreted accurately but the whole never came together. It is the condition that produces coherence instead of inventory.",
      icon: "/images/compass/icons/sense/sense-transparent.svg"
    },
    {
      key: "seal",
      letter: "S",
      name: "Seal",
      tagline: "Containment after speaking.",
      body: "Seal is the condition of closing the reading cleanly so that what was opened does not stay open. Without it, material from the reading continues to move through the reader after the session has ended, affecting attention, energy, and the next reading that follows. Seal prevents that bleed. It is the condition that protects the reader's clarity over time and lets the practice remain sustainable across hundreds of readings, not just one.",
      icon: "/images/compass/icons/seal/seal-transparent.svg"
    }
  ];
  const pathways = [
    {
      href: "/articles/",
      label: "Read the applied essays",
      support: "The editorial and research environment.",
      cta: "Articles \u2192",
      step: "01"
    },
    {
      href: "/tools/",
      label: "Enter controlled practice",
      support: "Tools that train signal tracking in isolation.",
      cta: "Tools \u2192",
      step: "02"
    },
    {
      href: "/practice/",
      label: "Stabilise in live conditions",
      support: "Move from insight into repeatable habit.",
      cta: "Practice \u2192",
      step: "03"
    },
    {
      href: "/compass/",
      label: "Train with the method directly",
      support: "Live methodology teaching with The Deck Compass.",
      cta: "Train with the method \u2192",
      step: "04",
      featured: true
    }
  ];
  return renderTemplate`${renderComponent($$result, "ArticlesLayout", $$ArticlesLayout, { "article": article, "readingMinutes": readingMinutes, "headerTitle": "The COMPASS Method\u2122", "headerSubtitle": "A framework of seven conditions under which symbolic perception stays clear, coherent, and trustworthy.", "hideSystemPathway": true, "authorBioOverride": "By Leigh Spencer. Fourth-generation Matakite. Forty years of tarot practice and thirty years of professional journalism. Two disciplines that converge into The COMPASS Method\u2122.", "hideTopShare": true, "hideMobileShareBar": true, "conversionBlockCopy": {
    kicker: "",
    heading: "Stay close to the work",
    description: "The method develops in public. New essays, working notes, and early access to The Deck Compass go out to the list first.",
    ctaLabel: "Join the list \u2192",
    ctaHref: "/subscribe/"
  }, "data-astro-cid-kzmtndvu": true }, { "append": async ($$result2) => renderTemplate`${maybeRenderHead()}<div class="method-hub-next" data-astro-cid-kzmtndvu> <section class="method-hub-next__inner" aria-labelledby="method-next-heading" data-astro-cid-kzmtndvu> <h2 id="method-next-heading" class="method-hub-next__title" data-astro-cid-kzmtndvu>Working with the method</h2> <ul class="method-hub-next__list" data-astro-cid-kzmtndvu> ${pathways.map((p) => renderTemplate`<li class="method-hub-next__item" data-astro-cid-kzmtndvu> <article${addAttribute(["method-hub-next__card", { "method-hub-next__card--featured": !!p.featured }], "class:list")} data-astro-cid-kzmtndvu> <span class="method-hub-next__step" data-astro-cid-kzmtndvu>${p.step}</span> <h3 class="method-hub-next__label" data-astro-cid-kzmtndvu>${p.label}</h3> <p class="method-hub-next__support" data-astro-cid-kzmtndvu>${p.support}</p> <a class="method-hub-next__cta"${addAttribute(p.href, "href")}${spreadAttributes("featured" in p && p.featured ? { "data-link": "compass" } : {})} data-astro-cid-kzmtndvu> ${p.cta} </a> </article> </li>`)} </ul> </section> </div>`, "prepend": async ($$result2) => renderTemplate`<div class="method-hub" data-astro-cid-kzmtndvu> <section class="method-hub__manifesto" aria-labelledby="method-manifesto-heading" data-astro-cid-kzmtndvu> <h2 id="method-manifesto-heading" class="method-hub__manifesto-title" data-astro-cid-kzmtndvu>
A framework for perception under pressure
</h2> <p class="method-hub__manifesto-lede" data-astro-cid-kzmtndvu>
The COMPASS Method™ treats reading as a perceptual discipline. It is not a memorisation
        system or a procedural script. It is a way of organising attention so meaning can form
        clearly, stay coherent, and be spoken without distortion. The method names the conditions
        under which that becomes possible.
</p> <p class="method-hub__manifesto-note" data-astro-cid-kzmtndvu>
The COMPASS Method™ is an original interpretive framework created by Tides of Knowing.
</p> </section> <section class="method-hub__solve" aria-labelledby="method-solve-heading" data-astro-cid-kzmtndvu> <h2 id="method-solve-heading" class="method-hub__section-title" data-astro-cid-kzmtndvu>
The threshold the method addresses
</h2> <p class="method-hub__section-lede" data-astro-cid-kzmtndvu>
Most experienced readers do not fail from lack of vocabulary. They destabilise when pressure
        rises, when stakes sharpen, or when a reading demands precision faster than attention can
        organise itself.
</p> <ul class="method-hub__solve-list" data-astro-cid-kzmtndvu> <li data-astro-cid-kzmtndvu>Knowing many meanings does not prevent interpretive drift.</li> <li data-astro-cid-kzmtndvu>Signal collapses when attention outruns what is actually present.</li> <li data-astro-cid-kzmtndvu>Clarity fails when pace replaces structure.</li> <li data-astro-cid-kzmtndvu>Confidence breaks when perception is not held long enough to settle.</li> </ul> <p class="method-hub__section-lede" data-astro-cid-kzmtndvu>
COMPASS addresses that exact threshold: the point where information is abundant, but
        perceptual discipline is not yet stable.
</p> </section> ${renderComponent($$result2, "SevenConditions", $$SevenConditions, { "heading": "The Seven Conditions of Attention", "intro": "The method names seven conditions under which symbolic perception stays clear. Each prevents a specific failure mode. Together they form the architecture of a reading.", "items": conditions, "closingQuote": "Held together, these are the conditions under which a reading can be trusted.", "data-astro-cid-kzmtndvu": true })} <section class="method-hub__origin" aria-labelledby="method-origin-heading" data-astro-cid-kzmtndvu> <h2 id="method-origin-heading" class="method-hub__section-title" data-astro-cid-kzmtndvu>Origin and method</h2> <p class="method-hub__section-lede" data-astro-cid-kzmtndvu>
The framework emerged from two long practices held together: 40+ years of tarot work and 30
        years of professional journalism. One trains symbolic perception. The other trains disciplined
        observation and language under pressure.
</p> ${renderComponent($$result2, "PullQuote", $$PullQuote, { "quote": "If it can be seen clearly, it can be said clearly.", "data-astro-cid-kzmtndvu": true })} <p class="method-hub__section-lede" data-astro-cid-kzmtndvu>
COMPASS is where those disciplines converge into a teachable architecture for reading.
</p> </section> <section class="method-hub__ecosystem" aria-labelledby="method-ecosystem-heading" data-astro-cid-kzmtndvu> <h2 id="method-ecosystem-heading" class="method-hub__section-title" data-astro-cid-kzmtndvu>The working ecosystem</h2> <div class="method-hub__ecosystem-grid" data-astro-cid-kzmtndvu> <article class="method-hub__ecosystem-card" data-astro-cid-kzmtndvu> <h3 class="method-hub__ecosystem-title" data-astro-cid-kzmtndvu>The COMPASS Method™</h3> <p class="method-hub__ecosystem-text" data-astro-cid-kzmtndvu>
The framework. Seven conditions of attention that organise interpretation.
</p> </article> <article class="method-hub__ecosystem-card" data-astro-cid-kzmtndvu> <h3 class="method-hub__ecosystem-title" data-astro-cid-kzmtndvu>Tides of Knowing</h3> <p class="method-hub__ecosystem-text" data-astro-cid-kzmtndvu>
The editorial environment. Where the method is developed in public through long-form
            research and applied essays.
</p> </article> <article class="method-hub__ecosystem-card" data-astro-cid-kzmtndvu> <h3 class="method-hub__ecosystem-title" data-astro-cid-kzmtndvu>The Deck Compass</h3> <p class="method-hub__ecosystem-text" data-astro-cid-kzmtndvu>
The training environment. Where the method is applied in live practice with structured
            progression and feedback.
</p> </article> </div> </section> </div>` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/compass-method.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/articles/compass-method.astro";
const $$url = "/articles/compass-method";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$CompassMethod,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
