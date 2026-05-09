globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../chunks/BaseLayout_DS19gWn5.mjs';
/* empty css                                   */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Privacy = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Privacy;
  const title = "Privacy Policy | Tides of Knowing";
  const description = "Privacy Policy for Tides of Knowing and the COMPASS programme.";
  const ogUrl = new URL("/privacy/", siteBase(Astro2)).href;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "ogUrl": ogUrl, "data-astro-cid-fb3qbcs3": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="legal page-inner" data-astro-cid-fb3qbcs3> <h1 class="legal__title" data-astro-cid-fb3qbcs3>Privacy Policy</h1> <p class="legal__updated" data-astro-cid-fb3qbcs3>Last updated: 30 April 2026</p> <p data-astro-cid-fb3qbcs3>
Tides of Knowing respects your privacy and is committed to protecting your personal information.
</p> <h2 data-astro-cid-fb3qbcs3>Information We Collect</h2> <p data-astro-cid-fb3qbcs3>We collect personal information when you:</p> <ul data-astro-cid-fb3qbcs3> <li data-astro-cid-fb3qbcs3>Submit an application for COMPASS</li> <li data-astro-cid-fb3qbcs3>Contact us directly</li> <li data-astro-cid-fb3qbcs3>Make a payment</li> </ul> <p data-astro-cid-fb3qbcs3>
This may include your name, email address, and any information you provide in your application.
</p> <h2 data-astro-cid-fb3qbcs3>How We Use Your Information</h2> <p data-astro-cid-fb3qbcs3>We use your information to:</p> <ul data-astro-cid-fb3qbcs3> <li data-astro-cid-fb3qbcs3>Review and respond to applications</li> <li data-astro-cid-fb3qbcs3>Deliver the COMPASS programme</li> <li data-astro-cid-fb3qbcs3>Communicate with you about your participation</li> <li data-astro-cid-fb3qbcs3>Process payments</li> </ul> <p data-astro-cid-fb3qbcs3>
We do not sell, rent, or share your personal information with third parties for marketing purposes.
</p> <h2 data-astro-cid-fb3qbcs3>Payments</h2> <p data-astro-cid-fb3qbcs3>Payments are processed securely through Stripe. We do not store your payment details.</p> <h2 data-astro-cid-fb3qbcs3>Data Storage</h2> <p data-astro-cid-fb3qbcs3>
Your information is stored securely and only retained for as long as necessary to deliver the programme and maintain communication.
</p> <h2 data-astro-cid-fb3qbcs3>Your Rights</h2> <p data-astro-cid-fb3qbcs3>
You may request access to or deletion of your personal information at any time by contacting us.
</p> <h2 data-astro-cid-fb3qbcs3>Contact</h2> <p data-astro-cid-fb3qbcs3>For any privacy-related questions, contact:</p> <p data-astro-cid-fb3qbcs3><a href="mailto:hello@tidesofknowing.com" data-astro-cid-fb3qbcs3>hello@tidesofknowing.com</a></p> </article> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/privacy.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/privacy.astro";
const $$url = "/privacy";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Privacy,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
