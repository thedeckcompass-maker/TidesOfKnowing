/**
 * Field Notes sidebar newsletter — first-party POST to /api/newsletter-subscribe
 * (avoids MailerLite embed reCAPTCHA widget on blog pages).
 */

const ENDPOINT = "/api/newsletter-subscribe/";

function setStatus(root: HTMLElement, message: string, isError: boolean): void {
  const el = root.querySelector("[data-newsletter-status]");
  if (!(el instanceof HTMLElement)) return;
  el.hidden = false;
  el.textContent = message;
  el.classList.toggle("is-error", isError);
  el.classList.toggle("is-success", !isError);
}

export function initBlogNewsletterSignup(root: Document | HTMLElement = document): void {
  const forms = root.querySelectorAll<HTMLFormElement>("[data-blog-newsletter-form]");
  forms.forEach((form) => {
    if (form.dataset.blogNewsletterBound === "1") return;
    form.dataset.blogNewsletterBound = "1";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      const honeypot = form.querySelector<HTMLInputElement>('input[name="website"]');
      const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');

      if (!(emailInput instanceof HTMLInputElement)) return;

      const email = emailInput.value.trim();
      if (!email) {
        setStatus(form, "Please enter your email address.", true);
        emailInput.focus();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      setStatus(form, "Sending…", false);

      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            website: honeypot?.value ?? "",
            source_component: form.dataset.sourceComponent ?? "",
          }),
        });

        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          message?: string;
          code?: string;
        };

        if (data.ok) {
          form.reset();
          setStatus(form, data.message ?? "Thanks — check your inbox to confirm.", false);
          return;
        }

        if (data.code === "not_configured") {
          const subscribe = form.querySelector<HTMLAnchorElement>("[data-newsletter-fallback]");
          setStatus(
            form,
            subscribe
              ? "Signup is temporarily unavailable here. Use the link below."
              : (data.error ?? "Signup is temporarily unavailable."),
            true,
          );
          return;
        }

        setStatus(form, data.error ?? "Something went wrong. Please try again.", true);
      } catch {
        setStatus(form, "Network error. Please try again.", true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initBlogNewsletterSignup());
  } else {
    initBlogNewsletterSignup();
  }
}
