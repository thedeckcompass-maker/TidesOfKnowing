globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAstro, a as createComponent, b as renderTemplate, r as renderComponent, m as maybeRenderHead } from '../chunks/astro/server_N5NZJon5.mjs';
import { s as siteBase, $ as $$BaseLayout } from '../chunks/BaseLayout_DS19gWn5.mjs';
/* empty css                                   */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://www.tidesofknowing.com");
const $$Contact = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Contact;
  const title = "Contact | Tides of Knowing";
  const description = "Get in touch with Tides of Knowing.";
  const ogUrl = new URL("/contact/", siteBase(Astro2)).href;
  return renderTemplate(_a || (_a = __template(["", ' <script>\n  (function () {\n    const form = document.getElementById("contact-form");\n    const status = document.getElementById("contact-status");\n    if (!(form instanceof HTMLFormElement) || !(status instanceof HTMLElement)) return;\n\n    form.addEventListener("submit", async function (event) {\n      event.preventDefault();\n\n      const nameInput = form.querySelector("#name");\n      const emailInput = form.querySelector("#email");\n      const messageInput = form.querySelector("#message");\n\n      if (\n        !(nameInput instanceof HTMLInputElement) ||\n        !(emailInput instanceof HTMLInputElement) ||\n        !(messageInput instanceof HTMLTextAreaElement)\n      ) {\n        return;\n      }\n\n      const payload = {\n        name: nameInput.value.trim(),\n        email: emailInput.value.trim(),\n        message: messageInput.value.trim(),\n      };\n\n      if (!payload.name || !payload.email || !payload.message) {\n        status.textContent = "Please complete all required fields.";\n        return;\n      }\n\n      status.textContent = "Sending...";\n\n      try {\n        const response = await fetch("/api/contact", {\n          method: "POST",\n          headers: { "content-type": "application/json" },\n          body: JSON.stringify(payload),\n        });\n\n        const result = await response.json();\n\n        if (!response.ok || !result?.ok) {\n          status.textContent = "Something went wrong. Please try again.";\n          return;\n        }\n\n        form.reset();\n        status.textContent = "Your message has been sent.\\nI\u2019ll come back to you shortly.";\n      } catch (_error) {\n        status.textContent = "Something went wrong. Please try again.";\n      }\n    });\n  })();\n<\/script> '], ["", ' <script>\n  (function () {\n    const form = document.getElementById("contact-form");\n    const status = document.getElementById("contact-status");\n    if (!(form instanceof HTMLFormElement) || !(status instanceof HTMLElement)) return;\n\n    form.addEventListener("submit", async function (event) {\n      event.preventDefault();\n\n      const nameInput = form.querySelector("#name");\n      const emailInput = form.querySelector("#email");\n      const messageInput = form.querySelector("#message");\n\n      if (\n        !(nameInput instanceof HTMLInputElement) ||\n        !(emailInput instanceof HTMLInputElement) ||\n        !(messageInput instanceof HTMLTextAreaElement)\n      ) {\n        return;\n      }\n\n      const payload = {\n        name: nameInput.value.trim(),\n        email: emailInput.value.trim(),\n        message: messageInput.value.trim(),\n      };\n\n      if (!payload.name || !payload.email || !payload.message) {\n        status.textContent = "Please complete all required fields.";\n        return;\n      }\n\n      status.textContent = "Sending...";\n\n      try {\n        const response = await fetch("/api/contact", {\n          method: "POST",\n          headers: { "content-type": "application/json" },\n          body: JSON.stringify(payload),\n        });\n\n        const result = await response.json();\n\n        if (!response.ok || !result?.ok) {\n          status.textContent = "Something went wrong. Please try again.";\n          return;\n        }\n\n        form.reset();\n        status.textContent = "Your message has been sent.\\\\nI\u2019ll come back to you shortly.";\n      } catch (_error) {\n        status.textContent = "Something went wrong. Please try again.";\n      }\n    });\n  })();\n<\/script> '])), renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "ogUrl": ogUrl, "data-astro-cid-uw5kdbxl": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="contact page-inner" data-astro-cid-uw5kdbxl> <h1 class="contact__title" data-astro-cid-uw5kdbxl>Contact</h1> <p class="contact__intro" data-astro-cid-uw5kdbxl>If you have a question about COMPASS or need support, you can send a message here.</p> <form class="contact__form" id="contact-form" novalidate data-astro-cid-uw5kdbxl> <label class="contact__label" for="name" data-astro-cid-uw5kdbxl>Name</label> <input class="contact__input" id="name" name="name" type="text" required data-astro-cid-uw5kdbxl> <label class="contact__label" for="email" data-astro-cid-uw5kdbxl>Email</label> <input class="contact__input" id="email" name="email" type="email" required data-astro-cid-uw5kdbxl> <label class="contact__label" for="message" data-astro-cid-uw5kdbxl>Message</label> <textarea class="contact__textarea" id="message" name="message" rows="6" required data-astro-cid-uw5kdbxl></textarea> <button class="contact__button" type="submit" data-astro-cid-uw5kdbxl>Send</button> <p class="contact__status" id="contact-status" role="status" aria-live="polite" data-astro-cid-uw5kdbxl></p> </form> <p class="contact__fallback" data-astro-cid-uw5kdbxl>You can also email directly at <a href="mailto:hello@tidesofknowing.com" data-astro-cid-uw5kdbxl>hello@tidesofknowing.com</a></p> </article> ` }));
}, "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/contact.astro", void 0);

const $$file = "C:/Users/DELL 7410/Projects/TidesOfKnowing/src/pages/contact.astro";
const $$url = "/contact";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Contact,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
