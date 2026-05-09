globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout, a as $$TdcConversionBlock } from '../chunks/BaseLayout_DS19gWn5.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$About = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$About;
  const ogUrl = new URL("/about/", siteBase(Astro2)).href;
  const profilePath = "/images/about/leigh-spencer-profile.png";
  const ogImage = new URL(profilePath, siteBase(Astro2)).href;
  const aboutPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Tides of Knowing About | Practical intuition, perception and the COMPASS Method\u2122",
    url: ogUrl,
    description: "Tides of Knowing is a practical body of work by Leigh Spencer focused on intuition, perception, interpretation and the COMPASS Method\u2122 for grounded, usable insight."
  };
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Tides of Knowing About | Practical intuition, perception and the COMPASS Method\u2122", "description": "Learn about Leigh Spencer\u2019s approach to practical intuition through tarot, oracle and Lenormand, and the COMPASS Method\u2122 for clearer, grounded interpretation.", "ogUrl": ogUrl, "ogImage": ogImage, "tdcPlacement": "none", "jsonLd": aboutPageLd, "data-astro-cid-kh7btl4r": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="about page-inner" data-astro-cid-kh7btl4r> <header class="about__head" data-reveal data-astro-cid-kh7btl4r> <h1 class="about__title" data-astro-cid-kh7btl4r>About | Tides of Knowing</h1> </header> <figure class="about__figure" data-reveal data-astro-cid-kh7btl4r> <img class="about__photo"${addAttribute(profilePath, "src")} width="640" height="853" alt="Professional portrait of Leigh Spencer, writer and guide, smiling outdoors in a park setting." loading="eager" decoding="async" data-astro-cid-kh7btl4r> </figure> <div class="about__body" data-astro-cid-kh7btl4r> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
Tides of Knowing is a long-form tarot and intuition journal by Leigh Spencer, writer, intuitive guide, and fourth-generation Matakite.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
Matakite is a Māori term for those who carry the gift of sight: the capacity to perceive beyond the visible world. It is not a credential and not something acquired through study. It is inherited, recognised, and carried as responsibility. That lineage informs this work, alongside a second discipline that shapes it equally.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
Leigh brings together 40+ years of tarot practice and 30 years as a professional journalist. The journalist disciplines the intuitive. The intuitive reads what the facts alone cannot reveal. Neither is privileged. Both are in service of the same outcome:
</p> <p class="about__pull" data-reveal data-astro-cid-kh7btl4r>
clarity that is precise and actionable.
</p> <h2 class="about__h2" data-reveal data-astro-cid-kh7btl4r>What This Work Addresses</h2> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
Tides of Knowing exists for a specific experience many people encounter as they deepen their relationship with tarot:
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
You learn the meanings.<br data-astro-cid-kh7btl4r>
You study the systems.<br data-astro-cid-kh7btl4r>
You read more, hoping clarity will follow.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
And yet, when you sit with the cards, for yourself or for someone else, something still doesn't fully hold.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
The message feels close, but not quite clear.<br data-astro-cid-kh7btl4r>
The reading feels partial, or slightly out of tune.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
This is not a lack of effort, and it is not solved by accumulating more meanings.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
It is the point where understanding stops extending capability.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
That is the space this work is designed to meet.
</p> <h2 class="about__h2" data-reveal data-astro-cid-kh7btl4r>The Focus of This Publication</h2> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
Tides of Knowing approaches tarot as a practice of perception and decision-making, rather than an exercise in interpretation alone.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>The writing explores:</p> <ul class="about__list" data-reveal data-astro-cid-kh7btl4r> <li data-astro-cid-kh7btl4r>How intuitive signal is recognised and followed</li> <li data-astro-cid-kh7btl4r>Why more knowledge does not always lead to better readings</li> <li data-astro-cid-kh7btl4r>How to move from description into insight</li> <li data-astro-cid-kh7btl4r>The role of pattern recognition across a spread</li> <li data-astro-cid-kh7btl4r>How to stay with what is true, even when it is subtle</li> <li data-astro-cid-kh7btl4r>The difference between a reading that explains and a reading that lands</li> </ul> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
These are the underlying mechanics of a reading, whether it is for yourself or for others.
</p> <h2 class="about__h2" data-reveal data-astro-cid-kh7btl4r>The Nature of This Work</h2> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
This is not a trend-based site.<br data-astro-cid-kh7btl4r>
It does not offer quick answers to complex questions.<br data-astro-cid-kh7btl4r>
It does not prioritise volume over clarity.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
Tides of Knowing is built as a long-term body of work, writing that returns you to the same place with greater depth each time you engage with it.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
It is for people who sense that something in their practice is trying to refine, not through more information, but through a different way of seeing.
</p> <blockquote class="about__callout" data-reveal data-astro-cid-kh7btl4r> <p data-astro-cid-kh7btl4r>
If it's real, it can be explained.<br data-astro-cid-kh7btl4r>
And if it can be explained, it can be followed.
</p> </blockquote> <h2 class="about__h2" data-reveal data-astro-cid-kh7btl4r>The Deck Compass</h2> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
Tides of Knowing is the editorial foundation for The Deck Compass.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
Where this publication develops understanding, The Deck Compass develops capability.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
It is a structured environment designed for people who want to strengthen how they work with the cards, whether that is for personal reflection or reading for others, through:
</p> <ul class="about__list" data-reveal data-astro-cid-kh7btl4r> <li data-astro-cid-kh7btl4r>Guided practice</li> <li data-astro-cid-kh7btl4r>Real-time refinement</li> <li data-astro-cid-kh7btl4r>Applied learning rather than passive consumption</li> <li data-astro-cid-kh7btl4r>A clear methodology for developing intuitive accuracy</li> </ul> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
If the writing here names something you recognise but cannot yet consistently act on, The Deck Compass is where that capacity is built.
</p> <h2 class="about__h2" data-reveal data-astro-cid-kh7btl4r>The COMPASS Method™</h2> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
At the centre of this work is the COMPASS Method™, a seven-pillar framework developed through decades of reading, observation, and teaching.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
COMPASS defines the conditions that support clear, grounded intuitive work: how you arrive, how the question is held, what is actually present, how meaning settles, and how the reading is completed with integrity.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
These are not abstract ideals. They are practical disciplines of attention.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r> <strong data-astro-cid-kh7btl4r>Read the full framework: <a href="/articles/compass-method/" data-astro-cid-kh7btl4r>The COMPASS Method™</a></strong> </p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
Most people try to deepen their readings by accumulating more card meanings.<br data-astro-cid-kh7btl4r>
The COMPASS Method™ begins where that approach starts to fall short.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
It is designed for the stage at which meaning is no longer the main issue, when the real work becomes how to hold a question properly, how to recognise what matters, how to follow relationship and signal, and how to bring a reading through to clear, accurate closure.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>This is the why.</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>The how is what we teach where this work is <a href="/compass/" data-link="compass" data-astro-cid-kh7btl4r>applied in practice</a>.</p> <h2 class="about__h2" data-reveal data-astro-cid-kh7btl4r>Who This Is For</h2> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>This work is for people who:</p> <ul class="about__list" data-reveal data-astro-cid-kh7btl4r> <li data-astro-cid-kh7btl4r>Have spent time learning tarot and want something deeper than more definitions</li> <li data-astro-cid-kh7btl4r>Use the cards for personal reflection and want clearer, more grounded insight</li> <li data-astro-cid-kh7btl4r>Sense that their readings could be more accurate, more connected, or more complete</li> <li data-astro-cid-kh7btl4r>Prefer depth, precision, and clarity over volume or performance</li> </ul> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
You do not need to read for others for this to matter.<br data-astro-cid-kh7btl4r>
But you do need to be willing to look more closely at how you read.
</p> <h2 class="about__h2" data-reveal data-astro-cid-kh7btl4r>How to Use This Work</h2> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
You may arrive here through a single idea, something that puts language to an experience you have already had.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>If that happens, pay attention.</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
Because that moment of recognition is the same thing this work develops:<br data-astro-cid-kh7btl4r>
the ability to notice what is true, and follow it.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
The writing helps you see it.<br data-astro-cid-kh7btl4r>
The practice helps you hold it.
</p> <h2 class="about__h2" data-reveal data-astro-cid-kh7btl4r>What This Ultimately Is</h2> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
Tides of Knowing is for those who want to connect more deeply with what is present in a reading but not yet fully formed.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
What sits beyond literal meaning.<br data-astro-cid-kh7btl4r>
What emerges through the relationship between reader, cards, and seeker.
</p> <p class="about__p" data-reveal data-astro-cid-kh7btl4r>
And how to stay with that long enough for it to become clear, and speakable.
</p> <div class="about__cta about__cta--end" data-reveal data-astro-cid-kh7btl4r> ${renderComponent($$result2, "TdcConversionBlock", $$TdcConversionBlock, { "variant": "inline", "headingId": "tdc-about-close", "data-astro-cid-kh7btl4r": true })} </div> <p class="about__p about__footer-copy" data-reveal data-astro-cid-kh7btl4r>
© 2026 Tides of Knowing · Leigh Spencer. All rights reserved. Original content.
</p> </div> </article> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/about.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/about.astro";
const $$url = "/about";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$About,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
