globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, b as renderTemplate, r as renderComponent, m as maybeRenderHead } from '../../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../../chunks/BaseLayout_DS19gWn5.mjs';
/* empty css                                    */
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Apply = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Apply;
  const title = "Apply for COMPASS | Tides of Knowing";
  const description = "A short COMPASS application reviewed personally to ensure the programme is a strong fit.";
  const ogUrl = new URL("/compass/apply/", siteBase(Astro2)).href;
  return renderTemplate(_a || (_a = __template(["", ' <script>\n  (function () {\n    const form = document.getElementById("compass-application-form");\n    const submitBtn = document.getElementById("compass-apply-submit");\n    const errorEl = document.getElementById("compass-apply-error");\n    const successEl = document.getElementById("compass-apply-success");\n\n    if (!(form instanceof HTMLFormElement)) return;\n    if (!(submitBtn instanceof HTMLButtonElement)) return;\n\n    form.addEventListener("submit", async function (event) {\n      event.preventDefault();\n      if (errorEl) errorEl.textContent = "";\n      if (successEl) successEl.hidden = true;\n\n      const formData = new FormData(form);\n      const payload = Object.fromEntries(formData.entries());\n\n      submitBtn.disabled = true;\n      submitBtn.textContent = "Submitting...";\n\n      try {\n        const response = await fetch("/api/compass-apply", {\n          method: "POST",\n          headers: { "content-type": "application/json" },\n          body: JSON.stringify(payload),\n        });\n\n        const data = await response.json().catch(function () {\n          return {};\n        });\n\n        if (!response.ok || !data.ok) {\n          throw new Error(data.error || "Unable to submit right now. Please try again.");\n        }\n\n        form.reset();\n        if (successEl) successEl.hidden = false;\n      } catch (err) {\n        if (errorEl) {\n          errorEl.textContent =\n            err instanceof Error ? err.message : "Unable to submit right now. Please try again.";\n        }\n      } finally {\n        submitBtn.disabled = false;\n        submitBtn.textContent = "Submit Application";\n      }\n    });\n  })();\n<\/script> '])), renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "ogUrl": ogUrl, "tdcPlacement": "none", "data-astro-cid-5f3zjvuo": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="compass-apply page-inner" data-astro-cid-5f3zjvuo> <header class="compass-apply__hero" data-astro-cid-5f3zjvuo> <p class="compass-apply__eyebrow" data-astro-cid-5f3zjvuo>COMPASS training application</p> <h1 class="compass-apply__title" data-astro-cid-5f3zjvuo>Apply for COMPASS</h1> <p class="compass-apply__subtext" data-astro-cid-5f3zjvuo>
A thoughtful application helps ensure this live programme is the right fit for where your reading practice is now.
</p> </header> <section class="compass-apply__panel" data-astro-cid-5f3zjvuo> <p class="compass-apply__intro" data-astro-cid-5f3zjvuo>
This is a short application, reviewed personally. You can expect a response within 48 hours.
</p> <p class="tok-ip-attribution" data-astro-cid-5f3zjvuo>
The COMPASS Method™ is an original interpretive framework created by Tides of Knowing.
</p> <form id="compass-application-form" class="compass-apply__form" data-astro-cid-5f3zjvuo> <div class="compass-apply__grid" data-astro-cid-5f3zjvuo> <label class="compass-apply__field" data-astro-cid-5f3zjvuo> <span data-astro-cid-5f3zjvuo>Name *</span> <input name="name" type="text" autocomplete="name" required data-astro-cid-5f3zjvuo> </label> <label class="compass-apply__field" data-astro-cid-5f3zjvuo> <span data-astro-cid-5f3zjvuo>Email *</span> <input name="email" type="email" autocomplete="email" required data-astro-cid-5f3zjvuo> </label> <label class="compass-apply__field" data-astro-cid-5f3zjvuo> <span data-astro-cid-5f3zjvuo>Location</span> <input name="location" type="text" autocomplete="address-level2" data-astro-cid-5f3zjvuo> </label> <label class="compass-apply__field" data-astro-cid-5f3zjvuo> <span data-astro-cid-5f3zjvuo>Experience level *</span> <select name="experience_level" required data-astro-cid-5f3zjvuo> <option value="" data-astro-cid-5f3zjvuo>Select one</option> <option value="Beginner" data-astro-cid-5f3zjvuo>Beginner</option> <option value="Developing" data-astro-cid-5f3zjvuo>Developing</option> <option value="Experienced" data-astro-cid-5f3zjvuo>Experienced</option> </select> </label> </div> <label class="compass-apply__field" data-astro-cid-5f3zjvuo> <span data-astro-cid-5f3zjvuo>What is not working in your readings right now? *</span> <textarea name="current_situation" rows="5" required data-astro-cid-5f3zjvuo></textarea> </label> <label class="compass-apply__field" data-astro-cid-5f3zjvuo> <span data-astro-cid-5f3zjvuo>What outcome are you wanting from COMPASS? *</span> <textarea name="desired_outcome" rows="5" required data-astro-cid-5f3zjvuo></textarea> </label> <label class="compass-apply__field" data-astro-cid-5f3zjvuo> <span data-astro-cid-5f3zjvuo>Why now? *</span> <textarea name="why_now" rows="5" required data-astro-cid-5f3zjvuo></textarea> </label> <div class="compass-apply__actions" data-astro-cid-5f3zjvuo> <button id="compass-apply-submit" type="submit" class="compass-apply__submit" data-astro-cid-5f3zjvuo>
Submit Application
</button> <p id="compass-apply-error" class="compass-apply__error" aria-live="polite" data-astro-cid-5f3zjvuo></p> </div> </form> <p id="compass-apply-success" class="compass-apply__success" hidden data-astro-cid-5f3zjvuo>
Your application has been received. I will review it personally and respond within 48 hours.
</p> </section> </article> ` }));
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/compass/apply.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/compass/apply.astro";
const $$url = "/compass/apply";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Apply,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
