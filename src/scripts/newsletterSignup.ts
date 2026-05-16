/**
 * First-party newsletter forms — POST to /api/newsletter-subscribe/
 */

const ENDPOINT = "/api/newsletter-subscribe/";
const ATTR_PREFIX = "tok_nl_attr_";

function setStatus(root: HTMLElement, message: string, isError: boolean): void {
  const el = root.querySelector("[data-newsletter-status]");
  if (!(el instanceof HTMLElement)) return;
  el.hidden = false;
  el.textContent = message;
  el.classList.toggle("is-error", isError);
  el.classList.toggle("is-success", !isError);
}

function resolveSourceComponent(form: HTMLFormElement): string {
  const fallback = form.dataset.sourceComponent ?? "";
  if (typeof window === "undefined") return fallback;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("source_component")?.trim();
    if (fromUrl) return fromUrl.slice(0, 200);
    const fromStorage = sessionStorage.getItem(`${ATTR_PREFIX}source_component`)?.trim();
    if (fromStorage) return fromStorage.slice(0, 200);
  } catch {
    /* ignore */
  }
  return fallback;
}

export function initNewsletterSignup(root: Document | HTMLElement = document): void {
  const forms = root.querySelectorAll<HTMLFormElement>("[data-newsletter-form]");
  forms.forEach((form) => {
    if (form.dataset.newsletterBound === "1") return;
    form.dataset.newsletterBound = "1";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const nameInput = form.querySelector<HTMLInputElement>('input[name="name"]');
      const emailInput = form.querySelector<HTMLInputElement>('input[type="email"]');
      const honeypot = form.querySelector<HTMLInputElement>('input[name="website"]');
      const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');

      if (!(emailInput instanceof HTMLInputElement)) return;

      const name = nameInput?.value.trim() ?? "";
      const email = emailInput.value.trim();

      if (!name) {
        setStatus(form, "Please enter your name.", true);
        nameInput?.focus();
        return;
      }

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
            name,
            email,
            website: honeypot?.value ?? "",
            source_component: resolveSourceComponent(form),
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
          setStatus(form, data.message ?? "Thanks. Check your inbox to confirm.", false);
          return;
        }

        if (data.code === "not_configured") {
          setStatus(form, data.error ?? "Signup is temporarily unavailable.", true);
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
    document.addEventListener("DOMContentLoaded", () => initNewsletterSignup());
  } else {
    initNewsletterSignup();
  }
}
