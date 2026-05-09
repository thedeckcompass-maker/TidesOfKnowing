globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../chunks/BaseLayout_DS19gWn5.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Terms = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Terms;
  const title = "Terms of Use | Tides of Knowing";
  const description = "Terms of Use for Tides of Knowing and the COMPASS programme.";
  const ogUrl = new URL("/terms/", siteBase(Astro2)).href;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "ogUrl": ogUrl, "data-astro-cid-y5py4vqc": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="legal page-inner" data-astro-cid-y5py4vqc> <h1 class="legal__title" data-astro-cid-y5py4vqc>Terms of Use</h1> <p class="legal__updated" data-astro-cid-y5py4vqc>Last updated: 30 April 2026</p> <p data-astro-cid-y5py4vqc>
By accessing this website and applying to the COMPASS programme, you agree to the following terms.
</p> <h2 data-astro-cid-y5py4vqc>Programme Nature</h2> <p data-astro-cid-y5py4vqc>
COMPASS is a live training programme designed to develop intuitive reading skills. It is not a certification, guarantee of results, or professional accreditation.
</p> <h2 data-astro-cid-y5py4vqc>Participation</h2> <p data-astro-cid-y5py4vqc>Participation requires:</p> <ul data-astro-cid-y5py4vqc> <li data-astro-cid-y5py4vqc>Engagement in live sessions</li> <li data-astro-cid-y5py4vqc>Willingness to receive feedback</li> <li data-astro-cid-y5py4vqc>Responsibility for your own learning and application</li> </ul> <h2 data-astro-cid-y5py4vqc>Payments</h2> <p data-astro-cid-y5py4vqc>Programme participation is confirmed upon payment.</p> <p data-astro-cid-y5py4vqc>All payments are processed via Stripe.</p> <h2 data-astro-cid-y5py4vqc>Refunds</h2> <p data-astro-cid-y5py4vqc>Refunds are available up to 48 hours before the programme begins.</p> <p data-astro-cid-y5py4vqc>No refunds are issued after the programme has started.</p> <h2 data-astro-cid-y5py4vqc>Intellectual Property</h2> <p data-astro-cid-y5py4vqc>
All materials, methods, and content provided within COMPASS remain the intellectual property of Tides of Knowing.
</p> <p data-astro-cid-y5py4vqc>They may not be copied, distributed, or reproduced without permission.</p> <h2 data-astro-cid-y5py4vqc>Disclaimer</h2> <p data-astro-cid-y5py4vqc>
The programme is for personal development and learning purposes only. It does not provide legal, financial, or medical advice.
</p> <h2 data-astro-cid-y5py4vqc>Changes</h2> <p data-astro-cid-y5py4vqc>
We reserve the right to update these terms at any time. Continued use of the website constitutes acceptance of any changes.
</p> <h2 data-astro-cid-y5py4vqc>Contact</h2> <p data-astro-cid-y5py4vqc>For any questions, contact:</p> <p data-astro-cid-y5py4vqc><a href="mailto:hello@tidesofknowing.com" data-astro-cid-y5py4vqc>hello@tidesofknowing.com</a></p> </article> ` })} `;
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/terms.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/terms.astro";
const $$url = "/terms";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Terms,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
